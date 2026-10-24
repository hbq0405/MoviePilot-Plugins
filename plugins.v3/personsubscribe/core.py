"""人物订阅纯逻辑层。

不依赖 MoviePilot 宿主，可独立导入做单元测试；``__init__.py`` 只负责
宿主接口、IO 与编排。行为口径对齐 ETKvNext ``modules/subscription/actor.py``：

- 作品源：TMDb combined_credits 的 cast（参演）+ crew（执导，job=Director）。
- 过滤：媒体类型、起始年份、题材包含/排除、评分×最低投票数组合门禁、
  仅主演（媒体演员表前 3 位）、可选中文标题门禁。
- 状态机：pending_release（未上映）/ wanted（已发行待订阅或订阅中）/
  fulfilled（入库完成）/ ignored（用户忽略）。
- 幂等：desired 与现有 targets 按 key 合并，多人物共享同一作品目标。
"""

from __future__ import annotations

import re
from datetime import date
from typing import Any, Iterable

DEFAULT_CONFIG = {
    "roles": "both",            # acting / directing / both
    "media_types": ["Movie", "TV"],
    "start_year": 1900,
    "genres_include": [],
    "genres_exclude": [],
    "min_rating": 0.0,
    "min_vote_count": 10,
    "main_role_only": False,
    "chinese_title_required": False,
    "quality": "",
    "resolution": "",
    "effect": "",
}

VALID_MEDIA_TYPES = {"Movie", "TV"}
VALID_ROLES = {"acting", "directing", "both"}

# TMDb 常用题材（电影/剧集通用 ID）中文名，供前端选择与展示。
TMDB_GENRE_NAMES = {
    28: "动作", 12: "冒险", 16: "动画", 35: "喜剧", 80: "犯罪",
    99: "纪录片", 18: "剧情", 10751: "家庭", 14: "奇幻", 36: "历史",
    27: "恐怖", 10402: "音乐", 9648: "悬疑", 10749: "爱情",
    878: "科幻", 10770: "电视电影", 53: "惊悚", 10752: "战争", 37: "西部",
    10759: "动作冒险", 10762: "儿童", 10763: "新闻", 10764: "综艺",
    10765: "纪实", 10766: "肥皂剧", 10767: "脱口秀", 10768: "战争",
}

TARGET_STATES = {"pending_release", "wanted", "fulfilled", "ignored"}


def normalize_config(value: object) -> dict[str, Any]:
    """归一化一份策略配置；非法字段回退默认值，保持可持久化形状。"""
    raw = value if isinstance(value, dict) else {}
    roles = str(raw.get("roles") or DEFAULT_CONFIG["roles"])
    if roles not in VALID_ROLES:
        roles = "both"
    media_types = [
        item for item in raw.get("media_types") or DEFAULT_CONFIG["media_types"]
        if item in VALID_MEDIA_TYPES
    ]
    if not media_types:
        media_types = list(DEFAULT_CONFIG["media_types"])
    try:
        start_year = max(1900, min(2200, int(raw.get("start_year") or 1900)))
    except (TypeError, ValueError):
        start_year = 1900
    try:
        min_rating = max(0.0, min(10.0, float(raw.get("min_rating") or 0)))
    except (TypeError, ValueError):
        min_rating = 0.0
    try:
        raw_votes = raw.get("min_vote_count")
        min_vote_count = max(
            0, int(DEFAULT_CONFIG["min_vote_count"] if raw_votes is None else raw_votes))
    except (TypeError, ValueError):
        min_vote_count = DEFAULT_CONFIG["min_vote_count"]
    include = _unique_ints(raw.get("genres_include"))
    exclude = _unique_ints(raw.get("genres_exclude"))
    return {
        "roles": roles,
        "media_types": media_types,
        "start_year": start_year,
        "genres_include": include,
        "genres_exclude": exclude,
        "min_rating": min_rating,
        "min_vote_count": min_vote_count,
        "main_role_only": bool(raw.get("main_role_only")),
        "chinese_title_required": bool(raw.get("chinese_title_required")),
        "quality": str(raw.get("quality") or "").strip(),
        "resolution": str(raw.get("resolution") or "").strip(),
        "effect": str(raw.get("effect") or "").strip(),
    }


def collect_works(credits: dict[str, Any], config: dict[str, Any]) -> list[dict[str, Any]]:
    """从 combined_credits 按策略取出参演/执导作品并按标题去重。

    去重口径与 ETKN 一致：标题归一键（去掉非单词字符、casefold），同键保留
    popularity 最高者；同一作品同时出现在 cast 和 crew 时天然合并。
    返回条目附 ``_entity_type``（movie/tv）与 ``_role``（acting/directing）。
    """
    works: list[dict[str, Any]] = []
    roles = config["roles"]
    if roles in ("acting", "both"):
        for raw in credits.get("cast") or []:
            if isinstance(raw, dict):
                works.append({**raw, "_entity_type": str(raw.get("media_type") or "movie"),
                              "_role": "acting"})
    if roles in ("directing", "both"):
        for raw in credits.get("crew") or []:
            if not isinstance(raw, dict):
                continue
            if str(raw.get("job") or "") != "Director":
                continue
            works.append({**raw, "_entity_type": str(raw.get("media_type") or "movie"),
                          "_role": "directing"})

    unique: dict[str, dict[str, Any]] = {}
    for work in works:
        if not work.get("id") or not work.get("poster_path"):
            continue
        release = work.get("release_date") or work.get("first_air_date")
        title = str(work.get("title") or work.get("name") or "").strip()
        if not release or not title:
            continue
        key = re.sub(r"\W+", "", title, flags=re.UNICODE).casefold()
        current = unique.get(key)
        if current is None or float(work.get("popularity") or 0) > float(
            current.get("popularity") or 0
        ):
            unique[key] = work
    return list(unique.values())


