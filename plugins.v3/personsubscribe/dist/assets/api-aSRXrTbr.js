import { importShared } from './__federation_fn_import-JrT3xvdd.js';

const {resolveComponent:_resolveComponent,createVNode:_createVNode,withCtx:_withCtx,openBlock:_openBlock,createElementBlock:_createElementBlock} = await importShared('vue');


const _hoisted_1 = { class: "ps-strategy-form" };

const {computed,reactive,watch} = await importShared('vue');



const _sfc_main = {
  __name: 'StrategyForm',
  props: {
  modelValue: { type: Object, default: () => ({}) },
  genres: { type: Array, default: () => [] },
},
  emits: ['update:modelValue'],
  setup(__props, { emit: __emit }) {

const props = __props;

const emit = __emit;

const roleOptions = [
  { title: '参演 + 执导', value: 'both' },
  { title: '仅参演作品', value: 'acting' },
  { title: '仅执导作品', value: 'directing' },
];
const mediaTypeOptions = [
  { title: '电影', value: 'Movie' },
  { title: '电视剧', value: 'TV' },
];
const qualityOptions = [
  { title: '全部', value: '' },
  { title: '蓝光原盘', value: 'Blu-?Ray.+VC-?1|Blu-?Ray.+AVC|UHD.+blu-?ray.+HEVC|MiniBD' },
  { title: 'Remux', value: 'Remux' },
  { title: 'BluRay', value: 'Blu-?Ray' },
  { title: 'UHD', value: 'UHD|UltraHD' },
  { title: 'WEB-DL', value: 'WEB-?DL|WEB-?RIP' },
  { title: 'HDTV', value: 'HDTV' },
];
const resolutionOptions = [
  { title: '全部', value: '' },
  { title: '4K', value: '4K|2160p|x2160' },
  { title: '1080p', value: '1080[pi]|x1080' },
  { title: '720p', value: '720[pi]|x720' },
];
const effectOptions = [
  { title: '全部', value: '' },
  { title: '杜比视界', value: 'Dolby[\\s.]+Vision|DOVI|[\\s.]+DV[\\s.]+' },
  { title: '杜比全景声', value: 'Dolby[\\s.]*\\+?Atmos|Atmos' },
  { title: 'HDR', value: '[\\s.]+HDR[\\s.]+|HDR10|HDR10\\+' },
  { title: 'SDR', value: '[\\s.]+SDR[\\s.]+' },
];

const local = reactive({ ...defaults(), ...(props.modelValue || {}) });

watch(
  () => props.modelValue,
  (value) => Object.assign(local, defaults(), value || {}),
  { deep: true },
);
watch(
  local,
  () => emit('update:modelValue', { ...local }),
  { deep: true },
);

function defaults() {
  return {
    roles: 'both',
    media_types: ['Movie', 'TV'],
    start_year: 1900,
    genres_include: [],
    genres_exclude: [],
    min_rating: 0,
    min_vote_count: 10,
    main_role_only: false,
    chinese_title_required: false,
    quality: '',
    resolution: '',
    effect: '',
  };
}

const genreOptions = computed(() => props.genres || []);

return (_ctx, _cache) => {
  const _component_v_select = _resolveComponent("v-select");
  const _component_v_col = _resolveComponent("v-col");
  const _component_v_text_field = _resolveComponent("v-text-field");
  const _component_v_row = _resolveComponent("v-row");
  const _component_v_switch = _resolveComponent("v-switch");

  return (_openBlock(), _createElementBlock("div", _hoisted_1, [
    _createVNode(_component_v_row, { dense: "" }, {
      default: _withCtx(() => [
        _createVNode(_component_v_col, {
          cols: "12",
          md: "4"
        }, {
          default: _withCtx(() => [
            _createVNode(_component_v_select, {
              modelValue: local.roles,
              "onUpdate:modelValue": _cache[0] || (_cache[0] = $event => ((local.roles) = $event)),
              items: roleOptions,
              label: "作品范围",
              density: "comfortable",
              hint: "按人物职业取参演/执导作品",
              "persistent-hint": ""
            }, null, 8, ["modelValue"])
          ]),
          _: 1
        }),
        _createVNode(_component_v_col, {
          cols: "12",
          md: "4"
        }, {
          default: _withCtx(() => [
            _createVNode(_component_v_select, {
              modelValue: local.media_types,
              "onUpdate:modelValue": _cache[1] || (_cache[1] = $event => ((local.media_types) = $event)),
              items: mediaTypeOptions,
              label: "媒体类型",
              multiple: "",
              chips: "",
              "closable-chips": "",
              density: "comfortable"
            }, null, 8, ["modelValue"])
          ]),
          _: 1
        }),
        _createVNode(_component_v_col, {
          cols: "12",
          md: "4"
        }, {
          default: _withCtx(() => [
            _createVNode(_component_v_text_field, {
              modelValue: local.start_year,
              "onUpdate:modelValue": _cache[2] || (_cache[2] = $event => ((local.start_year) = $event)),
              modelModifiers: { number: true },
              label: "起始年份",
              type: "number",
              density: "comfortable",
              hint: "早于此年份的作品忽略",
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
            _createVNode(_component_v_select, {
              modelValue: local.genres_include,
              "onUpdate:modelValue": _cache[3] || (_cache[3] = $event => ((local.genres_include) = $event)),
              items: genreOptions.value,
              label: "题材必须包含（留空不限）",
              "item-title": "name",
              "item-value": "id",
              multiple: "",
              chips: "",
              "closable-chips": "",
              density: "comfortable",
              "menu-props": { maxHeight: 320 }
            }, null, 8, ["modelValue", "items"])
          ]),
          _: 1
        }),
        _createVNode(_component_v_col, {
          cols: "12",
          md: "6"
        }, {
          default: _withCtx(() => [
            _createVNode(_component_v_select, {
              modelValue: local.genres_exclude,
              "onUpdate:modelValue": _cache[4] || (_cache[4] = $event => ((local.genres_exclude) = $event)),
              items: genreOptions.value,
              label: "排除题材（如综艺）",
              "item-title": "name",
              "item-value": "id",
              multiple: "",
              chips: "",
              "closable-chips": "",
              density: "comfortable",
              "menu-props": { maxHeight: 320 }
            }, null, 8, ["modelValue", "items"])
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
          md: "3"
        }, {
          default: _withCtx(() => [
            _createVNode(_component_v_text_field, {
              modelValue: local.min_rating,
              "onUpdate:modelValue": _cache[5] || (_cache[5] = $event => ((local.min_rating) = $event)),
              modelModifiers: { number: true },
              label: "最低评分（0-10）",
              type: "number",
              min: "0",
              max: "10",
              step: "0.1",
              density: "comfortable"
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
              modelValue: local.min_vote_count,
              "onUpdate:modelValue": _cache[6] || (_cache[6] = $event => ((local.min_vote_count) = $event)),
              modelModifiers: { number: true },
              label: "评分生效最低投票数",
              type: "number",
              min: "0",
              density: "comfortable",
              hint: "投票数不足时不启用评分门槛",
              "persistent-hint": ""
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
              modelValue: local.main_role_only,
              "onUpdate:modelValue": _cache[7] || (_cache[7] = $event => ((local.main_role_only) = $event)),
              label: "仅主演/主创",
              color: "primary",
              density: "comfortable",
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
              modelValue: local.chinese_title_required,
              "onUpdate:modelValue": _cache[8] || (_cache[8] = $event => ((local.chinese_title_required) = $event)),
              label: "要求中文译名",
              color: "primary",
              density: "comfortable",
              "hide-details": ""
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
          md: "4"
        }, {
          default: _withCtx(() => [
            _createVNode(_component_v_select, {
              modelValue: local.quality,
              "onUpdate:modelValue": _cache[9] || (_cache[9] = $event => ((local.quality) = $event)),
              items: qualityOptions,
              label: "订阅质量（可选）",
              density: "comfortable",
              clearable: ""
            }, null, 8, ["modelValue"])
          ]),
          _: 1
        }),
        _createVNode(_component_v_col, {
          cols: "12",
          md: "4"
        }, {
          default: _withCtx(() => [
            _createVNode(_component_v_select, {
              modelValue: local.resolution,
              "onUpdate:modelValue": _cache[10] || (_cache[10] = $event => ((local.resolution) = $event)),
              items: resolutionOptions,
              label: "订阅分辨率（可选）",
              density: "comfortable",
              clearable: ""
            }, null, 8, ["modelValue"])
          ]),
          _: 1
        }),
        _createVNode(_component_v_col, {
          cols: "12",
          md: "4"
        }, {
          default: _withCtx(() => [
            _createVNode(_component_v_select, {
              modelValue: local.effect,
              "onUpdate:modelValue": _cache[11] || (_cache[11] = $event => ((local.effect) = $event)),
              items: effectOptions,
              label: "订阅特效（可选）",
              density: "comfortable",
              clearable: ""
            }, null, 8, ["modelValue"])
          ]),
          _: 1
        })
      ]),
      _: 1
    })
  ]))
}
}

};

// 宿主把主框架 axios 挂在 window.MoviePilotAPI 上（baseURL 已是 api/v1/），
// 插件内路径使用 'plugin/<PluginId>/<path>'，不能带 'api/v1' 前缀（会双前缀 404）。
const API_BASE = 'plugin/PersonSubscribe';

function getApi() {
  return typeof window !== 'undefined' ? window.MoviePilotAPI : null;
}

async function call(fn, path, ...args) {
  const api = getApi();
  if (!api || typeof api[fn] !== 'function') {
    throw new Error('MoviePilot API 不可用');
  }
  return api[fn](`${API_BASE}${path}`, ...args);
}

const pluginApi = {
  search: (name) => call('get', `/search?name=${encodeURIComponent(name)}`),
  listPersons: () => call('get', '/persons'),
  addPerson: (payload) => call('post', '/persons', payload),
  getPerson: (personId) => call('get', `/persons/${personId}`),
  updatePerson: (personId, payload) => call('put', `/persons/${personId}`, payload),
  deletePerson: (personId) => call('delete', `/persons/${personId}`),
  refreshPerson: (personId) => call('post', `/persons/${personId}/refresh`),
  refreshAll: () => call('post', '/refresh'),
  listTargets: (status) =>
    call('get', status ? `/targets?status=${encodeURIComponent(status)}` : '/targets'),
  setTargetStatus: (key, status) =>
    call('put', `/targets/${encodeURIComponent(key)}/status`, { status }),
  getConfig: () => call('get', '/config'),
  getGenres: () => call('get', '/genres'),
};

export { _sfc_main as _, pluginApi as p };
