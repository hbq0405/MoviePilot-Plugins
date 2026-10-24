"""人物订阅（PersonSubscribe）——MoviePilot v3 插件。

订阅演员/导演的 TMDb 人物（搜索时展示头像与代表作，人工确认，杜绝同名误订阅），
周期扫描其参演/执导作品，按策略过滤（媒体类型、年份、题材包含/排除、评分、
仅主演等，可排除综艺等不想要的题材），命中即在媒体库查缺并创建 MoviePilot 订阅；
未上映作品保持待映状态，上映后自动翻转补订。

移植自 ETKvNext ``modules/subscription/actor.py`` 的成熟行为，差异见 README：
- 目标粒度为整片/整剧（MP 原生订阅自动管理缺集与追更），不拆季。
- 需求即 MP 订阅，无独立 demand 层；订阅完成事件直接收口。
"""

from __future__ import annotations

import threading
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple

from apscheduler.triggers.cron import CronTrigger

from app.chain.download import DownloadChain
from app.chain.subscribe import SubscribeChain
from app.plugins import _PluginBase
from app.schemas import MediaInfo
from app.schemas.types import EventType, MediaSource, MediaType
from app.sdk.config import settings
from app.sdk.events import Event, eventmanager
from app.sdk.logging import logger
from app.sdk.media import MetaInfo
from app.sdk.network import RequestUtils
from app.sdk.scheduler import add_plugin_once_job, remove_plugin_once_job

from . import core

PLUGIN_ID = "PersonSubscribe"

DEFAULT_PLUGIN_CONFIG = {
    "enabled": False,
    "onlyonce": False,
    "cron": "30 5 * * *",
    "notify": True,
    "username": "人物订阅",
    "language": "zh-CN",
    "default_config": dict(core.DEFAULT_CONFIG),
}


