"""人物订阅纯逻辑单元测试（不依赖 MoviePilot 宿主，本地可直接运行）。

运行：``python -m pytest tests/v3/personsubscribe -q``
"""

from __future__ import annotations

import importlib.util
import sys
from datetime import date
from pathlib import Path

_CORE_PATH = Path(__file__).resolve().parents[3] / "plugins.v3" / "personsubscribe" / "core.py"
_spec = importlib.util.spec_from_file_location("personsubscribe_core", _CORE_PATH)
core = importlib.util.module_from_spec(_spec)
sys.modules["personsubscribe_core"] = core
_spec.loader.exec_module(core)


TODAY = date(2026, 10, 24)


def _work(**overrides):
    base = {
        "id": 100, "media_type": "movie", "title": "测试电影", "poster_path": "/x.jpg",
        "release_date": "2025-01-01", "vote_average": 7.5, "vote_count": 100,
        "popularity": 10.0, "genre_ids": [28, 35], "_entity_type": "movie",
    }
    base.update(overrides)
    if "media_type" in overrides and "_entity_type" not in overrides:
        base["_entity_type"] = overrides["media_type"]
    return base


def test_normalize_config_defaults_and_bounds():
    config = core.normalize_config(None)
    assert config == core.DEFAULT_CONFIG
    config = core.normalize_config({"media_types": [], "start_year": 9999,
                                    "min_rating": 99, "min_vote_count": -5,
                                    "roles": "hacker"})
    assert config["media_types"] == ["Movie", "TV"]
    assert config["start_year"] == 2200
    assert config["min_rating"] == 10.0
    assert config["min_vote_count"] == 0
    assert config["roles"] == "both"


def test_collect_works_filters_and_dedups():
    credits = {
        "cast": [
            _work(),
            _work(id=101, title="测试电影", popularity=20.0),  # 同名去重保留高热度
            _work(id=102, poster_path=None),                   # 无海报剔除
            _work(id=103, release_date=None),                  # 无上映日剔除
            {"id": 104},                                        # 非字典剔除
        ],
        "crew": [
            _work(id=105, media_type="tv", title="执导剧", first_air_date="2024-02-02",
                  release_date=None, job="Director"),
            _work(id=106, job="Screenplay"),                   # 非导演剔除
        ],
    }
    acting = core.collect_works(credits, core.normalize_config({"roles": "acting"}))
    assert [w["id"] for w in acting] == [101]
    directing = core.collect_works(credits, core.normalize_config({"roles": "directing"}))
    assert [w["id"] for w in directing] == [105]
    both = core.collect_works(credits, core.normalize_config({"roles": "both"}))
    assert {w["id"] for w in both} == {101, 105}
    assert both[0]["_role"] == "acting"


def test_passes_filter_full_matrix():
    config = core.normalize_config({
        "media_types": ["Movie"], "start_year": 2020,
        "genres_exclude": [10764], "genres_include": [28],
        "min_rating": 6.0, "min_vote_count": 50, "chinese_title_required": True,
    })
    assert core.passes_filter(_work(), config)
    # 媒体类型不符
    assert not core.passes_filter(_work(media_type="tv"), config)
    # 年份过旧
    assert not core.passes_filter(_work(release_date="2019-12-31"), config)
    # 题材排除（综艺）
    assert not core.passes_filter(_work(genre_ids=[10764]), config)
    # 题材包含不交集
    assert not core.passes_filter(_work(genre_ids=[35]), config)
    # 评分不足且投票数达标
    assert not core.passes_filter(_work(vote_average=5.0), config)
    # 投票数不足时不启用评分门禁
    assert core.passes_filter(_work(vote_average=5.0, vote_count=10), config)
    # 中文标题门禁
    assert not core.passes_filter(_work(title="English Only"), config)
    zh_off = core.normalize_config({**config, "chinese_title_required": False})
    assert core.passes_filter(_work(title="English Only"), zh_off)


