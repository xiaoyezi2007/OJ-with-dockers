<template>
  <el-container class="main-layout">
    <el-header class="main-header">
      <Navbar />
    </el-header>
    <el-main class="main-content">
      <router-view /> </el-main>
    <el-footer class="main-footer" v-if="showFooter">
      © {{ new Date().getFullYear() }} Online Judge System
    </el-footer>
  </el-container>
</template>

<script setup lang="ts">
import Navbar from '@/components/layout/Navbar.vue';
import { ref } from 'vue';

const showFooter = ref(true); // 控制页脚显示
</script>

<style scoped lang="scss">


.main-layout {
min-height: 100vh;
display: flex;
flex-direction: column;
}
.main-header {
background-color: #409eff; // 示例颜色
color: white;
line-height: 60px; // 与 el-header 默认高度一致
padding: 0 20px;
position: sticky;
top: 0;
z-index: 1000;
}
.main-content {
flex-grow: 1; // 确保主内容区填满剩余空间
padding: 20px;
background-color: #f4f4f5; // 示例背景色
}
.main-footer {
background-color: #e9eef3; // 示例颜色
color: #333;
text-align: center;
line-height: 60px; // 与 el-footer 默认高度一致
padding: 0 20px;
}
</style>