def passes_filter(work: dict[str, Any], config: dict[str, Any]) -> bool:
    """ETKN 口径的目标过滤器（media_types/start_year/题材/评分门禁/中文标题）。"""
    entity_type = str(work.get("_entity_type"))
    required_type = "Movie" if entity_type == "movie" else "TV"
    if required_type not in config["media_types"]:
        return False
    release = str(work.get("release_date") or work.get("first_air_date") or "")
    if release[:4].isdigit() and int(release[:4]) < config["start_year"]:
        return False
    genres = _int_ids(work.get("genre_ids"))
    include = set(config["genres_include"])
    exclude = set(config["genres_exclude"])
    if exclude.intersection(genres) or (include and include.isdisjoint(genres)):
        return False
    rating = float(work.get("vote_average") or 0)
    votes = int(work.get("vote_count") or 0)
    if (
        config["min_rating"] > 0
        and votes >= config["min_vote_count"]
        and rating > 0
        and rating < config["min_rating"]
    ):
        return False
    if config["chinese_title_required"]:
        return bool(re.search(r"[一-鿿]",
                              str(work.get("title") or work.get("name") or "")))
    return True


def is_main_role(person_id: int, media_credits: dict[str, Any]) -> bool:
    """仅主演判定：出现在媒体 cast 列表前 3 位（TMDb cast 按番位排序）。"""
    for index, cast in enumerate(media_credits.get("cast") or []):
        if index >= 3:
            break
        if int(cast.get("id") or 0) == person_id:
            return True
    return False


def is_future(value: str, today: date | None = None) -> bool:
    try:
        return date.fromisoformat(str(value)[:10]) > (today or date.today())
    except (TypeError, ValueError):
        return False


def work_key(entity_type: str, tmdb_id: Any) -> str:
    return f"{entity_type}:{tmdb_id}"


def build_target(person_id: int, person_name: str, work: dict[str, Any],
                 config: dict[str, Any], today: date | None = None) -> dict[str, Any]:
    """把一部通过过滤的作品转成插件 target（整剧/整片粒度，不拆季）。"""
    entity_type = str(work.get("_entity_type"))
    tmdb_id = int(work["id"])
    release = str(work.get("release_date") or work.get("first_air_date") or "")
    future = is_future(release, today)
    return {
        "key": work_key(entity_type, tmdb_id),
        "entity_type": entity_type,
        "tmdb_id": tmdb_id,
        "title": work.get("title") or work.get("name") or "",
        "poster_path": work.get("poster_path"),
        "release_date": release or None,
        "vote_average": work.get("vote_average"),
        "vote_count": work.get("vote_count"),
        "popularity": work.get("popularity"),
        "genre_ids": _int_ids(work.get("genre_ids")),
        "role": str(work.get("_role")),
        "status": "pending_release" if future else "wanted",
        "subscribe_id": None,
        "persons": {str(person_id): person_name},
        "last_change": None,
    }


def merge_targets(existing: dict[str, dict[str, Any]],
                  desired: Iterable[dict[str, Any]],
                  person_id: int) -> dict[str, dict[str, Any]]:
    """幂等合并：desired 覆盖元数据、补挂来源；脱离 desired 的来源摘除。

    - existing 中状态为 ignored/fulfilled 的条目不因刷新被自动降级。
    - pending_release 条目到期后翻转为 wanted（对齐 ETKN 上映翻转契约）。
    - 来源清空的条目删除，除非它已有订阅或非终态且由其它来源持有。
    """
    pid = str(person_id)
    result = {
        key: {**target, "persons": dict(target.get("persons") or {})}
        for key, target in existing.items()
    }
    desired_keys = set()
    for target in desired:
        key = target["key"]
        desired_keys.add(key)
        current = result.get(key)
        if current is None:
            fresh = dict(target)
            fresh["persons"] = {pid: next(iter(target["persons"].values()))}
            result[key] = fresh
            continue
        for field in ("title", "poster_path", "release_date", "vote_average",
                      "vote_count", "popularity", "genre_ids"):
            current[field] = target.get(field)
        current.setdefault("persons", {})[pid] = target["persons"][pid]
        if current["status"] == "pending_release" and target["status"] == "wanted":
            current["status"] = "wanted"
    for key in [k for k, t in result.items() if pid in (t.get("persons") or {})]:
        target = result[key]
        if key in desired_keys:
            continue
        target["persons"].pop(pid, None)
        if not target["persons"]:
            # 无任何人物来源：已有订阅或已完成的保留展示，其余删除。
            if target.get("subscribe_id") or target.get("status") in ("fulfilled",):
                target["orphan"] = True
            else:
                result.pop(key, None)
    return result


def _int_ids(values: Iterable[Any] | None) -> list[int]:
    result = []
    for value in values or []:
        try:
            number = int(value)
        except (TypeError, ValueError):
            continue
        result.append(number)
    return result


def _unique_ints(values: Iterable[Any] | None) -> list[int]:
    return list(dict.fromkeys(_int_ids(values)))
