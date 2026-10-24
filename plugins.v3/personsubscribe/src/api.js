// 宿主把主框架 axios 挂在 window.MoviePilotAPI 上（baseURL 已是 api/v1/），
// 插件内路径使用 'plugin/<PluginId>/<path>'，不能带 'api/v1' 前缀（会双前缀 404）。
const API_BASE = 'plugin/PersonSubscribe';

export function getApi() {
  return typeof window !== 'undefined' ? window.MoviePilotAPI : null;
}

async function call(fn, path, ...args) {
  const api = getApi();
  if (!api || typeof api[fn] !== 'function') {
    throw new Error('MoviePilot API 不可用');
  }
  return api[fn](`${API_BASE}${path}`, ...args);
}

export const pluginApi = {
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
