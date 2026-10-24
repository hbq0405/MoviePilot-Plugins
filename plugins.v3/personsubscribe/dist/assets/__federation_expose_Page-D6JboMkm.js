import { importShared } from './__federation_fn_import-JrT3xvdd.js';
import { _ as _sfc_main$1, p as pluginApi } from './api-aSRXrTbr.js';

const _export_sfc = (sfc, props) => {
  const target = sfc.__vccOpts || sfc;
  for (const [key, val] of props) {
    target[key] = val;
  }
  return target;
};

const {createElementVNode:_createElementVNode,toDisplayString:_toDisplayString,createTextVNode:_createTextVNode,resolveComponent:_resolveComponent,withCtx:_withCtx,createVNode:_createVNode,openBlock:_openBlock,createElementBlock:_createElementBlock,createCommentVNode:_createCommentVNode,createBlock:_createBlock,renderList:_renderList,Fragment:_Fragment,withKeys:_withKeys,withModifiers:_withModifiers} = await importShared('vue');


const _hoisted_1 = { class: "ps-page-root pa-4" };
const _hoisted_2 = { class: "d-flex align-center flex-wrap ga-2" };
const _hoisted_3 = {
  key: 0,
  class: "text-caption text-medium-emphasis mt-2"
};
const _hoisted_4 = {
  key: 0,
  class: "d-flex justify-center pa-8"
};
const _hoisted_5 = {
  key: 2,
  class: "ps-person-grid"
};
const _hoisted_6 = { class: "d-flex flex-nowrap" };
const _hoisted_7 = { class: "ps-avatar-wrap" };
const _hoisted_8 = {
  key: 1,
  class: "ps-avatar ps-avatar-empty d-flex align-center justify-center"
};
const _hoisted_9 = { class: "ps-person-body" };
const _hoisted_10 = { class: "d-flex align-center flex-wrap ga-1" };
const _hoisted_11 = { class: "text-subtitle-1 font-weight-medium" };
const _hoisted_12 = {
  key: 0,
  class: "text-caption text-medium-emphasis"
};
const _hoisted_13 = { class: "d-flex flex-wrap ga-1 mt-2" };
const _hoisted_14 = { class: "text-caption text-medium-emphasis mt-2" };
const _hoisted_15 = { class: "d-flex ga-2 mb-3" };
const _hoisted_16 = {
  key: 0,
  class: "d-flex justify-center pa-6"
};
const _hoisted_17 = {
  key: 3,
  class: "ps-search-list"
};
const _hoisted_18 = {
  key: 1,
  class: "ps-avatar ps-avatar-empty d-flex align-center justify-center"
};
const _hoisted_19 = { class: "ps-search-body" };
const _hoisted_20 = { class: "d-flex align-center flex-wrap ga-1" };
const _hoisted_21 = { class: "font-weight-medium" };
const _hoisted_22 = {
  key: 0,
  class: "text-caption text-medium-emphasis"
};
const _hoisted_23 = {
  key: 1,
  class: "text-caption text-medium-emphasis mt-1"
};
const _hoisted_24 = {
  key: 0,
  class: "d-flex justify-center pa-6"
};
const _hoisted_25 = { class: "text-caption text-medium-emphasis mb-3" };
const _hoisted_26 = {
  key: 2,
  class: "ps-target-list"
};
const _hoisted_27 = {
  key: 1,
  class: "ps-avatar ps-avatar-empty d-flex align-center justify-center"
};
const _hoisted_28 = { class: "ps-target-body" };
const _hoisted_29 = { class: "d-flex align-center flex-wrap ga-1" };
const _hoisted_30 = { class: "font-weight-medium" };
const _hoisted_31 = { class: "text-caption text-medium-emphasis" };
const _hoisted_32 = { class: "ps-target-actions" };
const _hoisted_33 = { class: "d-flex justify-end ga-2 mt-3" };

const {onMounted,reactive,ref} = await importShared('vue');


