# MoviePilot 人物订阅插件仓库

[PersonSubscribe（人物订阅）](plugins.v3/personsubscribe/README.md) 的独立插件市场仓库。

## 安装

MoviePilot → 插件市场 → 添加仓库，填入：

```text
https://github.com/hbq0405/MoviePilot-PersonSubscribe
```

然后在市场中安装「人物订阅」，启用并在插件详情页添加人物即可。

```text
plugins.v3/personsubscribe/   # 插件源码（后端 + Vue 联邦前端）
tests/v3/personsubscribe/     # 纯逻辑单元测试（本地可直接 pytest）
package.v3.json               # 市场索引
icons/personsubscribe.png     # 插件图标
```

开发：

```bash
# 后端语法检查 + 单元测试
python -m py_compile plugins.v3/personsubscribe/__init__.py plugins.v3/personsubscribe/core.py
python -m pytest tests/v3/personsubscribe -q

# 前端构建（产物 dist/ 随插件发布）
cd plugins.v3/personsubscribe && npm install && npm run build
```
