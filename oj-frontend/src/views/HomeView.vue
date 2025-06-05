<template>
  <div class="home-view">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>欢迎来到简易 OJ 在线判题系统</span>
        </div>
      </template>
      <p>这里是首页，一个致力于提供便捷、高效编程练习与评测的平台。</p>
      <p>您可以在这里探索最新题目、参与在线编程挑战，并查看您的提交记录，不断提升编程技能。</p>
      <div class="action-button-container">
        <el-button type="primary" size="large" @click="goToProblemList">
          开始刷题
        </el-button>
      </div>
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
      router.push('/problem'); // 题目列表页的路由是 /problem
    };

    return {
      goToProblemList,
    };
  },
});
</script>

<style scoped>
.home-view {
  padding: 30px 20px; /* 增加上下内边距 */
  display: flex;
  justify-content: center;
  align-items: flex-start;
  min-height: calc(100vh - 120px); /* 假设 Navbar 和 Footer 总高度约为 120px */
}

.box-card {
  width: 700px; /* 可以适当调整宽度 */
  max-width: 95%; /* 确保在小屏幕上的适应性 */
  border-radius: 8px; /* 轻微的圆角 */
  /* Element Plus 的 el-card 通常自带合适的阴影，如果需要自定义可以取消下面的注释 */
  /* box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); */
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 15px; /* 增加底部内边距，为下边框留出空间 */
  border-bottom: 1px solid #ebeeef; /* 在头部下方添加一条细线 */
}

.card-header span { /* 直接针对 span 调整样式 */
  font-size: 1.3em; /* 稍微增大标题字号 */
  font-weight: 600; /* 使用 semi-bold */
  color: #303133; /* Element Plus 默认的主文字颜色 */
}

p {
  line-height: 1.7; /* 调整行高以获得更好的阅读体验 */
  margin-bottom: 18px; /* 调整段落下边距 */
  font-size: 1em; /* 标准字号 */
  color: #5f6368; /* 使用柔和的深灰色文字 */
}

p:last-of-type { /* 最后一个 p 标签的下边距可以小一些，或根据按钮调整 */
  margin-bottom: 25px;
}

/* 按钮可以包裹在一个 div 中，方便控制其对齐方式和边距 */
.action-button-container {
  text-align: center; /* 例如，让按钮居中 */
  margin-top: 20px; /* 按钮容器的顶部外边距 */
}
</style>