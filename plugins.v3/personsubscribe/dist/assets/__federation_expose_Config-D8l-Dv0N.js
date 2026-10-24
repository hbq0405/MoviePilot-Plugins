import { importShared } from './__federation_fn_import-JrT3xvdd.js';
import { p as pluginApi, _ as _sfc_main$1 } from './api-aSRXrTbr.js';

const {createElementVNode:_createElementVNode,resolveComponent:_resolveComponent,createVNode:_createVNode,withCtx:_withCtx,createTextVNode:_createTextVNode,openBlock:_openBlock,createElementBlock:_createElementBlock} = await importShared('vue');


const _hoisted_1 = { class: "ps-config-root pa-4" };
const _hoisted_2 = { class: "d-flex align-center mb-3" };
const _hoisted_3 = { class: "d-flex justify-end ga-2" };

const {onMounted,reactive,ref,watch} = await importShared('vue');


const _sfc_main = {
  __name: 'Config',
  props: {
  initialConfig: { type: Object, default: () => ({}) },
},
  emits: ['save', 'close'],
  setup(__props, { emit: __emit }) {

const props = __props;

const emit = __emit;

const defaults = () => ({
  enabled: false,
  onlyonce: false,
  cron: '30 5 * * *',
  notify: true,
  username: '人物订阅',
  language: 'zh-CN',
  default_config: {},
});

const local = reactive({ ...defaults(), ...(props.initialConfig || {}) });
const defaultConfig = ref({ ...defaults().default_config, ...(props.initialConfig?.default_config || {}) });
const genres = ref([]);

watch(
  () => props.initialConfig,
  (value) => {
    Object.assign(local, defaults(), value || {});
    defaultConfig.value = { ...(value?.default_config || {}) };
  },
  { deep: true },
);
watch(
  defaultConfig,
  (value) => {
    local.default_config = { ...value };
  },
  { deep: true },
);

function onReset() {
  Object.assign(local, defaults());
  defaultConfig.value = {};
}

function onSave() {
  // 保存交给宿主前端（emit('save')），宿主用 api.put('plugin/PersonSubscribe', cfg) 持久化。
  emit('save', { ...local, default_config: { ...defaultConfig.value } });
}

onMounted(async () => {
  try {
    const response = await pluginApi.getGenres();
    genres.value = response.genres || [];
  } catch (error) {
    genres.value = [];
  }
});

return (_ctx, _cache) => {
  const _component_v_spacer = _resolveComponent("v-spacer");
  const _component_v_btn = _resolveComponent("v-btn");
  const _component_v_switch = _resolveComponent("v-switch");
  const _component_v_col = _resolveComponent("v-col");
  const _component_v_text_field = _resolveComponent("v-text-field");
  const _component_v_row = _resolveComponent("v-row");
  const _component_v_card = _resolveComponent("v-card");

  return (_openBlock(), _createElementBlock("div", _hoisted_1, [
    _createVNode(_component_v_card, {
      variant: "outlined",
      class: "pa-4 mb-3"
    }, {
      default: _withCtx(() => [
        _createElementVNode("div", _hoisted_2, [
          _cache[8] || (_cache[8] = _createElementVNode("h3", { class: "ma-0" }, "人物订阅 — 设置", -1)),
          _createVNode(_component_v_spacer),
          _createVNode(_component_v_btn, {
            icon: "mdi-close",
            variant: "text",
            size: "small",
            title: "关闭",
            onClick: _cache[0] || (_cache[0] = $event => (emit('close')))
          })
        ]),
        _createVNode(_component_v_row, { dense: "" }, {
          default: _withCtx(() => [
            _createVNode(_component_v_col, {
              cols: "12",
              md: "3"
            }, {
              default: _withCtx(() => [
                _createVNode(_component_v_switch, {
                  modelValue: local.enabled,
                  "onUpdate:modelValue": _cache[1] || (_cache[1] = $event => ((local.enabled) = $event)),
                  label: "启用插件",
                  color: "primary",
                  "hide-details": ""
                }, null, 8, ["modelValue"])
              ]),
              _: 1
            }),
            _createVNode(_component_v_col, {
              cols: "12",
              md: "3"
            }, {
              default: _withCtx(() => [
                _createVNode(_component_v_switch, {
                  modelValue: local.onlyonce,
                  "onUpdate:modelValue": _cache[2] || (_cache[2] = $event => ((local.onlyonce) = $event)),
                  label: "立即运行一次",
                  color: "primary",
                  "hide-details": ""
                }, null, 8, ["modelValue"])
              ]),
              _: 1
            }),
            _createVNode(_component_v_col, {
              cols: "12",
              md: "3"
            }, {
              default: _withCtx(() => [
                _createVNode(_component_v_switch, {
                  modelValue: local.notify,
                  "onUpdate:modelValue": _cache[3] || (_cache[3] = $event => ((local.notify) = $event)),
                  label: "发送通知",
                  color: "primary",
                  "hide-details": ""
                }, null, 8, ["modelValue"])
              ]),
              _: 1
            }),
            _createVNode(_component_v_col, {
              cols: "12",
              md: "3"
            }, {
              default: _withCtx(() => [
                _createVNode(_component_v_text_field, {
                  modelValue: local.username,
                  "onUpdate:modelValue": _cache[4] || (_cache[4] = $event => ((local.username) = $event)),
                  label: "订阅用户",
                  density: "comfortable",
                  hint: "创建 MoviePilot 订阅时归属的用户名",
                  "persistent-hint": ""
                }, null, 8, ["modelValue"])
              ]),
              _: 1
            })
          ]),
          _: 1
        }),
        _createVNode(_component_v_row, { dense: "" }, {
          default: _withCtx(() => [
            _createVNode(_component_v_col, {
              cols: "12",
              md: "6"
            }, {
              default: _withCtx(() => [
                _createVNode(_component_v_text_field, {
                  modelValue: local.cron,
                  "onUpdate:modelValue": _cache[5] || (_cache[5] = $event => ((local.cron) = $event)),
                  label: "执行周期",
                  density: "comfortable",
                  placeholder: "5 位 cron 表达式，默认每天 05:30"
                }, null, 8, ["modelValue"])
              ]),
              _: 1
            }),
            _createVNode(_component_v_col, {
              cols: "12",
              md: "6"
            }, {
              default: _withCtx(() => [
                _createVNode(_component_v_text_field, {
                  modelValue: local.language,
                  "onUpdate:modelValue": _cache[6] || (_cache[6] = $event => ((local.language) = $event)),
                  label: "TMDb 语言",
                  density: "comfortable",
                  hint: "拉取人物作品与标题的语言，默认 zh-CN",
                  "persistent-hint": ""
                }, null, 8, ["modelValue"])
              ]),
              _: 1
            })
          ]),
          _: 1
        })
      ]),
      _: 1
    }),
    _createVNode(_component_v_card, {
      variant: "outlined",
      class: "pa-4 mb-3"
    }, {
      default: _withCtx(() => [
        _cache[9] || (_cache[9] = _createElementVNode("h4", { class: "mb-2" }, "默认订阅策略", -1)),
        _cache[10] || (_cache[10] = _createElementVNode("div", { class: "text-caption text-medium-emphasis mb-3" }, " 新添加的人物默认使用此策略；单个人物可在插件详情页设置独立策略覆盖。 ", -1)),
        _createVNode(_sfc_main$1, {
          modelValue: defaultConfig.value,
          "onUpdate:modelValue": _cache[7] || (_cache[7] = $event => ((defaultConfig).value = $event)),
          genres: genres.value
        }, null, 8, ["modelValue", "genres"])
      ]),
      _: 1
    }),
    _createElementVNode("div", _hoisted_3, [
      _createVNode(_component_v_btn, {
        variant: "text",
        onClick: onReset
      }, {
        default: _withCtx(() => [...(_cache[11] || (_cache[11] = [
          _createTextVNode("重置", -1)
        ]))]),
        _: 1
      }),
      _createVNode(_component_v_btn, {
        color: "primary",
        onClick: onSave
      }, {
        default: _withCtx(() => [...(_cache[12] || (_cache[12] = [
          _createTextVNode("保存", -1)
        ]))]),
        _: 1
      })
    ])
  ]))
}
}

};

export { _sfc_main as default };
