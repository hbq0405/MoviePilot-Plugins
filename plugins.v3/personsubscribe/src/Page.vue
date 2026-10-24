<template>
  <div class="ps-page-root pa-4">
    <v-card variant="outlined" class="pa-4 mb-4">
      <div class="d-flex align-center flex-wrap ga-2">
        <h3 class="ma-0">人物订阅</h3>
        <v-chip size="small" variant="tonal" color="primary">
          {{ persons.length }} 位人物
        </v-chip>
        <v-spacer />
        <v-btn color="primary" prepend-icon="mdi-account-plus" :loading="searchLoading"
               @click="openSearch">添加人物</v-btn>
        <v-btn variant="tonal" prepend-icon="mdi-refresh" :disabled="refreshingAll"
               @click="onRefreshAll">全部刷新</v-btn>
        <v-btn variant="text" icon="mdi-close" size="small" title="关闭"
               @click="emit('close')" />
      </div>
      <div v-if="lastSummary" class="text-caption text-medium-emphasis mt-2">
        {{ lastSummary }}
      </div>
    </v-card>

    <div v-if="loading" class="d-flex justify-center pa-8">
      <v-progress-circular indeterminate />
    </div>

    <v-alert v-else-if="!persons.length" type="info" variant="tonal">
      还没有订阅任何人物。点击「添加人物」，搜索 TMDb 演员/导演（展示头像与代表作，人工确认）。
    </v-alert>

    <div v-else class="ps-person-grid">
      <v-card v-for="person in persons" :key="person.person_id" variant="outlined"
              class="ps-person-card" @click="openDetail(person)">
        <div class="d-flex flex-nowrap">
          <div class="ps-avatar-wrap">
            <v-img v-if="person.profile_url" :src="person.profile_url" width="72" height="108"
                   cover class="ps-avatar" />
            <div v-else class="ps-avatar ps-avatar-empty d-flex align-center justify-center">
              <v-icon icon="mdi-account" size="32" />
            </div>
          </div>
          <div class="ps-person-body">
            <div class="d-flex align-center flex-wrap ga-1">
              <span class="text-subtitle-1 font-weight-medium">{{ person.name }}</span>
              <v-chip size="x-small" variant="tonal">{{ departmentName(person) }}</v-chip>
              <v-chip size="x-small" :color="person.status === 'active' ? 'success' : 'grey'">
                {{ person.status === 'active' ? '订阅中' : '已暂停' }}
              </v-chip>
            </div>
            <div v-if="person.original_name" class="text-caption text-medium-emphasis">
              {{ person.original_name }}
            </div>
            <div class="d-flex flex-wrap ga-1 mt-2">
              <v-chip v-if="person.stats.wanted" size="x-small" color="warning" variant="tonal">
                订阅 {{ person.stats.wanted }}</v-chip>
              <v-chip v-if="person.stats.pending_release" size="x-small" variant="tonal">
                待映 {{ person.stats.pending_release }}</v-chip>
              <v-chip v-if="person.stats.fulfilled" size="x-small" color="success" variant="tonal">
                入库 {{ person.stats.fulfilled }}</v-chip>
              <v-chip v-if="person.stats.ignored" size="x-small" color="grey" variant="tonal">
                忽略 {{ person.stats.ignored }}</v-chip>
            </div>
            <div class="text-caption text-medium-emphasis mt-2">
              {{ person.last_checked_at ? `上次扫描：${formatTime(person.last_checked_at)}` : '尚未扫描' }}
            </div>
            <v-alert v-if="person.last_error" type="error" variant="tonal" density="compact"
                     class="mt-1 ps-error">
              {{ person.last_error }}
            </v-alert>
          </div>
        </div>
      </v-card>
    </div>

    <!-- 添加人物：搜索 TMDb，人工确认避免同名误订 -->
    <v-dialog v-model="searchOpen" max-width="720">
      <v-card>
        <v-card-title class="d-flex align-center">
          添加人物订阅
          <v-spacer />
          <v-btn icon="mdi-close" variant="text" size="small" @click="searchOpen = false" />
        </v-card-title>
        <v-card-text>
          <div class="d-flex ga-2 mb-3">
            <v-text-field v-model="searchQuery" label="输入演员/导演姓名" density="comfortable"
                          hide-details clearable @keyup.enter="runSearch" />
            <v-btn color="primary" :loading="searchLoading" :disabled="!searchQuery.trim()"
                   @click="runSearch">搜索</v-btn>
          </div>
          <div v-if="searchLoading" class="d-flex justify-center pa-6">
            <v-progress-circular indeterminate />
          </div>
          <v-alert v-else-if="searchError" type="warning" variant="tonal">{{ searchError }}</v-alert>
          <v-alert v-else-if="searched && !searchResults.length" type="info" variant="tonal">
            没有找到匹配的人物
          </v-alert>
          <div v-else class="ps-search-list">
            <div v-for="item in searchResults" :key="item.person_id" class="ps-search-item">
              <v-img v-if="item.profile_url" :src="item.profile_url" width="52" height="78"
                     cover class="ps-avatar" />
              <div v-else class="ps-avatar ps-avatar-empty d-flex align-center justify-center">
                <v-icon icon="mdi-account" size="24" />
              </div>
              <div class="ps-search-body">
                <div class="d-flex align-center flex-wrap ga-1">
                  <span class="font-weight-medium">{{ item.name }}</span>
                  <v-chip size="x-small" variant="tonal">
                    {{ departmentName(item) }}
                  </v-chip>
                </div>
                <div v-if="item.original_name" class="text-caption text-medium-emphasis">
                  {{ item.original_name }}
                </div>
                <div v-if="item.known_for.length" class="text-caption text-medium-emphasis mt-1">
                  代表作：{{ item.known_for.map((k) => k.title).join(' / ') }}
                </div>
              </div>
              <v-btn size="small" color="primary" variant="tonal"
                     :disabled="isSubscribed(item.person_id)" @click.stop="addPerson(item)">
                {{ isSubscribed(item.person_id) ? '已订阅' : '订阅' }}
              </v-btn>
            </div>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- 人物详情：作品追踪 + 管理 -->
    <v-dialog v-model="detailOpen" max-width="900" scrollable>
      <v-card>
        <v-card-title class="d-flex align-center flex-wrap ga-2">
          <template v-if="detail">
            {{ detail.person.name }}
            <v-chip size="small" :color="detail.person.status === 'active' ? 'success' : 'grey'">
              {{ detail.person.status === 'active' ? '订阅中' : '已暂停' }}
            </v-chip>
          </template>
          <v-spacer />
          <v-btn v-if="detail" size="small" variant="tonal" prepend-icon="mdi-pause"
                 @click="togglePersonStatus">
            {{ detail.person.status === 'active' ? '暂停' : '恢复' }}
          </v-btn>
          <v-btn v-if="detail" size="small" variant="tonal" prepend-icon="mdi-refresh"
                 @click="refreshPerson">手动刷新</v-btn>
          <v-btn v-if="detail" size="small" variant="tonal" prepend-icon="mdi-cog"
                 @click="openStrategy">策略</v-btn>
          <v-btn v-if="detail" size="small" variant="tonal" color="error" prepend-icon="mdi-delete"
                 @click="confirmDelete = true">删除</v-btn>
          <v-btn icon="mdi-close" variant="text" size="small" @click="detailOpen = false" />
        </v-card-title>
        <v-divider />
        <v-card-text>
          <div v-if="detailLoading" class="d-flex justify-center pa-6">
            <v-progress-circular indeterminate />
          </div>
          <template v-else-if="detail">
            <v-alert v-if="detail.person.last_error" type="error" variant="tonal" density="compact"
                     class="mb-3">{{ detail.person.last_error }}</v-alert>
            <div class="text-caption text-medium-emphasis mb-3">
              {{ detail.person.last_checked_at ? `上次扫描：${formatTime(detail.person.last_checked_at)}` : '尚未扫描' }}
            </div>
            <v-alert v-if="!detail.targets.length" type="info" variant="tonal">
              暂无作品记录，等待下一次扫描
            </v-alert>
            <div v-else class="ps-target-list">
              <div v-for="target in detail.targets" :key="target.key" class="ps-target-item">
                <v-img v-if="target.poster_url" :src="target.poster_url" width="46" height="69"
                       cover class="ps-avatar" />
                <div v-else class="ps-avatar ps-avatar-empty d-flex align-center justify-center">
                  <v-icon icon="mdi-movie-open" size="20" />
                </div>
                <div class="ps-target-body">
                  <div class="d-flex align-center flex-wrap ga-1">
                    <span class="font-weight-medium">{{ target.title }}</span>
                    <v-chip size="x-small" :color="targetMeta(target).color" variant="tonal">
                      {{ targetMeta(target).text }}
                    </v-chip>
                    <v-chip v-if="target.entity_type === 'tv'" size="x-small" variant="tonal">
                      剧集
                    </v-chip>
                  </div>
                  <div class="text-caption text-medium-emphasis">
                    {{ target.release_date || '未定档' }}
                    <template v-if="target.vote_average">· 评分 {{ target.vote_average }}</template>
                    <template v-if="target.genre_names && target.genre_names.length">
                      · {{ target.genre_names.join(' / ') }}</template>
                    <template v-if="target.role === 'directing'">· 执导</template>
                  </div>
                </div>
                <div class="ps-target-actions">
                  <v-btn v-if="target.status === 'ignored'" size="x-small" variant="tonal"
                         @click="setTarget(target, 'wanted')">恢复订阅</v-btn>
                  <v-btn v-else-if="target.status !== 'fulfilled'" size="x-small" variant="text"
                         color="grey" @click="setTarget(target, 'ignored')">忽略</v-btn>
                </div>
              </div>
            </div>
          </template>
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- 人物策略编辑 -->
    <v-dialog v-model="strategyOpen" max-width="760">
      <v-card>
        <v-card-title class="d-flex align-center">
          独立策略{{ detail ? ` - ${detail.person.name}` : '' }}
          <v-spacer />
          <v-btn icon="mdi-close" variant="text" size="small" @click="strategyOpen = false" />
        </v-card-title>
        <v-card-text>
          <div class="text-caption text-medium-emphasis mb-2">
            表单显示当前实际生效策略（默认策略 + 个人覆盖）；保存时只固定与默认不同的字段，
            其余字段继续跟随默认策略变化。
          </div>
          <StrategyForm v-if="strategyOpen" v-model="strategyDraft" :genres="genres" />
          <div class="d-flex justify-end ga-2 mt-3">
            <v-btn variant="text" @click="useDefaultStrategy">重置为默认</v-btn>
            <v-btn color="primary" :loading="strategySaving" @click="saveStrategy">保存</v-btn>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- 删除确认 -->
    <v-dialog v-model="confirmDelete" max-width="420">
      <v-card>
        <v-card-title>删除人物订阅</v-card-title>
        <v-card-text>
          确定删除 {{ detail ? detail.person.name : '' }} 的订阅吗？已创建的 MoviePilot
          订阅不会被删除；无其他人物关注的待订阅目标将被移除。
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="confirmDelete = false">取消</v-btn>
          <v-btn color="error" :loading="deleting" @click="deletePerson">删除</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="3000">
      {{ snackbar.text }}
    </v-snackbar>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';
