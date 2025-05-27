import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
import HomeView from '@/views/HomeView.vue'; // 示例：首页组件
import ProblemListView from '@/views/problem/ProblemListView.vue';
import ProblemDetailView from '@/views/problem/ProblemDetailView.vue';
const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'Home',
    component: HomeView,
  },
  // 后续会在此处添加更多路由
  {
    path: '/problem', // 对应 <el-menu-item index="/problem">
    name: 'ProblemList',
    component: ProblemListView, 
  },

  {
    path: '/problem/:id', // 使用动态路由匹配，:id 会作为参数
    name: 'ProblemDetail',
    component: ProblemDetailView,
    props: true // (可选但推荐) 将路由参数 :id 作为 props 传递给 ProblemDetailView 组件
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL), // 使用 history 模式
  routes,
});

export default router;
