<template>
  <div id="app-container">
    <Navbar v-if="shouldShowNavbar" />

    <div class="main-content">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </div>

    </div>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue';
import { useRoute } from 'vue-router';
import Navbar from '@/components/layout/Navbar.vue'; // 假设你有一个导航栏组件
// import FooterComponent from '@/components/layout/FooterComponent.vue'; // 如果有页脚

export default defineComponent({
  name: 'App',
  components: {
    Navbar,
    // FooterComponent,
  },
  setup() {
    const route = useRoute();

    // 根据路由元信息或其他逻辑决定是否显示 Navbar
    // 例如，登录页、注册页可能不需要显示主导航栏
    const shouldShowNavbar = computed(() => {
      // 默认显示，除非路由元信息指定不显示
      return route.meta.hideNavbar !== true;
    });

    return {
      shouldShowNavbar,
    };
  },
});
</script>

<style>
/* 全局样式，或者 App.vue 特有的样式 */
html, body {
  margin: 0;
  padding: 0;
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', Arial, sans-serif;
  background-color: #f4f5f7; /* 一个淡雅的背景色 */
  color: #333;
}

#app-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.main-content {
  flex-grow: 1; /* 让主要内容区域占据剩余空间 */
  padding: 20px; /* 给内容区域一些内边距 */
  /* 或者根据你的布局需求调整 */
}

/* 简单的页面切换过渡效果 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>