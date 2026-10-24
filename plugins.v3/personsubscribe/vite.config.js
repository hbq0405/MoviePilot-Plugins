// 人物订阅 Vite 联邦配置（remote）
//
// 参考 MoviePilot-Frontend 官方 module-federation-guide.md 与
// MoviePilot-Plugins fullscreenposterwall 插件写法：
//   1. 不显式指定 rollupOptions.input——federation 插件生成
//      `__federation_expose_<Name>-<hash>.js`，MoviePilot 加载器按该命名约定查找。
//   2. shared 只挂 vue（singleton）；Vuetify 组件与样式由 MoviePilot 主框架
//      全局注册并提供，remote 不重复打包。
//   3. postcss 删除 .v-* / .mdi-* 规则，避免与主框架 Vuetify 样式冲突。
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import federation from '@originjs/vite-plugin-federation';

export default defineConfig({
  appType: 'custom',
  plugins: [
    vue(),
    federation({
      name: 'PersonSubscribe',
      filename: 'remoteEntry.js',
      exposes: {
        './Page': './src/Page.vue',
        './Config': './src/Config.vue',
      },
      shared: {
        vue: { requiredVersion: false, generate: false },
      },
      format: 'esm',
    }),
  ],
  build: {
    target: 'esnext',
    cssCodeSplit: true,
    sourcemap: false,
    minify: false,
    rollupOptions: {
      output: {
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
  },
  css: {
    postcss: {
      plugins: [
        {
          postcssPlugin: 'internal:charset-removal',
          AtRule: {
            charset: (atRule) => {
              if (atRule.name === 'charset') atRule.remove();
            },
          },
        },
        {
          postcssPlugin: 'vuetify-filter',
          Root(root) {
            root.walkRules((rule) => {
              if (
                rule.selector &&
                (rule.selector.includes('.v-') || rule.selector.includes('.mdi-'))
              ) {
                rule.remove();
              }
            });
          },
        },
      ],
    },
  },
});