def test_is_main_role_order():
    credits = {"cast": [
        {"id": 1, "order": 0}, {"id": 2, "order": 1}, {"id": 3, "order": 2},
        {"id": 4, "order": 3},
    ]}
    assert core.is_main_role(1, credits)
    assert core.is_main_role(3, credits)
    assert not core.is_main_role(4, credits)
    assert not core.is_main_role(99, credits)


def test_is_future_and_target_states():
    assert core.is_future("2027-01-01", TODAY)
    assert not core.is_future("2026-10-23", TODAY)
    assert not core.is_future("bad-date", TODAY)
    config = core.normalize_config(None)
    future = core.build_target(9, "张三", _work(release_date="2027-01-01"),
                               config, today=TODAY)
    assert future["status"] == "pending_release"
    released = core.build_target(9, "张三", _work(), config, today=TODAY)
    assert released["status"] == "wanted"
    assert released["key"] == "movie:100"
    tv = core.build_target(9, "张三", _work(media_type="tv", name="剧名",
                                            title=None, first_air_date="2024-01-01",
                                            release_date=None),
                           config, today=TODAY)
    assert tv["key"] == "tv:100" and tv["title"] == "剧名"


def test_merge_targets_idempotent_and_release_flip():
    config = core.normalize_config(None)
    person_a = core.build_target(1, "甲", _work(id=200), config, today=TODAY)
    person_a_future = core.build_target(
        1, "甲", _work(id=201, release_date="2027-01-01"), config, today=TODAY)
    existing = {"movie:200": person_a, "movie:201": person_a_future}
    # 同一人物重复刷新：幂等，不翻倍、不丢字段。
    desired = [core.build_target(1, "甲", _work(id=200), config, today=TODAY),
               core.build_target(1, "甲", _work(id=201, release_date="2026-01-01"),
                                 config, today=TODAY)]
    merged = core.merge_targets(existing, desired, 1)
    assert len(merged) == 2
    assert merged["movie:201"]["status"] == "wanted"  # 待映到期翻转
    # 第二个人物共享同一目标。
    desired_b = [core.build_target(2, "乙", _work(id=200), config, today=TODAY)]
    merged = core.merge_targets(merged, desired_b, 2)
    assert set(merged["movie:200"]["persons"]) == {"1", "2"}
    # 甲退订后目标仍由乙持有。
    merged = core.merge_targets(merged, [], 1)
    assert "movie:200" in merged and merged["movie:200"]["persons"] == {"2": "乙"}
    # 乙也退订且无订阅、非完成 → 目标删除。
    merged = core.merge_targets(merged, [], 2)
    assert "movie:200" not in merged


def test_merge_targets_keeps_fulfilled_orphan():
    config = core.normalize_config(None)
    target = core.build_target(1, "甲", _work(id=300), config, today=TODAY)
    target["status"] = "fulfilled"
    merged = core.merge_targets({"movie:300": target}, [], 1)
    assert "movie:300" in merged
    subscribed = core.build_target(1, "甲", _work(id=301), config, today=TODAY)
    subscribed["subscribe_id"] = 55
    merged = core.merge_targets({"movie:301": subscribed}, [], 1)
    assert "movie:301" in merged and merged["movie:301"].get("orphan") is True


def test_merge_targets_does_not_downgrade_terminal_states():
    config = core.normalize_config(None)
    ignored = core.build_target(1, "甲", _work(id=400), config, today=TODAY)
    ignored["status"] = "ignored"
    desired = [core.build_target(1, "甲", _work(id=400), config, today=TODAY)]
    merged = core.merge_targets({"movie:400": ignored}, desired, 1)
    assert merged["movie:400"]["status"] == "ignored"


def test_genres_table_has_variety():
    assert core.TMDB_GENRE_NAMES[10764] == "综艺"
    assert 28 in core.TMDB_GENRE_NAMES
