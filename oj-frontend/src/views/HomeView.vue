<template>
  <div class="home-view">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>欢迎来到简易 OJ 在线判题系统</span>
        </div>
      </template>
      <p>这里是首页。</p>
      <p>您可以在这里浏览最新的公告、热门题目或者系统简介等。</p>
      <el-button type="primary" @click="goToProblemList">开始刷题</el-button>
    </el-card>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { useRouter } from 'vue-router';
import { ElCard, ElButton } from 'element-plus'; // 按需导入 Element Plus 组件

export default defineComponent({
  name: 'HomeView',
  components: {
    ElCard,
    ElButton,
  },
  setup() {
    const router = useRouter();

    const goToProblemList = () => {
      router.push('/problem'); // 假设题目列表页的路由是 /problem
    };

    return {
      goToProblemList,
    };
  },
});
</script>

<style scoped>
.home-view {
  padding: 20px;
  display: flex;
  justify-content: center;
  align-items: flex-start; /* 改为 flex-start 以便卡片在顶部 */
  min-height: calc(100vh - 120px); /* 假设 Navbar 和 Footer 总高度约为 120px */
}

.box-card {
  width: 600px;
  max-width: 90%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 1.2em;
  font-weight: bold;
}

p {
  line-height: 1.6;
  margin-bottom: 15px;
}
</style>