import StrategyForm from './StrategyForm.vue';
import { pluginApi } from './api.js';

const emit = defineEmits(['close']);

const persons = ref([]);
const genres = ref([]);
const pluginDefaultConfig = ref(null);
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

function formatTime(value) {
  // "2026-10-25 00:17:23" -> "10-25 00:17"，去年份只留日期时间。
  const raw = String(value || '');
  const matched = raw.match(/^\d{4}-(\d{2}-\d{2} \d{2}:\d{2})/);
  return matched ? matched[1] : raw;
}

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
  if (target.status === 'fulfilled') return { text: '已入库', color: 'success' };
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
    if (total) lastSummary.value = `共追踪 ${total} 部作品，已入库 ${fulfilled} 部`;
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
  // 展示实际生效策略（默认 + 个人覆盖），而不是只展示覆盖字段，
  // 否则未覆盖字段会显示成代码默认值，与真实生效值割裂。
  const effective = detail.value.person.effective_config
    || { ...(pluginDefaultConfig.value || {}), ...(detail.value.person.config || {}) };
  strategyDraft.value = { ...effective };
  strategyOpen.value = true;
}

function useDefaultStrategy() {
  strategyDraft.value = { ...(pluginDefaultConfig.value || {}) };
}

function diffStrategy(form, defaults) {
  // 只保留与默认策略不同的字段；数组按值比较。
  const override = {};
  const base = defaults || {};
  for (const [key, value] of Object.entries(form || {})) {
    if (JSON.stringify(value) !== JSON.stringify(base[key])) {
      override[key] = value;
    }
  }
  return override;
}

