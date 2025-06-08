<template>
  <div class="home-view">
    <section class="hero-section">
      <div class="hero-overlay"></div>
      <div class="hero-content">
        <h1 class="hero-title animate-fade-in-up" style="animation-delay: 0.2s;">欢迎来到简易OJ系统</h1>
        <p class="hero-subtitle animate-fade-in-up" style="animation-delay: 0.4s;">
          在我们的平台上磨练算法，精通数据结构，为您的下一次Codeforces做好万全准备。
        </p>
        <div class="animate-fade-in-up" style="animation-delay: 0.6s;">
            <el-button type="primary" size="large" @click="goToProblemList" round class="hero-button">
              <el-icon :size="20" style="margin-right: 8px;"><Trophy /></el-icon>
              开始挑战
            </el-button>
        </div>
      </div>
    </section>

    <section class="features-section">
      <el-row :gutter="30">
        <el-col :xs="24" :sm="8" v-for="(feature, index) in features" :key="feature.title"
                ref="featureCols"
                class="scroll-animate-item"
                :style="{'transition-delay': `${index * 100}ms`}">
          <el-card class="feature-card" shadow="hover">
            <div class="feature-content">
              <el-icon :size="40" class="feature-icon"><component :is="feature.icon" /></el-icon>
              <h3 class="feature-title">{{ feature.title }}</h3>
              <p class="feature-description">{{ feature.description }}</p>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </section>

    <section class="featured-content-section">
      <div class="section-header">
        <h2 class="scroll-animate-item" ref="featuredHeader">精选内容</h2>
        <p class="scroll-animate-item" ref="featuredSubHeader" style="transition-delay: 100ms;">从我们的每日推荐和专题训练开始您的旅程。</p>
      </div>
      <el-row :gutter="30">
        <el-col :xs="24" :md="12" v-for="(item, index) in featuredContent" :key="item.title"
                ref="featuredCols"
                class="scroll-animate-item"
                :style="{'transition-delay': `${index * 150}ms`}">
          <el-card class="featured-card" shadow="hover">
            <template #header>
              <div class="card-header">
                <span>{{ item.title }}</span>
              </div>
            </template>
            <p>{{ item.description }}</p>
            <el-button type="primary" plain @click="goToProblemList" class="featured-button">
              查看题目
            </el-button>
          </el-card>
        </el-col>
      </el-row>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, ComponentPublicInstance } from 'vue'; // 引入 ComponentPublicInstance
import { useRouter } from 'vue-router';
import { ElCard, ElButton, ElRow, ElCol, ElIcon } from 'element-plus';
import { Trophy, FolderOpened, Cpu, Stopwatch } from '@element-plus/icons-vue';

const router = useRouter();

const goToProblemList = () => {
  router.push('/problem');
};

const features = [
  { icon: FolderOpened, title: '1+ 精选题目', description: '覆盖各种算法、数据结构，并持续更新。' },
  { icon: Cpu, title: '支持多种语言', description: '您可以使用 C++, Java, Python 等主流语言进行解题。' },
  { icon: Stopwatch, title: '即时评测反馈', description: '提交代码后立即获得详细的运行结果和性能分析。' }
];

const featuredContent = [
  { title: '今日推荐：', description: '一道经典的入门题目，帮您快速熟悉平台操作流程和解题模式。', link: '/problem' },
  { title: '专题训练：', description: '通过一系列精心设计的题目，助您攻克动态规划这一核心难点。', link: '/problem' }
];



type ElementRef = (Element | ComponentPublicInstance | null);

const featureCols = ref<ElementRef[]>([]);
const featuredHeader = ref<ElementRef>(null);
const featuredSubHeader = ref<ElementRef>(null);
const featuredCols = ref<ElementRef[]>([]);

let observer: IntersectionObserver;

onMounted(() => {

  const elementsToObserve = [
    ...featureCols.value.map(el => (el as any)?.$el || el),
    (featuredHeader.value as any)?.$el || featuredHeader.value,
    (featuredSubHeader.value as any)?.$el || featuredSubHeader.value,
    ...featuredCols.value.map(el => (el as any)?.$el || el),
  ].filter((el): el is Element => el instanceof Element); 

  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.1,
    }
  );

  elementsToObserve.forEach((el) => {
    if(el) observer.observe(el);
  });
});

onBeforeUnmount(() => {
  if (observer) {
    observer.disconnect();
  }
});
</script>

<style scoped>
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translate3d(0, 30px, 0);
  }
  to {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }
}

.animate-fade-in-up {
  animation: fadeInUp 0.8s ease-out forwards;
}

.scroll-animate-item {
  opacity: 0;
  transform: translateY(30px);
  transition: opacity 0.6s ease-out, transform 0.6s ease-out;
}

.scroll-animate-item.is-visible {
  opacity: 1;
  transform: translateY(0);
}



.home-view {
  width: 100%;
}
.section-header {
  text-align: center;
  margin-bottom: 40px;
}
.section-header h2 {
  font-size: 2.2em;
  font-weight: 600;
  margin-bottom: 10px;
}
.section-header p {
  font-size: 1.1em;
  color: #6c757d;
}

.hero-section {
  position: relative;
  height: 55vh;
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: #fff;
   background: url('https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=2070&auto=format&fit=crop') no-repeat center center/cover;
  overflow: hidden; 
}

.hero-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(10, 25, 47, 0.6);
}

.hero-content {
  position: relative;
  z-index: 2;
  padding: 20px;
}
.hero-title {
  font-size: 3.5em;
  font-weight: 700;
  margin-bottom: 0.5em;
  text-shadow: 2px 2px 8px rgba(0,0,0,0.7);
}
.hero-subtitle {
  font-size: 1.4em;
  max-width: 600px;
  margin: 0 auto 1.5em;
  line-height: 1.6;
  font-weight: 300;
}
/* --- 新增：按钮悬停特效 --- */
.hero-button {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}
.hero-button:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 20px rgba(64, 158, 255, 0.5);
}

.features-section {
  padding: 60px 5%;
  background-color: #f8f9fa;
  text-align: center;
}
.feature-card {
  border: none;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}
.feature-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.08);
}
/* --- 新增：图标悬停特效 --- */
.feature-card:hover .feature-icon {
  transform: scale(1.2) rotate(-15deg);
  color: #ffc107; /* 悬停时图标变色 */
}
.feature-icon {
  color: #409EFF;
  margin-bottom: 15px;
  transition: transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94), color 0.3s ease; /* 平滑过渡 */
}
.feature-title {
  font-size: 1.5em;
  font-weight: 600;
  margin-bottom: 10px;
}
.feature-description {
  font-size: 1em;
  color: #5f6368;
  line-height: 1.6;
}

.featured-content-section {
  padding: 60px 5%;
}
.featured-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
.featured-card p {
  color: #5f6368;
  line-height: 1.7;
  flex-grow: 1;
  margin-bottom: 20px;
}
/* --- 新增：精选卡片按钮特效 --- */
.featured-button {
  transition: background-color 0.3s ease, color 0.3s ease, transform 0.3s ease;
}
.featured-button:hover {
  background-color: #409EFF;
  color: #fff;
  transform: translateY(-2px);
}

@media (max-width: 768px) {
  .hero-title { font-size: 2.5em; }
  .hero-subtitle { font-size: 1.1em; }
  .features-section, .featured-content-section { padding: 40px 20px; }
  .el-col { margin-bottom: 25px; }
  .el-col:last-child { margin-bottom: 0; }
}
</style>