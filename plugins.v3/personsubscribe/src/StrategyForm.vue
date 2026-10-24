<template>
  <div class="ps-strategy-form">
    <v-row dense>
      <v-col cols="12" md="4">
        <v-select
          v-model="local.roles" :items="roleOptions" label="作品范围"
          density="comfortable" hint="按人物职业取参演/执导作品" persistent-hint
        />
      </v-col>
      <v-col cols="12" md="4">
        <v-select
          v-model="local.media_types" :items="mediaTypeOptions" label="媒体类型"
          multiple chips closable-chips density="comfortable"
        />
      </v-col>
      <v-col cols="12" md="4">
        <v-text-field
          v-model.number="local.start_year" label="起始年份" type="number"
          density="comfortable" hint="早于此年份的作品忽略" persistent-hint
        />
      </v-col>
    </v-row>

    <v-row dense>
      <v-col cols="12" md="6">
        <v-select
          v-model="local.genres_include" :items="genreOptions" label="题材必须包含（留空不限）"
          item-title="name" item-value="id" multiple chips closable-chips
          density="comfortable" :menu-props="{ maxHeight: 320 }"
        />
      </v-col>
      <v-col cols="12" md="6">
        <v-select
          v-model="local.genres_exclude" :items="genreOptions" label="排除题材（如综艺）"
          item-title="name" item-value="id" multiple chips closable-chips
          density="comfortable" :menu-props="{ maxHeight: 320 }"
        />
      </v-col>
    </v-row>

    <v-row dense>
      <v-col cols="12" md="3">
        <v-text-field
          v-model.number="local.min_rating" label="最低评分（0-10）" type="number"
          min="0" max="10" step="0.1" density="comfortable"
        />
      </v-col>
      <v-col cols="12" md="3">
        <v-text-field
          v-model.number="local.min_vote_count" label="评分生效最低投票数" type="number"
          min="0" density="comfortable" hint="投票数不足时不启用评分门槛" persistent-hint
        />
      </v-col>
      <v-col cols="12" md="3">
        <v-switch
          v-model="local.main_role_only" label="仅主演/主创" color="primary"
          density="comfortable" hide-details
        />
      </v-col>
      <v-col cols="12" md="3">
        <v-switch
          v-model="local.chinese_title_required" label="要求中文译名" color="primary"
          density="comfortable" hide-details
        />
      </v-col>
    </v-row>

    <v-row dense>
      <v-col cols="12" md="4">
        <v-select
          v-model="local.quality" :items="qualityOptions" label="订阅质量（可选）"
          density="comfortable" clearable
        />
      </v-col>
      <v-col cols="12" md="4">
        <v-select
          v-model="local.resolution" :items="resolutionOptions" label="订阅分辨率（可选）"
          density="comfortable" clearable
        />
      </v-col>
      <v-col cols="12" md="4">
        <v-select
          v-model="local.effect" :items="effectOptions" label="订阅特效（可选）"
          density="comfortable" clearable
        />
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
import { computed, reactive, watch } from 'vue';

const props = defineProps({
  modelValue: { type: Object, default: () => ({}) },
  genres: { type: Array, default: () => [] },
});

const emit = defineEmits(['update:modelValue']);

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

// 只在挂载时从 props 取初值；不做 prop→local 的深度回写 watch，
// 否则会与 local→emit 形成"选择→emit→父更新→重新赋值→再 emit"的反馈死循环。
const local = reactive({ ...defaults(), ...(props.modelValue || {}) });

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
</script>
