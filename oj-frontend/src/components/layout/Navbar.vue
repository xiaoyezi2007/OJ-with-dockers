<template>
<div class="navbar">
<div class="logo-area">
<router-link to="/">OJ System</router-link>
</div>
<el-menu
mode="horizontal"
:default-active="activeIndex"
background-color="#409EFF"
text-color="#fff"
active-text-color="#ffd04b"
router
>
<el-menu-item index="/">首页</el-menu-item>
<el-menu-item index="/problem">题目列表</el-menu-item>
<el-menu-item index="/submission">提交记录</el-menu-item>
<el-menu-item index="/upload">上传题目</el-menu-item>
</el-menu>
</div>
</template>



<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRoute } from 'vue-router';
// import { useAuthStore } from '@/store/auth'; // 假设有认证 store

const route = useRoute();
// const authStore = useAuthStore();
// const isLoggedIn = computed(() => authStore.isAuthenticated);

const activeIndex = computed(() => route.path);

// const handleLogout = () => {
//   authStore.logout();
//   // router.push('/login');
// };
</script>

<style scoped lang="scss">
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 60px; // 你可以调整导航栏高度
  padding: 0 25px; // 为导航栏添加了水平内边距
  background-color: #3A8EE6; // 尝试一个略有不同、可能更“沉稳”的蓝色
  // box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); // 可选：细微的阴影增加层次感

  .logo-area {
    font-size: 22px; // 略微增大字号，使其更突出
    font-weight: 600; // 更精致的粗体效果
    a {
      color: #FFFFFF; // 纯白色以保证良好对比度
      text-decoration: none;
      transition: color 0.3s ease; // 文字颜色过渡
      &:hover {
        color: #E0E0E0; // 悬停时文字颜色轻微变暗作为反馈
      }
    }
  }

  .el-menu {
    border-bottom: none; // 保留这个，移除默认下边框
    background-color: transparent !important; // 使菜单背景透明，继承导航栏的背景色
    height: 100%; // 确保菜单占据导航栏的全部高度，以便对齐

    // 直接针对菜单项进行更精细的控制
    .el-menu-item {
      padding: 0 20px; // 增加水平内边距
      font-size: 15px; // 调整字号
      color: #FFFFFF; // 默认文字颜色
      transition: background-color 0.25s ease-out, color 0.25s ease-out; // 更平滑的过渡效果

      &:hover {
        background-color: #509DEE !important; // 一个更亮、区分度更高的悬停蓝色
        color: #FFFFFF !important; // 悬停时文字颜色保持白色
      }

      &.is-active { // 激活项的样式
        background-color: #2A7ABC !important; // 使用一个更深或更有区分度的颜色作为激活背景
        color: #FFD04B !important; // 如果你喜欢，可以保留你当前的激活文字颜色
        // 或者，一个更低调的激活状态：
        // border-bottom: 2px solid #FFD04B; // 底部边框高亮
        // background-color: transparent !important; // 背景透明
        // color: #FFD04B !important; // 仅文字颜色变化
        font-weight: 600; // 激活项文字略微加粗
      }
    }
  }
}
</style>