class PersonSubscribe(_PluginBase):
    """订阅人物（演员/导演）并自动为其作品创建 MoviePilot 订阅。"""

    plugin_name = "人物订阅"
    plugin_desc = (
        "搜索 TMDb 订阅演员/导演（头像+代表作人工确认，不误订同名人物），"
        "自动扫描其参演/执导作品，按题材/年份/评分/番位等策略过滤后创建订阅；"
        "未上映作品待映跟踪，上映后自动补订，支持逐人物策略、暂停恢复与手动刷新。"
    )
    plugin_icon = "personsubscribe.png"
    plugin_version = "1.0.0"
    plugin_author = "hbq0405"
    author_url = "https://github.com/hbq0405"
    plugin_config_prefix = "personsubscribe_"
    plugin_order = 27
    auth_level = 2

    _lock = threading.Lock()
    _request: Optional[RequestUtils] = None

    def __init__(self):
        super().__init__()
        self._enabled = False
        self._onlyonce = False
        self._cron = ""
        self._notify = True
        self._username = DEFAULT_PLUGIN_CONFIG["username"]
        self._language = DEFAULT_PLUGIN_CONFIG["language"]
        self._default_config = dict(core.DEFAULT_CONFIG)

    # ─── 生命周期 ─────────────────────────────────────────
    def init_plugin(self, config: Optional[Dict[str, Any]] = None) -> None:
        self.stop_service()
        if config:
            self._enabled = bool(config.get("enabled"))
            self._onlyonce = bool(config.get("onlyonce"))
            self._cron = str(config.get("cron") or "").strip()
            self._notify = bool(config.get("notify"))
            self._username = str(config.get("username") or "").strip() or "人物订阅"
            self._language = str(config.get("language") or "").strip() or "zh-CN"
            self._default_config = core.normalize_config(config.get("default_config"))
        if self._onlyonce:
            self._onlyonce = False
            self.__update_config()
            self._run_once("refresh_all", self.refresh_all, "人物订阅立即运行一次")
        if self._cron and not self._enabled:
            logger.warning("人物订阅：已设置执行周期但插件未启用，不注册服务")

    def get_state(self) -> bool:
        return self._enabled

    def stop_service(self) -> None:
        try:
            remove_plugin_once_job(PLUGIN_ID, "refresh_all")
        except Exception as err:
            logger.debug(f"人物订阅：清理一次性任务忽略异常：{err}")
        self._request = None

    def _run_once(self, job_id: str, func: Any, name: str, **kwargs) -> None:
        try:
            add_plugin_once_job(
                PLUGIN_ID,
                job_id,
                func,
                name,
                delay_seconds=3,
                func_kwargs=kwargs or None,
            )
        except Exception as err:
            logger.error(f"人物订阅：注册一次性任务失败：{err}")

    def _refresh_person_and_submit(self, person_id: int) -> None:
        """单人扫描后立即提交待订阅目标（新增/手动刷新路径）。"""
        self.refresh_person(person_id)
        self._submit_wanted()

    def __update_config(self) -> None:
        self.update_config({
            "enabled": self._enabled,
            "onlyonce": self._onlyonce,
            "cron": self._cron,
            "notify": self._notify,
            "username": self._username,
            "language": self._language,
            "default_config": self._default_config,
        })

    # ─── 渲染模式：Vue 联邦 ───────────────────────────────
    @staticmethod
    def get_render_mode() -> Tuple[str, Optional[str]]:
        return "vue", "dist/assets"

    def get_form(self) -> Tuple[Optional[List[Dict[str, Any]]], Dict[str, Any]]:
        """设置弹窗由前端 Config.vue 渲染；后端只返回默认配置模型。"""
        return [], {
            "enabled": self._enabled,
            "onlyonce": False,
            "cron": self._cron or DEFAULT_PLUGIN_CONFIG["cron"],
            "notify": self._notify,
            "username": self._username,
            "language": self._language,
            "default_config": self._default_config,
        }

    def get_page(self) -> List[Dict[str, Any]]:
        """详情页由联邦 Page.vue 渲染。"""
        return []

    def get_service(self) -> Optional[List[Dict[str, Any]]]:
        if not (self._enabled and self._cron):
            return []
        try:
            trigger = CronTrigger.from_crontab(self._cron)
        except ValueError as err:
            logger.error(f"人物订阅：执行周期配置错误：{err}")
            return []
        return [{
            "id": f"{PLUGIN_ID}Refresh",
            "name": "人物订阅作品扫描",
            "trigger": trigger,
            "func": self.refresh_all,
            "kwargs": {"trigger": "cron"},
        }]

    @staticmethod
    def get_command() -> Optional[List[Dict[str, Any]]]:
        return [{
            "cmd": "/ps_refresh",
            "event": EventType.PluginAction,
            "desc": "人物订阅作品扫描",
            "category": "订阅",
            "data": {"action": f"{PLUGIN_ID}Refresh"},
        }]

    # ─── 插件 API（Vue 联邦前端调用，bear 鉴权）────────────
    def get_api(self) -> List[Dict[str, Any]]:
        return [
            {"path": "/search", "endpoint": self.api_search,
             "methods": ["GET"], "auth": "bear", "summary": "搜索 TMDb 人物"},
            {"path": "/persons", "endpoint": self.api_list_persons,
             "methods": ["GET"], "auth": "bear", "summary": "人物订阅列表"},
            {"path": "/persons", "endpoint": self.api_add_person,
             "methods": ["POST"], "auth": "bear", "summary": "添加人物订阅"},
            {"path": "/persons/{person_id}", "endpoint": self.api_get_person,
             "methods": ["GET"], "auth": "bear", "summary": "人物订阅详情"},
            {"path": "/persons/{person_id}", "endpoint": self.api_update_person,
             "methods": ["PUT"], "auth": "bear", "summary": "更新人物订阅"},
            {"path": "/persons/{person_id}", "endpoint": self.api_delete_person,
             "methods": ["DELETE"], "auth": "bear", "summary": "删除人物订阅"},
            {"path": "/persons/{person_id}/refresh", "endpoint": self.api_refresh_person,
             "methods": ["POST"], "auth": "bear", "summary": "手动刷新单个人物"},
            {"path": "/refresh", "endpoint": self.api_refresh_all,
             "methods": ["POST"], "auth": "bear", "summary": "手动刷新全部人物"},
            {"path": "/targets", "endpoint": self.api_list_targets,
             "methods": ["GET"], "auth": "bear", "summary": "作品目标列表"},
            {"path": "/targets/{target_key}/status", "endpoint": self.api_set_target_status,
             "methods": ["PUT"], "auth": "bear", "summary": "忽略或恢复作品目标"},
            {"path": "/config", "endpoint": self.api_get_config,
             "methods": ["GET"], "auth": "bear", "summary": "读取插件配置"},
            {"path": "/genres", "endpoint": self.api_genres,
             "methods": ["GET"], "auth": "bear", "summary": "TMDb 题材对照表"},
        ]

    # ─── 数据读写 ─────────────────────────────────────────
    def _load_persons(self) -> Dict[str, Dict[str, Any]]:
        persons = self.get_data("persons")
        return persons if isinstance(persons, dict) else {}

    def _save_persons(self, persons: Dict[str, Dict[str, Any]]) -> None:
        self.save_data("persons", persons)

    def _load_targets(self) -> Dict[str, Dict[str, Any]]:
        targets = self.get_data("targets")
        return targets if isinstance(targets, dict) else {}

    def _save_targets(self, targets: Dict[str, Dict[str, Any]]) -> None:
        self.save_data("targets", targets)

    def _append_history(self, action: str, title: str, mtype: str,
                        person: str, detail: str = "") -> None:
        history = self.get_data("history")
        if not isinstance(history, list):
            history = []
        history.append({
            "time": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "action": action,
            "title": title,
            "type": mtype,
            "person": person,
            "detail": detail,
        })
        self.save_data("history", history[-500:])

    def _person_config(self, person: Dict[str, Any]) -> Dict[str, Any]:
        override = person.get("config")
        if isinstance(override, dict) and override:
            merged = {**self._default_config, **core.normalize_config(override)}
            return core.normalize_config(merged)
        return dict(self._default_config)

    @staticmethod
    def _poster_url(poster_path: Optional[str]) -> Optional[str]:
        if not poster_path:
            return None
        return f"https://{settings.TMDB_IMAGE_DOMAIN}/t/p/w185{poster_path}"

    # ─── TMDb 直连（combined_credits 一次拿全量含 crew，避开链层假分页）──
    def _client(self) -> RequestUtils:
        if self._request is None:
            self._request = RequestUtils(
                headers={"User-Agent": settings.USER_AGENT},
                timeout=15,
            )
        return self._request

    def _tmdb_get(self, path: str, **params: Any) -> Optional[dict]:
        query = {"api_key": settings.TMDB_API_KEY, "language": self._language}
        query.update({k: v for k, v in params.items() if v is not None})
        url = f"https://{settings.TMDB_API_DOMAIN}/3{path}"
        try:
            return self._client().get_json(url, params=query) or {}
        except Exception as err:
            logger.warning(f"人物订阅：TMDb 请求失败 {path}：{err}")
            return None

    def search_persons(self, name: str) -> List[Dict[str, Any]]:
        result = self._tmdb_get("/search/person", query=name.strip()) or {}
        items = []
        for raw in result.get("results") or []:
            if not raw.get("id"):
                continue
            known_for = [
                {
                    "title": item.get("title") or item.get("name") or "",
                    "date": item.get("release_date") or item.get("first_air_date") or "",
                }
                for item in (raw.get("known_for") or [])[:3]
                if isinstance(item, dict)
            ]
            items.append({
                "person_id": int(raw["id"]),
                "name": raw.get("name") or "",
                "original_name": raw.get("original_name") or "",
                "profile_url": self._poster_url(raw.get("profile_path")),
                "known_for_department": raw.get("known_for_department") or "",
                "popularity": raw.get("popularity") or 0,
                "known_for": known_for,
            })
        return items[:12]

    def _person_credits(self, person_id: int) -> Optional[Dict[str, Any]]:
        return self._tmdb_get(f"/person/{person_id}/combined_credits")

    def _media_credits(self, entity_type: str, tmdb_id: int) -> Dict[str, Any]:
        path = f"/{'movie' if entity_type == 'movie' else 'tv'}/{tmdb_id}/credits"
        return self._tmdb_get(path) or {}

    # ─── 刷新主流程 ───────────────────────────────────────
    def refresh_all(self, trigger: str = "manual") -> Dict[str, Any]:
        with self._lock:
            persons = self._load_persons()
        active = [
            person for person in persons.values()
            if person.get("status", "active") == "active"
        ]
        if not active:
            logger.info("人物订阅：暂无启用的人物，跳过本轮扫描")
            return {"persons_checked": 0, "targets": 0, "subscribed": 0,
                    "pending_release": 0, "fulfilled": 0, "failed": 0}
        stats = {
            "persons_checked": 0, "targets": 0, "subscribed": 0,
            "pending_release": 0, "fulfilled": 0, "failed": 0,
        }
        with ThreadPoolExecutor(max_workers=min(3, len(active))) as executor:
            futures = {
                executor.submit(self.refresh_person, int(person["person_id"])): person
                for person in active
            }
            for future in as_completed(futures):
                person = futures[future]
                try:
                    result = future.result()
                except Exception as err:
                    logger.exception(
                        "人物订阅：刷新人物失败 person_id=%s", person.get("person_id"))
                    result = {"failed": 1, "error": str(err)}
                if result.get("error"):
                    stats["failed"] += 1
                else:
                    stats["persons_checked"] += 1
                for key in ("targets", "subscribed", "pending_release", "fulfilled"):
                    stats[key] += int(result.get(key) or 0)
                logger.info(
                    "人物订阅：人物 %s 刷新完成，作品 %s、新订阅 %s、待映 %s、已完成 %s%s",
                    person.get("name"), result.get("targets") or 0,
                    result.get("subscribed") or 0, result.get("pending_release") or 0,
                    result.get("fulfilled") or 0,
                    f"、失败原因：{result.get('error')}" if result.get("error") else "",
                )
        # 提交阶段串行执行，避免并发写订阅表与通知洪峰。
        stats["subscribed"] += self._submit_wanted()
        logger.info("人物订阅：本轮扫描完成 %s", stats)
        if self._notify and stats["subscribed"]:
            self.post_message(
                title="人物订阅扫描完成",
                text=(f"检查人物 {stats['persons_checked']} 个，新增订阅 "
                      f"{stats['subscribed']} 个，待上映 {stats['pending_release']} 个，"
                      f"已完成 {stats['fulfilled']} 个，失败 {stats['failed']} 个。"),
            )
        return stats

    def refresh_person(self, person_id: int) -> Dict[str, Any]:
        """扫描单个人物作品并合并目标；返回统计。"""
        result = {
            "targets": 0, "subscribed": 0, "pending_release": 0,
            "fulfilled": 0, "error": None,
        }
        with self._lock:
            persons = self._load_persons()
        person = persons.get(str(person_id))
        if person is None:
            result["error"] = "人物不存在"
            return result
        if person.get("status", "active") != "active":
            return result
        config = self._person_config(person)
        credits = self._person_credits(person_id)
        if credits is None:
            result["error"] = "TMDb 人物作品请求失败"
            self._mark_person_error(persons, person_id, result["error"])
            return result
        works = core.collect_works(credits, config)
        desired = []
        for work in works:
            if not core.passes_filter(work, config):
                continue
            if config["main_role_only"] and work.get("_role") == "acting":
                media_credits = self._media_credits(
                    str(work["_entity_type"]), int(work["id"]))
                if not core.is_main_role(person_id, media_credits):
                    continue
            desired.append(core.build_target(person_id, str(person.get("name") or ""),
                                             work, config))
        with self._lock:
            persons = self._load_persons()
            targets = self._load_targets()
            merged = core.merge_targets(targets, desired, person_id)
            result["targets"] = len(merged)
            result["pending_release"] = sum(
                1 for t in merged.values() if t.get("status") == "pending_release")
            result["fulfilled"] = sum(
                1 for t in merged.values() if t.get("status") == "fulfilled")
            if str(person_id) in persons:
                persons[str(person_id)]["last_checked_at"] = (
                    datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
                persons[str(person_id)]["last_error"] = None
            self._save_persons(persons)
            self._save_targets(merged)
        return result

    def _mark_person_error(self, persons: Dict[str, Dict[str, Any]],
                           person_id: int, message: str) -> None:
        with self._lock:
            fresh = self._load_persons()
            record = fresh.get(str(person_id))
            if record is None:
                return
            record["last_error"] = message
            record["last_checked_at"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            self._save_persons(fresh)
            persons.clear()
            persons.update(fresh)

    def _submit_wanted(self) -> int:
        """把待订阅目标逐个查缺并创建 MP 订阅；返回新建数量。"""
        with self._lock:
            targets = self._load_targets()
        submitted = 0
        changed = False
        for key, target in list(targets.items()):
            if target.get("status") != "wanted" or target.get("subscribe_id"):
                continue
            if target.get("external_subscribe"):
                continue
            try:
                if self._submit_target(target):
                    submitted += 1
                    changed = True
                elif target.get("status") == "fulfilled" or target.get("external_subscribe"):
                    changed = True
            except Exception as err:
                logger.error(f"人物订阅：创建订阅失败 {target.get('title')}：{err}")
        if changed:
            with self._lock:
                self._save_targets(targets)
        return submitted

    def _submit_target(self, target: Dict[str, Any]) -> bool:
        """查缺并提交单个目标订阅；原地更新 target 状态，返回是否新建。"""
        mtype = MediaType.MOVIE if target["entity_type"] == "movie" else MediaType.TV
        work = self._target_tmdb_info(target)
        mediainfo = MediaInfo(tmdb_info=work)
        if getattr(mediainfo, "type", None) is None:
            mediainfo.type = mtype
        meta = MetaInfo(target.get("title") or "")
        meta.type = mtype
        try:
            exist_flag, _ = DownloadChain().get_no_exists_info(
                meta=meta, mediainfo=mediainfo)
        except Exception as err:
            logger.warning(f"人物订阅：查询媒体库失败 {target.get('title')}：{err}")
            return False
        person_names = "、".join(
            name for name in (target.get("persons") or {}).values())
        if exist_flag:
            target["status"] = "fulfilled"
            self._append_history("已存在", target.get("title") or "",
                                 mtype.value, person_names, "媒体库中已存在")
            return False
        config = self._match_config(target)
        try:
            subscribe_id, error = SubscribeChain().add(
                title=target.get("title") or "",
                year=str(target.get("release_date") or "")[:4],
                mtype=mtype,
                media_source=MediaSource.TMDB,
                media_id=str(target["tmdb_id"]),
                exist_ok=True,
                quality=config.get("quality") or None,
                resolution=config.get("resolution") or None,
                effect=config.get("effect") or None,
                username=self._username,
            )
        except Exception as err:
            logger.error(f"人物订阅：添加订阅异常 {target.get('title')}：{err}")
            return False
        if not subscribe_id:
            message = str(error or "")
            if "已存在" in message or "存在" in message:
                target["external_subscribe"] = True
                logger.info(f"人物订阅：{target.get('title')} 已存在外部订阅，等待完成事件")
            else:
                logger.warning(f"人物订阅：添加订阅失败 {target.get('title')}：{message}")
            return False
        target["subscribe_id"] = int(subscribe_id)
        target["last_change"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        self._append_history("订阅", target.get("title") or "", mtype.value,
                             person_names, f"订阅 #{subscribe_id}")
        return True

    def _target_tmdb_info(self, target: Dict[str, Any]) -> Dict[str, Any]:
        """把 target 元数据还原成 TMDb 原始形状，供 MediaInfo 解析。"""
        is_movie = target["entity_type"] == "movie"
        info: Dict[str, Any] = {
            "id": target["tmdb_id"],
            "media_type": target["entity_type"],
            "poster_path": target.get("poster_path"),
            "vote_average": target.get("vote_average") or 0,
            "vote_count": target.get("vote_count") or 0,
            "popularity": target.get("popularity") or 0,
            "genre_ids": target.get("genre_ids") or [],
        }
        release = target.get("release_date")
        if is_movie:
            info["title"] = target.get("title")
            info["original_title"] = target.get("title")
            if release:
                info["release_date"] = release
        else:
            info["name"] = target.get("title")
            info["original_name"] = target.get("title")
            if release:
                info["first_air_date"] = release
        return info

    def _match_config(self, target: Dict[str, Any]) -> Dict[str, Any]:
        """命中目标的人物策略（多人物共享目标时取最近刷新的人物配置）。"""
        with self._lock:
            persons = self._load_persons()
        for pid in (target.get("persons") or {}):
            person = persons.get(str(pid))
            if person is not None:
                return self._person_config(person)
        return dict(self._default_config)

    # ─── 事件 ─────────────────────────────────────────────
    @eventmanager.register(EventType.SubscribeComplete)
    def on_subscribe_complete(self, event: Event) -> None:
        data = getattr(event, "event_data", None) or {}
        mediainfo = _field(data, "mediainfo") or {}
        media_id = str(
            _field(mediainfo, "tmdb_id")
            or _field(mediainfo, "tmdbid")
            or ""
        ).strip()
        if not media_id:
            source = str(_field(mediainfo, "media_source") or _field(
                mediainfo, "scrape_source") or "")
            if "themoviedb" not in source.lower():
                return
            media_id = str(_field(mediainfo, "media_id") or "").strip()
        if not media_id:
            return
        subscribe_id = _field(data, "subscribe_id")
        with self._lock:
            targets = self._load_targets()
            changed = False
            for key, target in targets.items():
                if str(target.get("tmdb_id")) != media_id:
                    continue
                if subscribe_id and target.get("subscribe_id") not in (None, subscribe_id):
                    continue
                if target.get("status") in ("fulfilled", "ignored"):
                    continue
                target["status"] = "fulfilled"
                target["subscribe_id"] = target.get("subscribe_id") or subscribe_id
                target["last_change"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                changed = True
                self._append_history(
                    "完成", target.get("title") or "", target.get("entity_type") or "",
                    "、".join((target.get("persons") or {}).values()),
                    f"订阅 #{subscribe_id} 完成")
            if changed:
                self._save_targets(targets)

    @eventmanager.register(EventType.SubscribeDeleted)
    def on_subscribe_deleted(self, event: Event) -> None:
        data = getattr(event, "event_data", None) or {}
        subscribe_info = _field(data, "subscribe_info") or {}
        media_id = str(
            _field(data, "tmdb_id")
            or _field(data, "media_id")
            or _field(subscribe_info, "media_id")
            or ""
        ).strip()
        subscribe_id = _field(data, "subscribe_id")
        with self._lock:
            targets = self._load_targets()
            changed = False
            for key, target in targets.items():
                if subscribe_id and target.get("subscribe_id") != subscribe_id:
                    continue
                if media_id and str(target.get("tmdb_id")) != media_id:
                    continue
                if target.get("status") == "fulfilled":
                    # 完成后的订阅清理不回退状态。
                    target["subscribe_id"] = None
                    changed = True
                    continue
                # 未完成即被删除视为用户拒绝：置 ignored，可在页面上恢复。
                target["status"] = "ignored"
                target["external_subscribe"] = False
                target["subscribe_id"] = None
                target["last_change"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                changed = True
            if changed:
                self._save_targets(targets)

    @eventmanager.register(EventType.PluginAction)
    def remote_refresh(self, event: Event) -> None:
        if not event:
            return
        data = getattr(event, "event_data", None) or {}
        if _field(data, "action") != f"{PLUGIN_ID}Refresh":
            return
        logger.info("人物订阅：收到命令，开始扫描人物作品 ...")
        self.post_message(channel=_field(data, "channel"),
                          title="开始人物订阅扫描 ...",
                          userid=_field(data, "user"))
        self.refresh_all(trigger="command")
        self.post_message(channel=_field(data, "channel"),
                          title="人物订阅扫描完成！",
                          userid=_field(data, "user"))

    # ─── API 实现 ─────────────────────────────────────────
    def api_search(self, name: str = "") -> Dict[str, Any]:
        name = (name or "").strip()
        if not name:
            return {"success": False, "message": "必须提供人物姓名"}
        try:
            return {"success": True, "items": self.search_persons(name)}
        except Exception as err:
            return {"success": False, "message": f"TMDb 人物搜索失败：{err}"}

    def api_list_persons(self) -> Dict[str, Any]:
        with self._lock:
            persons = self._load_persons()
            targets = self._load_targets()
        items = []
        for person in persons.values():
            pid = str(person.get("person_id"))
            related = [t for t in targets.values()
                       if pid in (t.get("persons") or {})]
            items.append({
                "person_id": person.get("person_id"),
                "name": person.get("name"),
                "original_name": person.get("original_name"),
                "profile_url": self._poster_url(person.get("profile_path")),
                "known_for_department": person.get("known_for_department"),
                "status": person.get("status", "active"),
                "config": person.get("config") or None,
                "last_checked_at": person.get("last_checked_at"),
                "last_error": person.get("last_error"),
                "stats": {
                    "total": len(related),
                    "wanted": sum(1 for t in related if t.get("status") == "wanted"),
                    "pending_release": sum(
                        1 for t in related if t.get("status") == "pending_release"),
                    "fulfilled": sum(
                        1 for t in related if t.get("status") == "fulfilled"),
                    "ignored": sum(1 for t in related if t.get("status") == "ignored"),
                },
            })
        items.sort(key=lambda item: str(item.get("name") or ""))
        return {"success": True, "items": items, "count": len(items)}

    def api_add_person(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        person_id = payload.get("person_id")
        try:
            person_id = int(person_id)
        except (TypeError, ValueError):
            return {"success": False, "message": "person_id 无效"}
        name = str(payload.get("name") or "").strip()
        if not name:
            return {"success": False, "message": "人物姓名不能为空"}
        with self._lock:
            persons = self._load_persons()
            if str(person_id) in persons:
                return {"success": False, "message": "该人物已被订阅"}
            config = None
            if isinstance(payload.get("config"), dict) and payload["config"]:
                config = core.normalize_config(payload["config"])
            persons[str(person_id)] = {
                "person_id": person_id,
                "name": name,
                "original_name": payload.get("original_name") or None,
                "profile_path": payload.get("profile_path") or None,
                "known_for_department": payload.get("known_for_department") or None,
                "status": "active",
                "config": config,
                "created_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "last_checked_at": None,
                "last_error": None,
            }
            self._save_persons(persons)
        self._run_once(
            f"refresh_person_{person_id}",
            lambda pid=person_id: self._refresh_person_and_submit(pid),
            f"人物订阅：扫描新人物 {name}",
        )
        return {"success": True, "message": f"人物 {name} 已订阅，正在扫描其作品"}

    def api_get_person(self, person_id: int) -> Dict[str, Any]:
        with self._lock:
            persons = self._load_persons()
            targets = self._load_targets()
        person = persons.get(str(person_id))
        if person is None:
            return {"success": False, "message": "人物订阅不存在"}
        pid = str(person_id)
        related = [
            self._target_payload(target)
            for key, target in targets.items() if pid in (target.get("persons") or {})
        ]
        related.sort(key=lambda item: str(item.get("release_date") or ""), reverse=True)
        return {
            "success": True,
            "person": {
                **person,
                "profile_url": self._poster_url(person.get("profile_path")),
                "config": person.get("config") or None,
            },
            "targets": related,
        }

    def api_update_person(self, person_id: int,
                          payload: Dict[str, Any]) -> Dict[str, Any]:
        with self._lock:
            persons = self._load_persons()
            person = persons.get(str(person_id))
            if person is None:
                return {"success": False, "message": "人物订阅不存在"}
            status = payload.get("status")
            if status is not None:
                if status not in ("active", "paused"):
                    return {"success": False, "message": "状态无效"}
                person["status"] = status
            if isinstance(payload.get("config"), dict):
                person["config"] = (
                    core.normalize_config(payload["config"]) or None
                ) if payload["config"] else None
            self._save_persons(persons)
        return {"success": True}

    def api_delete_person(self, person_id: int) -> Dict[str, Any]:
        with self._lock:
            persons = self._load_persons()
            if str(person_id) not in persons:
                return {"success": False, "message": "人物订阅不存在"}
            name = persons.pop(str(person_id)).get("name")
            targets = self._load_targets()
            targets = core.merge_targets(targets, [], person_id)
            self._save_persons(persons)
            self._save_targets(targets)
        return {"success": True, "message": f"人物 {name} 已删除"}

    def api_refresh_person(self, person_id: int) -> Dict[str, Any]:
        with self._lock:
            persons = self._load_persons()
        if str(person_id) not in persons:
            return {"success": False, "message": "人物订阅不存在"}
        name = persons[str(person_id)].get("name")
        self._run_once(
            f"refresh_person_{person_id}",
            lambda pid=person_id: self._refresh_person_and_submit(pid),
            f"人物订阅：手动刷新 {name}",
        )
        return {"success": True, "message": "刷新任务已提交"}

    def api_refresh_all(self) -> Dict[str, Any]:
        self._run_once("refresh_all", self.refresh_all,
                       "人物订阅：手动刷新全部人物", trigger="manual")
        return {"success": True, "message": "刷新任务已提交"}

    def api_list_targets(self, status: str = "") -> Dict[str, Any]:
        with self._lock:
            targets = self._load_targets()
        items = [
            self._target_payload(target)
            for target in targets.values()
            if not status or target.get("status") == status
        ]
        items.sort(key=lambda item: str(item.get("release_date") or ""), reverse=True)
        return {"success": True, "items": items, "count": len(items)}

    def api_set_target_status(self, target_key: str,
                              payload: Dict[str, Any]) -> Dict[str, Any]:
        status = str(payload.get("status") or "")
        if status not in core.TARGET_STATES:
            return {"success": False, "message": "状态无效"}
        with self._lock:
            targets = self._load_targets()
            target = targets.get(target_key)
            if target is None:
                return {"success": False, "message": "作品目标不存在"}
            target["status"] = status
            target["last_change"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            if status != "wanted":
                target["external_subscribe"] = False
            self._save_targets(targets)
        if status == "wanted":
            try:
                if self._submit_target(target):
                    with self._lock:
                        self._save_targets(targets)
            except Exception as err:
                logger.error(f"人物订阅：恢复目标失败 {target_key}：{err}")
        return {"success": True}

    def api_get_config(self) -> Dict[str, Any]:
        return {
            "success": True,
            "config": {
                "enabled": self._enabled,
                "cron": self._cron or DEFAULT_PLUGIN_CONFIG["cron"],
                "notify": self._notify,
                "username": self._username,
                "language": self._language,
                "default_config": self._default_config,
            },
        }

    @staticmethod
    def api_genres() -> Dict[str, Any]:
        return {
            "success": True,
            "genres": [
                {"id": gid, "name": name}
                for gid, name in sorted(core.TMDB_GENRE_NAMES.items(),
                                        key=lambda item: item[1])
            ],
        }

    def _target_payload(self, target: Dict[str, Any]) -> Dict[str, Any]:
        payload = dict(target)
        payload["poster_url"] = self._poster_url(target.get("poster_path"))
        payload["genre_names"] = [
            core.TMDB_GENRE_NAMES.get(gid, str(gid))
            for gid in target.get("genre_ids") or []
        ]
        return payload


def _field(data: Any, name: str) -> Any:
    if isinstance(data, dict):
        return data.get(name)
    return getattr(data, name, None)
