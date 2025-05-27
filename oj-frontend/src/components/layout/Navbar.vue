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
<el-menu-item index="/submissions">提交记录</el-menu-item>
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
height: 100%;



 .logo-area {
    font-size: 20px;
    font-weight: bold;
    a {
      color: white;
      text-decoration: none;
    }
  }
 .el-menu {
    border-bottom: none; // 去除 el-menu 默认的下边框
  }
 .el-menu-item {
    &:hover {
      background-color: #66b1ff!important; // 调整 hover 背景色
    }
  }
}
</style>
