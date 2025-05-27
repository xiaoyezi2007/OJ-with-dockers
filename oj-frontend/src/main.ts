// src/main.ts
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import './styles/index.scss'; // 引入全局样式

// 确认 main.ts 开始执行
console.log('[Main.ts] Script start');

try {
  console.log('[Main.ts] Creating Vue app instance...');
  const app = createApp(App);
  console.log('[Main.ts] Vue app instance created.');

  console.log('[Main.ts] Creating Pinia instance...');
  const pinia = createPinia();
  console.log('[Main.ts] Pinia instance created.');

  console.log('[Main.ts] Using router...');
  app.use(router);
  console.log('[Main.ts] Router used.');

  console.log('[Main.ts] Using Pinia...');
  app.use(pinia);
  console.log('[Main.ts] Pinia used.');

  console.log('[Main.ts] Mounting app to #app...');
  app.mount('#app');
  console.log('[Main.ts] App mounted to #app.');

} catch (error) {
  // 捕获在应用初始化或挂载期间发生的任何同步错误
  console.error('[Main.ts] CRITICAL ERROR during app initialization or mount:', error);
}

console.log('[Main.ts] Script end');