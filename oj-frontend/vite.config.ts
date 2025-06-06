import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';
import AutoImport from 'unplugin-auto-import/vite';
import Components from 'unplugin-vue-components/vite';
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers';

export default defineConfig({
  plugins: [
    vue(), // Vue 插件

    // unplugin-auto-import 配置
    AutoImport({
      // 自动导入 Vue 相关函数，如：ref, reactive, toRef 等
      imports: ['vue', 'vue-router', 'pinia'], // 根据需要添加
      eslintrc: { // 自动生成 .eslintrc-auto-import.json 文件，提供给 ESLint
        enabled: true, // 默认false, true启用。生成一次就可以，避免每次工程启动都生成
        filepath: './.eslintrc-auto-import.json', // 生成文件的路径
        globalsPropValue: true, // 默认true, ESLint会认为全局变量是由globals属性定义的
      },
      // 指定自动导入的 TypeScript 类型声明文件路径
      dts: 'src/auto-imports.d.ts',
    }),

    // unplugin-vue-components 配置
    Components({
      // 配置 Element Plus 组件的解析器，实现按需导入
      resolvers: [ElementPlusResolver()],
      // 指定组件的 TypeScript 类型声明文件路径
      dts: 'src/components.d.ts',
    }),
  ],
  server: {
    proxy: {
      // 当请求路径以 /api 开头时，触发此代理
      '/api': {
        target: 'http://localhost:5000', // 修正：指向正确的后端端口 5000
        changeOrigin: true, // 必须设置为 true
        // 移除 rewrite 规则，保持路径不变
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
