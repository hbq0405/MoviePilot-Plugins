<template>
  <div class="ps-config-root pa-4">
    <v-card variant="outlined" class="pa-4 mb-3">
      <div class="d-flex align-center mb-3">
        <h3 class="ma-0">人物订阅 — 设置</h3>
        <v-spacer />
        <v-btn icon="mdi-close" variant="text" size="small" title="关闭"
               @click="emit('close')" />
      </div>

      <v-row dense>
        <v-col cols="12" md="3">
          <v-switch v-model="local.enabled" label="启用插件" color="primary" hide-details />
        </v-col>
        <v-col cols="12" md="3">
          <v-switch v-model="local.onlyonce" label="立即运行一次" color="primary" hide-details />
        </v-col>
        <v-col cols="12" md="3">
          <v-switch v-model="local.notify" label="发送通知" color="primary" hide-details />
        </v-col>
        <v-col cols="12" md="3">
          <v-text-field v-model="local.username" label="订阅用户" density="comfortable"
                        hint="创建 MoviePilot 订阅时归属的用户名" persistent-hint />
        </v-col>
      </v-row>

      <v-row dense>
        <v-col cols="12" md="6">
          <v-text-field v-model="local.cron" label="执行周期" density="comfortable"
                        placeholder="5 位 cron 表达式，默认每天 05:30" />
        </v-col>
        <v-col cols="12" md="6">
          <v-text-field v-model="local.language" label="TMDb 语言" density="comfortable"
                        hint="拉取人物作品与标题的语言，默认 zh-CN" persistent-hint />
        </v-col>
      </v-row>
    </v-card>

    <v-card variant="outlined" class="pa-4 mb-3">
      <h4 class="mb-2">默认订阅策略</h4>
      <div class="text-caption text-medium-emphasis mb-3">
        新添加的人物默认使用此策略；单个人物可在插件详情页设置独立策略覆盖。
      </div>
      <StrategyForm v-model="defaultConfig" :genres="genres" />
    </v-card>

    <div class="d-flex justify-end ga-2">
      <v-btn variant="text" @click="onReset">重置</v-btn>
      <v-btn color="primary" @click="onSave">保存</v-btn>
    </div>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref, watch } from 'vue';
import StrategyForm from './StrategyForm.vue';
import { pluginApi } from './api.js';

const props = defineProps({
  initialConfig: { type: Object, default: () => ({}) },
});

const emit = defineEmits(['save', 'close']);

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
</script>