async function saveStrategy() {
  if (!detail.value) return;
  strategySaving.value = true;
  try {
    // 与默认策略一致的表单值不保存，保持跟随默认策略变化。
    const override = pluginDefaultConfig.value
      ? diffStrategy(strategyDraft.value, pluginDefaultConfig.value)
      : { ...strategyDraft.value };
    const response = await pluginApi.updatePerson(detail.value.person.person_id, {
      config: Object.keys(override).length ? override : null,
    });
    if (response.success === false) {
      notify(response.message || '保存失败', 'error');
      return;
    }
    notify('策略已保存');
    strategyOpen.value = false;
    detail.value.person.config = Object.keys(override).length ? override : null;
    await reloadDetail();
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
  loadDefaultConfig();
});

async function loadDefaultConfig() {
  try {
    const response = await pluginApi.getConfig();
    pluginDefaultConfig.value = response.config?.default_config || null;
  } catch (error) {
    pluginDefaultConfig.value = null;
  }
}
</script>

<style scoped>
.ps-page-root {
  width: 100%;
}
.ps-person-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 12px;
}
.ps-avatar {
  border-radius: 6px;
  overflow: hidden;
  flex: none;
}
.ps-avatar-wrap {
  flex: none;
  margin-right: 12px;
}
.ps-avatar-empty {
  background: rgba(128, 128, 128, 0.15);
  width: 72px;
  height: 108px;
}
.ps-person-body {
  min-width: 0;
  flex: 1;
}
.ps-person-card {
  cursor: pointer;
}
.ps-search-list,
.ps-target-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.ps-search-item,
.ps-target-item {
  display: flex;
  align-items: center;
  gap: 12px;
  border: 1px solid rgba(128, 128, 128, 0.25);
  border-radius: 8px;
  padding: 8px;
}
.ps-search-item .ps-avatar-empty,
.ps-target-item .ps-avatar-empty {
  width: 52px;
  height: 78px;
}
.ps-target-item .ps-avatar-empty {
  width: 46px;
  height: 69px;
}
.ps-search-body,
.ps-target-body {
  flex: 1;
  min-width: 0;
}
.ps-target-actions {
  flex: none;
}
</style>