const _sfc_main = {
  __name: 'Page',
  emits: ['close'],
  setup(__props, { emit: __emit }) {

const emit = __emit;

const persons = ref([]);
const genres = ref([]);
const loading = ref(false);
const lastSummary = ref('');
const refreshingAll = ref(false);

const searchOpen = ref(false);
const searchQuery = ref('');
const searchResults = ref([]);
const searchLoading = ref(false);
const searchError = ref('');
const searched = ref(false);

const detailOpen = ref(false);
const detail = ref(null);
const detailLoading = ref(false);

const strategyOpen = ref(false);
const strategyDraft = ref({});
const strategySaving = ref(false);

const confirmDelete = ref(false);
const deleting = ref(false);

const snackbar = reactive({ show: false, text: '', color: 'success' });

const DEPARTMENT_NAMES = {
  Acting: '演员', Directing: '导演', Writing: '编剧', Production: '制作',
  Sound: '声音', Camera: '摄影', Art: '美术', Editing: '剪辑', Creator: '主创',
};

function notify(text, color = 'success') {
  snackbar.text = text;
  snackbar.color = color;
  snackbar.show = true;
}

function departmentName(item) {
  const key = String(item.known_for_department || '');
  return DEPARTMENT_NAMES[key] || key || '人物';
}

function isSubscribed(personId) {
  return persons.value.some((item) => item.person_id === personId);
}

function targetMeta(target) {
  if (target.status === 'fulfilled') return { text: '已完成', color: 'success' };
  if (target.status === 'pending_release') return { text: '待上映', color: 'default' };
  if (target.status === 'ignored') return { text: '已忽略', color: 'grey' };
  if (target.subscribe_id || target.external_subscribe) return { text: '订阅中', color: 'info' };
  return { text: '待订阅', color: 'warning' };
}

async function load() {
  loading.value = true;
  try {
    const response = await pluginApi.listPersons();
    persons.value = response.items || [];
    const total = persons.value.reduce((sum, p) => sum + p.stats.total, 0);
    const fulfilled = persons.value.reduce((sum, p) => sum + p.stats.fulfilled, 0);
    if (total) lastSummary.value = `共追踪 ${total} 部作品，已完成 ${fulfilled} 部`;
  } catch (error) {
    notify(`人物列表加载失败：${error.message || error}`, 'error');
  } finally {
    loading.value = false;
  }
}

async function loadGenres() {
  try {
    const response = await pluginApi.getGenres();
    genres.value = response.genres || [];
  } catch (error) {
    genres.value = [];
  }
}

function openSearch() {
  searchOpen.value = true;
}

async function runSearch() {
  const name = searchQuery.value.trim();
  if (!name) return;
  searchLoading.value = true;
  searchError.value = '';
  try {
    const response = await pluginApi.search(name);
    if (response.success === false) {
      searchError.value = response.message || '搜索失败';
      searchResults.value = [];
    } else {
      searchResults.value = response.items || [];
    }
    searched.value = true;
  } catch (error) {
    searchError.value = `搜索失败：${error.message || error}`;
  } finally {
    searchLoading.value = false;
  }
}

async function addPerson(item) {
  try {
    const response = await pluginApi.addPerson({
      person_id: item.person_id,
      name: item.name,
      original_name: item.original_name,
      profile_path: item.profile_path,
      known_for_department: item.known_for_department,
    });
    if (response.success === false) {
      notify(response.message || '添加失败', 'error');
      return;
    }
    notify(response.message || '已添加');
    await load();
  } catch (error) {
    notify(`添加失败：${error.message || error}`, 'error');
  }
}

async function openDetail(person) {
  detailOpen.value = true;
  detailLoading.value = true;
  detail.value = null;
  try {
    const response = await pluginApi.getPerson(person.person_id);
    if (response.success === false) {
      notify(response.message || '详情加载失败', 'error');
      detailOpen.value = false;
      return;
    }
    detail.value = response;
  } catch (error) {
    notify(`详情加载失败：${error.message || error}`, 'error');
    detailOpen.value = false;
  } finally {
    detailLoading.value = false;
  }
}

async function togglePersonStatus() {
  if (!detail.value) return;
  const next = detail.value.person.status === 'active' ? 'paused' : 'active';
  try {
    const response = await pluginApi.updatePerson(detail.value.person.person_id, {
      status: next,
    });
    if (response.success === false) {
      notify(response.message || '操作失败', 'error');
      return;
    }
    detail.value.person.status = next;
    notify(next === 'active' ? '已恢复' : '已暂停');
    await load();
  } catch (error) {
    notify(`操作失败：${error.message || error}`, 'error');
  }
}

async function refreshPerson() {
  if (!detail.value) return;
  try {
    const response = await pluginApi.refreshPerson(detail.value.person.person_id);
    notify(response.message || '刷新任务已提交');
  } catch (error) {
    notify(`刷新提交失败：${error.message || error}`, 'error');
  }
}

async function onRefreshAll() {
  refreshingAll.value = true;
  try {
    const response = await pluginApi.refreshAll();
    notify(response.message || '刷新任务已提交');
  } catch (error) {
    notify(`刷新提交失败：${error.message || error}`, 'error');
  } finally {
    refreshingAll.value = false;
  }
}

function openStrategy() {
  if (!detail.value) return;
  strategyDraft.value = { ...(detail.value.person.config || {}) };
  strategyOpen.value = true;
}

function useDefaultStrategy() {
  strategyDraft.value = {};
}

async function saveStrategy() {
  if (!detail.value) return;
  strategySaving.value = true;
  try {
    const config = { ...strategyDraft.value };
    const hasOverride = Object.keys(config).length > 0;
    const response = await pluginApi.updatePerson(detail.value.person.person_id, {
      config: hasOverride ? config : null,
    });
    if (response.success === false) {
      notify(response.message || '保存失败', 'error');
      return;
    }
    notify('策略已保存');
    strategyOpen.value = false;
    detail.value.person.config = hasOverride ? config : null;
  } catch (error) {
    notify(`保存失败：${error.message || error}`, 'error');
  } finally {
    strategySaving.value = false;
  }
}

async function deletePerson() {
  if (!detail.value) return;
  deleting.value = true;
  try {
    const response = await pluginApi.deletePerson(detail.value.person.person_id);
    if (response.success === false) {
      notify(response.message || '删除失败', 'error');
      return;
    }
    notify(response.message || '已删除');
    confirmDelete.value = false;
    detailOpen.value = false;
    await load();
  } catch (error) {
    notify(`删除失败：${error.message || error}`, 'error');
  } finally {
    deleting.value = false;
  }
}

async function reloadDetail() {
  if (!detail.value) return;
  try {
    const response = await pluginApi.getPerson(detail.value.person.person_id);
    if (response.success !== false) {
      detail.value = response;
    }
  } catch (error) {
    /* 详情刷新失败保持现状 */
  }
}

async function setTarget(target, status) {
  try {
    const response = await pluginApi.setTargetStatus(target.key, status);
    if (response.success === false) {
      notify(response.message || '操作失败', 'error');
      return;
    }
    target.status = status;
    notify(status === 'wanted' ? '已恢复，正在补订' : '已忽略');
    await reloadDetail();
  } catch (error) {
    notify(`操作失败：${error.message || error}`, 'error');
  }
}

onMounted(() => {
  load();
  loadGenres();
});

return (_ctx, _cache) => {
  const _component_v_chip = _resolveComponent("v-chip");
  const _component_v_spacer = _resolveComponent("v-spacer");
  const _component_v_btn = _resolveComponent("v-btn");
  const _component_v_card = _resolveComponent("v-card");
  const _component_v_progress_circular = _resolveComponent("v-progress-circular");
  const _component_v_alert = _resolveComponent("v-alert");
  const _component_v_img = _resolveComponent("v-img");
  const _component_v_icon = _resolveComponent("v-icon");
  const _component_v_card_title = _resolveComponent("v-card-title");
  const _component_v_text_field = _resolveComponent("v-text-field");
  const _component_v_card_text = _resolveComponent("v-card-text");
  const _component_v_dialog = _resolveComponent("v-dialog");
  const _component_v_divider = _resolveComponent("v-divider");
  const _component_v_card_actions = _resolveComponent("v-card-actions");
  const _component_v_snackbar = _resolveComponent("v-snackbar");

  return (_openBlock(), _createElementBlock("div", _hoisted_1, [
    _createVNode(_component_v_card, {
      variant: "outlined",
      class: "pa-4 mb-4"
    }, {
      default: _withCtx(() => [
        _createElementVNode("div", _hoisted_2, [
          _cache[15] || (_cache[15] = _createElementVNode("h3", { class: "ma-0" }, "人物订阅", -1)),
          _createVNode(_component_v_chip, {
            size: "small",
            variant: "tonal",
            color: "primary"
          }, {
            default: _withCtx(() => [
              _createTextVNode(_toDisplayString(persons.value.length) + " 位人物 ", 1)
            ]),
            _: 1
          }),
          _createVNode(_component_v_spacer),
          _createVNode(_component_v_btn, {
            color: "primary",
            "prepend-icon": "mdi-account-plus",
            loading: searchLoading.value,
            onClick: openSearch
          }, {
            default: _withCtx(() => [...(_cache[13] || (_cache[13] = [
              _createTextVNode("添加人物", -1)
            ]))]),
            _: 1
          }, 8, ["loading"]),
          _createVNode(_component_v_btn, {
            variant: "tonal",
            "prepend-icon": "mdi-refresh",
            disabled: refreshingAll.value,
            onClick: onRefreshAll
          }, {
            default: _withCtx(() => [...(_cache[14] || (_cache[14] = [
              _createTextVNode("全部刷新", -1)
            ]))]),
            _: 1
          }, 8, ["disabled"]),
          _createVNode(_component_v_btn, {
            variant: "text",
            icon: "mdi-close",
            size: "small",
            title: "关闭",
            onClick: _cache[0] || (_cache[0] = $event => (emit('close')))
          })
        ]),
        (lastSummary.value)
          ? (_openBlock(), _createElementBlock("div", _hoisted_3, _toDisplayString(lastSummary.value), 1))
          : _createCommentVNode("", true)
      ]),
      _: 1
    }),
    (loading.value)
      ? (_openBlock(), _createElementBlock("div", _hoisted_4, [
          _createVNode(_component_v_progress_circular, { indeterminate: "" })
        ]))
      : (!persons.value.length)
        ? (_openBlock(), _createBlock(_component_v_alert, {
            key: 1,
            type: "info",
            variant: "tonal"
          }, {
            default: _withCtx(() => [...(_cache[16] || (_cache[16] = [
              _createTextVNode(" 还没有订阅任何人物。点击「添加人物」，搜索 TMDb 演员/导演（展示头像与代表作，人工确认）。 ", -1)
            ]))]),
            _: 1
          }))
        : (_openBlock(), _createElementBlock("div", _hoisted_5, [
            (_openBlock(true), _createElementBlock(_Fragment, null, _renderList(persons.value, (person) => {
              return (_openBlock(), _createBlock(_component_v_card, {
                key: person.person_id,
                variant: "outlined",
                class: "ps-person-card",
                onClick: $event => (openDetail(person))
              }, {
                default: _withCtx(() => [
                  _createElementVNode("div", _hoisted_6, [
                    _createElementVNode("div", _hoisted_7, [
                      (person.profile_url)
                        ? (_openBlock(), _createBlock(_component_v_img, {
                            key: 0,
                            src: person.profile_url,
                            width: "72",
                            height: "108",
                            cover: "",
                            class: "ps-avatar"
                          }, null, 8, ["src"]))
                        : (_openBlock(), _createElementBlock("div", _hoisted_8, [
                            _createVNode(_component_v_icon, {
                              icon: "mdi-account",
                              size: "32"
                            })
                          ]))
                    ]),
                    _createElementVNode("div", _hoisted_9, [
                      _createElementVNode("div", _hoisted_10, [
                        _createElementVNode("span", _hoisted_11, _toDisplayString(person.name), 1),
                        _createVNode(_component_v_chip, {
                          size: "x-small",
                          variant: "tonal"
                        }, {
                          default: _withCtx(() => [
                            _createTextVNode(_toDisplayString(departmentName(person)), 1)
                          ]),
                          _: 2
                        }, 1024),
                        _createVNode(_component_v_chip, {
                          size: "x-small",
                          color: person.status === 'active' ? 'success' : 'grey'
                        }, {
                          default: _withCtx(() => [
                            _createTextVNode(_toDisplayString(person.status === 'active' ? '订阅中' : '已暂停'), 1)
                          ]),
                          _: 2
                        }, 1032, ["color"])
                      ]),
                      (person.original_name)
                        ? (_openBlock(), _createElementBlock("div", _hoisted_12, _toDisplayString(person.original_name), 1))
                        : _createCommentVNode("", true),
                      _createElementVNode("div", _hoisted_13, [
                        (person.stats.wanted)
                          ? (_openBlock(), _createBlock(_component_v_chip, {
                              key: 0,
                              size: "x-small",
                              color: "warning",
                              variant: "tonal"
                            }, {
                              default: _withCtx(() => [
                                _createTextVNode(" 订阅 " + _toDisplayString(person.stats.wanted), 1)
                              ]),
                              _: 2
                            }, 1024))
                          : _createCommentVNode("", true),
                        (person.stats.pending_release)
                          ? (_openBlock(), _createBlock(_component_v_chip, {
                              key: 1,
                              size: "x-small",
                              variant: "tonal"
                            }, {
                              default: _withCtx(() => [
                                _createTextVNode(" 待映 " + _toDisplayString(person.stats.pending_release), 1)
                              ]),
                              _: 2
                            }, 1024))
                          : _createCommentVNode("", true),
                        (person.stats.fulfilled)
                          ? (_openBlock(), _createBlock(_component_v_chip, {
                              key: 2,
                              size: "x-small",
                              color: "success",
                              variant: "tonal"
                            }, {
                              default: _withCtx(() => [
                                _createTextVNode(" 完成 " + _toDisplayString(person.stats.fulfilled), 1)
                              ]),
                              _: 2
                            }, 1024))
                          : _createCommentVNode("", true),
                        (person.stats.ignored)
                          ? (_openBlock(), _createBlock(_component_v_chip, {
                              key: 3,
                              size: "x-small",
                              color: "grey",
                              variant: "tonal"
                            }, {
                              default: _withCtx(() => [
                                _createTextVNode(" 忽略 " + _toDisplayString(person.stats.ignored), 1)
                              ]),
                              _: 2
                            }, 1024))
                          : _createCommentVNode("", true)
                      ]),
                      _createElementVNode("div", _hoisted_14, _toDisplayString(person.last_checked_at ? `上次扫描：${person.last_checked_at}` : '尚未扫描'), 1),
                      (person.last_error)
                        ? (_openBlock(), _createBlock(_component_v_alert, {
                            key: 1,
                            type: "error",
                            variant: "tonal",
                            density: "compact",
                            class: "mt-1 ps-error"
                          }, {
                            default: _withCtx(() => [
                              _createTextVNode(_toDisplayString(person.last_error), 1)
                            ]),
                            _: 2
                          }, 1024))
                        : _createCommentVNode("", true)
                    ])
                  ])
                ]),
                _: 2
              }, 1032, ["onClick"]))
            }), 128))
          ])),
    _createVNode(_component_v_dialog, {
      modelValue: searchOpen.value,
      "onUpdate:modelValue": _cache[3] || (_cache[3] = $event => ((searchOpen).value = $event)),
      "max-width": "720"
    }, {
      default: _withCtx(() => [
        _createVNode(_component_v_card, null, {
          default: _withCtx(() => [
            _createVNode(_component_v_card_title, { class: "d-flex align-center" }, {
              default: _withCtx(() => [
                _cache[17] || (_cache[17] = _createTextVNode(" 添加人物订阅 ", -1)),
                _createVNode(_component_v_spacer),
                _createVNode(_component_v_btn, {
                  icon: "mdi-close",
                  variant: "text",
                  size: "small",
                  onClick: _cache[1] || (_cache[1] = $event => (searchOpen.value = false))
                })
              ]),
              _: 1
            }),
            _createVNode(_component_v_card_text, null, {
              default: _withCtx(() => [
                _createElementVNode("div", _hoisted_15, [
                  _createVNode(_component_v_text_field, {
                    modelValue: searchQuery.value,
                    "onUpdate:modelValue": _cache[2] || (_cache[2] = $event => ((searchQuery).value = $event)),
                    label: "输入演员/导演姓名",
                    density: "comfortable",
                    "hide-details": "",
                    clearable: "",
                    onKeyup: _withKeys(runSearch, ["enter"])
                  }, null, 8, ["modelValue"]),
                  _createVNode(_component_v_btn, {
                    color: "primary",
                    loading: searchLoading.value,
                    disabled: !searchQuery.value.trim(),
                    onClick: runSearch
                  }, {
                    default: _withCtx(() => [...(_cache[18] || (_cache[18] = [
                      _createTextVNode("搜索", -1)
                    ]))]),
                    _: 1
                  }, 8, ["loading", "disabled"])
                ]),
                (searchLoading.value)
                  ? (_openBlock(), _createElementBlock("div", _hoisted_16, [
                      _createVNode(_component_v_progress_circular, { indeterminate: "" })
                    ]))
                  : (searchError.value)
                    ? (_openBlock(), _createBlock(_component_v_alert, {
                        key: 1,
                        type: "warning",
                        variant: "tonal"
                      }, {
                        default: _withCtx(() => [
                          _createTextVNode(_toDisplayString(searchError.value), 1)
                        ]),
                        _: 1
                      }))
                    : (searched.value && !searchResults.value.length)
                      ? (_openBlock(), _createBlock(_component_v_alert, {
                          key: 2,
                          type: "info",
                          variant: "tonal"
                        }, {
                          default: _withCtx(() => [...(_cache[19] || (_cache[19] = [
                            _createTextVNode(" 没有找到匹配的人物 ", -1)
                          ]))]),
                          _: 1
                        }))
                      : (_openBlock(), _createElementBlock("div", _hoisted_17, [
                          (_openBlock(true), _createElementBlock(_Fragment, null, _renderList(searchResults.value, (item) => {
                            return (_openBlock(), _createElementBlock("div", {
                              key: item.person_id,
                              class: "ps-search-item"
                            }, [
                              (item.profile_url)
                                ? (_openBlock(), _createBlock(_component_v_img, {
                                    key: 0,
                                    src: item.profile_url,
                                    width: "52",
                                    height: "78",
                                    cover: "",
                                    class: "ps-avatar"
                                  }, null, 8, ["src"]))
                                : (_openBlock(), _createElementBlock("div", _hoisted_18, [
                                    _createVNode(_component_v_icon, {
                                      icon: "mdi-account",
                                      size: "24"
                                    })
                                  ])),
                              _createElementVNode("div", _hoisted_19, [
                                _createElementVNode("div", _hoisted_20, [
                                  _createElementVNode("span", _hoisted_21, _toDisplayString(item.name), 1),
                                  _createVNode(_component_v_chip, {
                                    size: "x-small",
                                    variant: "tonal"
                                  }, {
                                    default: _withCtx(() => [
                                      _createTextVNode(_toDisplayString(departmentName(item)), 1)
                                    ]),
                                    _: 2
                                  }, 1024)
                                ]),
                                (item.original_name)
                                  ? (_openBlock(), _createElementBlock("div", _hoisted_22, _toDisplayString(item.original_name), 1))
                                  : _createCommentVNode("", true),
                                (item.known_for.length)
                                  ? (_openBlock(), _createElementBlock("div", _hoisted_23, " 代表作：" + _toDisplayString(item.known_for.map((k) => k.title).join(' / ')), 1))
                                  : _createCommentVNode("", true)
                              ]),
                              _createVNode(_component_v_btn, {
                                size: "small",
                                color: "primary",
                                variant: "tonal",
                                disabled: isSubscribed(item.person_id),
                                onClick: _withModifiers($event => (addPerson(item)), ["stop"])
                              }, {
                                default: _withCtx(() => [
                                  _createTextVNode(_toDisplayString(isSubscribed(item.person_id) ? '已订阅' : '订阅'), 1)
                                ]),
                                _: 2
                              }, 1032, ["disabled", "onClick"])
                            ]))
                          }), 128))
                        ]))
              ]),
              _: 1
            })
          ]),
          _: 1
        })
      ]),
      _: 1
    }, 8, ["modelValue"]),
    _createVNode(_component_v_dialog, {
      modelValue: detailOpen.value,
      "onUpdate:modelValue": _cache[6] || (_cache[6] = $event => ((detailOpen).value = $event)),
      "max-width": "900",
      scrollable: ""
    }, {
      default: _withCtx(() => [
        _createVNode(_component_v_card, null, {
          default: _withCtx(() => [
            _createVNode(_component_v_card_title, { class: "d-flex align-center flex-wrap ga-2" }, {
              default: _withCtx(() => [
                (detail.value)
                  ? (_openBlock(), _createElementBlock(_Fragment, { key: 0 }, [
                      _createTextVNode(_toDisplayString(detail.value.person.name) + " ", 1),
                      _createVNode(_component_v_chip, {
                        size: "small",
                        color: detail.value.person.status === 'active' ? 'success' : 'grey'
                      }, {
                        default: _withCtx(() => [
                          _createTextVNode(_toDisplayString(detail.value.person.status === 'active' ? '订阅中' : '已暂停'), 1)
                        ]),
                        _: 1
                      }, 8, ["color"])
                    ], 64))
                  : _createCommentVNode("", true),
                _createVNode(_component_v_spacer),
                (detail.value)
                  ? (_openBlock(), _createBlock(_component_v_btn, {
                      key: 1,
                      size: "small",
                      variant: "tonal",
                      "prepend-icon": "mdi-pause",
                      onClick: togglePersonStatus
                    }, {
                      default: _withCtx(() => [
                        _createTextVNode(_toDisplayString(detail.value.person.status === 'active' ? '暂停' : '恢复'), 1)
                      ]),
                      _: 1
                    }))
                  : _createCommentVNode("", true),
                (detail.value)
                  ? (_openBlock(), _createBlock(_component_v_btn, {
                      key: 2,
                      size: "small",
                      variant: "tonal",
                      "prepend-icon": "mdi-refresh",
                      onClick: refreshPerson
                    }, {
                      default: _withCtx(() => [...(_cache[20] || (_cache[20] = [
                        _createTextVNode("手动刷新", -1)
                      ]))]),
                      _: 1
                    }))
                  : _createCommentVNode("", true),
                (detail.value)
                  ? (_openBlock(), _createBlock(_component_v_btn, {
                      key: 3,
                      size: "small",
                      variant: "tonal",
                      "prepend-icon": "mdi-cog",
                      onClick: openStrategy
                    }, {
                      default: _withCtx(() => [...(_cache[21] || (_cache[21] = [
                        _createTextVNode("策略", -1)
                      ]))]),
                      _: 1
                    }))
                  : _createCommentVNode("", true),
                (detail.value)
                  ? (_openBlock(), _createBlock(_component_v_btn, {
                      key: 4,
                      size: "small",
                      variant: "tonal",
                      color: "error",
                      "prepend-icon": "mdi-delete",
                      onClick: _cache[4] || (_cache[4] = $event => (confirmDelete.value = true))
                    }, {
                      default: _withCtx(() => [...(_cache[22] || (_cache[22] = [
                        _createTextVNode("删除", -1)
                      ]))]),
                      _: 1
                    }))
                  : _createCommentVNode("", true),
                _createVNode(_component_v_btn, {
                  icon: "mdi-close",
                  variant: "text",
                  size: "small",
                  onClick: _cache[5] || (_cache[5] = $event => (detailOpen.value = false))
                })
              ]),
              _: 1
            }),
            _createVNode(_component_v_divider),
            _createVNode(_component_v_card_text, null, {
              default: _withCtx(() => [
                (detailLoading.value)
                  ? (_openBlock(), _createElementBlock("div", _hoisted_24, [
                      _createVNode(_component_v_progress_circular, { indeterminate: "" })
                    ]))
                  : (detail.value)
                    ? (_openBlock(), _createElementBlock(_Fragment, { key: 1 }, [
                        (detail.value.person.last_error)
                          ? (_openBlock(), _createBlock(_component_v_alert, {
                              key: 0,
                              type: "error",
                              variant: "tonal",
                              density: "compact",
                              class: "mb-3"
                            }, {
                              default: _withCtx(() => [
                                _createTextVNode(_toDisplayString(detail.value.person.last_error), 1)
                              ]),
                              _: 1
                            }))
                          : _createCommentVNode("", true),
                        _createElementVNode("div", _hoisted_25, _toDisplayString(detail.value.person.last_checked_at ? `上次扫描：${detail.value.person.last_checked_at}` : '尚未扫描'), 1),
                        (!detail.value.targets.length)
                          ? (_openBlock(), _createBlock(_component_v_alert, {
                              key: 1,
                              type: "info",
                              variant: "tonal"
                            }, {
                              default: _withCtx(() => [...(_cache[23] || (_cache[23] = [
                                _createTextVNode(" 暂无作品记录，等待下一次扫描 ", -1)
                              ]))]),
                              _: 1
                            }))
                          : (_openBlock(), _createElementBlock("div", _hoisted_26, [
                              (_openBlock(true), _createElementBlock(_Fragment, null, _renderList(detail.value.targets, (target) => {
                                return (_openBlock(), _createElementBlock("div", {
                                  key: target.key,
                                  class: "ps-target-item"
                                }, [
                                  (target.poster_url)
                                    ? (_openBlock(), _createBlock(_component_v_img, {
                                        key: 0,
                                        src: target.poster_url,
                                        width: "46",
                                        height: "69",
                                        cover: "",
                                        class: "ps-avatar"
                                      }, null, 8, ["src"]))
                                    : (_openBlock(), _createElementBlock("div", _hoisted_27, [
                                        _createVNode(_component_v_icon, {
                                          icon: "mdi-movie-open",
                                          size: "20"
                                        })
                                      ])),
                                  _createElementVNode("div", _hoisted_28, [
                                    _createElementVNode("div", _hoisted_29, [
                                      _createElementVNode("span", _hoisted_30, _toDisplayString(target.title), 1),
                                      _createVNode(_component_v_chip, {
                                        size: "x-small",
                                        color: targetMeta(target).color,
                                        variant: "tonal"
                                      }, {
                                        default: _withCtx(() => [
                                          _createTextVNode(_toDisplayString(targetMeta(target).text), 1)
                                        ]),
                                        _: 2
                                      }, 1032, ["color"]),
                                      (target.entity_type === 'tv')
                                        ? (_openBlock(), _createBlock(_component_v_chip, {
                                            key: 0,
                                            size: "x-small",
                                            variant: "tonal"
                                          }, {
                                            default: _withCtx(() => [...(_cache[24] || (_cache[24] = [
                                              _createTextVNode(" 剧集 ", -1)
                                            ]))]),
                                            _: 1
                                          }))
                                        : _createCommentVNode("", true)
                                    ]),
                                    _createElementVNode("div", _hoisted_31, [
                                      _createTextVNode(_toDisplayString(target.release_date || '未定档') + " ", 1),
                                      (target.vote_average)
                                        ? (_openBlock(), _createElementBlock(_Fragment, { key: 0 }, [
                                            _createTextVNode("· 评分 " + _toDisplayString(target.vote_average), 1)
                                          ], 64))
                                        : _createCommentVNode("", true),
                                      (target.genre_names && target.genre_names.length)
                                        ? (_openBlock(), _createElementBlock(_Fragment, { key: 1 }, [
                                            _createTextVNode(" · " + _toDisplayString(target.genre_names.join(' / ')), 1)
                                          ], 64))
                                        : _createCommentVNode("", true),
                                      (target.role === 'directing')
                                        ? (_openBlock(), _createElementBlock(_Fragment, { key: 2 }, [
                                            _createTextVNode("· 执导")
                                          ], 64))
                                        : _createCommentVNode("", true)
                                    ])
                                  ]),
                                  _createElementVNode("div", _hoisted_32, [
                                    (target.status === 'ignored')
                                      ? (_openBlock(), _createBlock(_component_v_btn, {
                                          key: 0,
                                          size: "x-small",
                                          variant: "tonal",
                                          onClick: $event => (setTarget(target, 'wanted'))
                                        }, {
                                          default: _withCtx(() => [...(_cache[25] || (_cache[25] = [
                                            _createTextVNode("恢复订阅", -1)
                                          ]))]),
                                          _: 1
                                        }, 8, ["onClick"]))
                                      : (target.status !== 'fulfilled')
                                        ? (_openBlock(), _createBlock(_component_v_btn, {
                                            key: 1,
                                            size: "x-small",
                                            variant: "text",
                                            color: "grey",
                                            onClick: $event => (setTarget(target, 'ignored'))
                                          }, {
                                            default: _withCtx(() => [...(_cache[26] || (_cache[26] = [
                                              _createTextVNode("忽略", -1)
                                            ]))]),
                                            _: 1
                                          }, 8, ["onClick"]))
                                        : _createCommentVNode("", true)
                                  ])
                                ]))
                              }), 128))
                            ]))
                      ], 64))
                    : _createCommentVNode("", true)
              ]),
              _: 1
            })
          ]),
          _: 1
        })
      ]),
      _: 1
    }, 8, ["modelValue"]),
    _createVNode(_component_v_dialog, {
      modelValue: strategyOpen.value,
      "onUpdate:modelValue": _cache[9] || (_cache[9] = $event => ((strategyOpen).value = $event)),
      "max-width": "760"
    }, {
      default: _withCtx(() => [
        _createVNode(_component_v_card, null, {
          default: _withCtx(() => [
            _createVNode(_component_v_card_title, { class: "d-flex align-center" }, {
              default: _withCtx(() => [
                _createTextVNode(" 独立策略" + _toDisplayString(detail.value ? ` - ${detail.value.person.name}` : '') + " ", 1),
                _createVNode(_component_v_spacer),
                _createVNode(_component_v_btn, {
                  icon: "mdi-close",
                  variant: "text",
                  size: "small",
                  onClick: _cache[7] || (_cache[7] = $event => (strategyOpen.value = false))
                })
              ]),
              _: 1
            }),
            _createVNode(_component_v_card_text, null, {
              default: _withCtx(() => [
                _cache[29] || (_cache[29] = _createElementVNode("div", { class: "text-caption text-medium-emphasis mb-2" }, " 留空字段沿用默认策略；保存后立即生效，下次扫描按新策略执行。 ", -1)),
                _createVNode(_sfc_main$1, {
                  modelValue: strategyDraft.value,
                  "onUpdate:modelValue": _cache[8] || (_cache[8] = $event => ((strategyDraft).value = $event)),
                  genres: genres.value
                }, null, 8, ["modelValue", "genres"]),
                _createElementVNode("div", _hoisted_33, [
                  _createVNode(_component_v_btn, {
                    variant: "text",
                    onClick: useDefaultStrategy
                  }, {
                    default: _withCtx(() => [...(_cache[27] || (_cache[27] = [
                      _createTextVNode("重置为默认", -1)
                    ]))]),
                    _: 1
                  }),
                  _createVNode(_component_v_btn, {
                    color: "primary",
                    loading: strategySaving.value,
                    onClick: saveStrategy
                  }, {
                    default: _withCtx(() => [...(_cache[28] || (_cache[28] = [
                      _createTextVNode("保存", -1)
                    ]))]),
                    _: 1
                  }, 8, ["loading"])
                ])
              ]),
              _: 1
            })
          ]),
          _: 1
        })
      ]),
      _: 1
    }, 8, ["modelValue"]),
    _createVNode(_component_v_dialog, {
      modelValue: confirmDelete.value,
      "onUpdate:modelValue": _cache[11] || (_cache[11] = $event => ((confirmDelete).value = $event)),
      "max-width": "420"
    }, {
      default: _withCtx(() => [
        _createVNode(_component_v_card, null, {
          default: _withCtx(() => [
            _createVNode(_component_v_card_title, null, {
              default: _withCtx(() => [...(_cache[30] || (_cache[30] = [
                _createTextVNode("删除人物订阅", -1)
              ]))]),
              _: 1
            }),
            _createVNode(_component_v_card_text, null, {
              default: _withCtx(() => [
                _createTextVNode(" 确定删除 " + _toDisplayString(detail.value ? detail.value.person.name : '') + " 的订阅吗？已创建的 MoviePilot 订阅不会被删除；无其他人物关注的待订阅目标将被移除。 ", 1)
              ]),
              _: 1
            }),
            _createVNode(_component_v_card_actions, null, {
              default: _withCtx(() => [
                _createVNode(_component_v_spacer),
                _createVNode(_component_v_btn, {
                  variant: "text",
                  onClick: _cache[10] || (_cache[10] = $event => (confirmDelete.value = false))
                }, {
                  default: _withCtx(() => [...(_cache[31] || (_cache[31] = [
                    _createTextVNode("取消", -1)
                  ]))]),
                  _: 1
                }),
                _createVNode(_component_v_btn, {
                  color: "error",
                  loading: deleting.value,
                  onClick: deletePerson
                }, {
                  default: _withCtx(() => [...(_cache[32] || (_cache[32] = [
                    _createTextVNode("删除", -1)
                  ]))]),
                  _: 1
                }, 8, ["loading"])
              ]),
              _: 1
            })
          ]),
          _: 1
        })
      ]),
      _: 1
    }, 8, ["modelValue"]),
    _createVNode(_component_v_snackbar, {
      modelValue: snackbar.show,
      "onUpdate:modelValue": _cache[12] || (_cache[12] = $event => ((snackbar.show) = $event)),
      color: snackbar.color,
      timeout: 3000
    }, {
      default: _withCtx(() => [
        _createTextVNode(_toDisplayString(snackbar.text), 1)
      ]),
      _: 1
    }, 8, ["modelValue", "color"])
  ]))
}
}

};
const Page = /*#__PURE__*/_export_sfc(_sfc_main, [['__scopeId',"data-v-a91a88a9"]]);

export { Page as default };
