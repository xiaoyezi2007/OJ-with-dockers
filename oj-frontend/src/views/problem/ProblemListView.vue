<template>
  <div class="problem-list-view">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>题目列表</span>
          <div>
            <el-input
              v-model="searchQuery.keyword"
              placeholder="搜索题目名称"
              style="width: 200px; margin-right: 10px;"
              clearable
              @clear="() => loadProblems(1)"
              @keyup.enter="() => loadProblems(1)" 
            />
            <el-select
              v-model="searchQuery.difficulty"
              placeholder="难度"
              clearable
              style="width: 120px; margin-right: 10px;"
              @change="() => loadProblems(1)" 
            >
              <el-option label="简单" value="Easy" />
              <el-option label="中等" value="Medium" />
              <el-option label="困难" value="Hard" />
            </el-select>
            <el-button type="primary" @click="() => loadProblems(1)" :loading="problemStore.isLoading">搜索</el-button>
          </div>
        </div>
      </template>

      <el-table :data="problemStore.problems" style="width: 100%" v-loading="problemStore.isLoading">
        <el-table-column prop="_id" label="题号" width="100" align="center" />
        <el-table-column prop="title" label="标题" min-width="300">
          <template #default="{ row }">
            <router-link :to="`/problems/${row._id}`" class="problem-title-link">
              {{ row.title }}
            </router-link>
          </template>
        </el-table-column>
        <el-table-column prop="difficulty" label="难度" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="getDifficultyTagType(row.difficulty)">
              {{ row.difficulty }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="acceptanceRate" label="通过率" width="120" align="center">
          <template #default="{ row }">
            {{ row.acceptanceRate? (row.acceptanceRate * 100).toFixed(2) + '%' : 'N/A' }}
          </template>
        </el-table-column>
        <el-table-column label="标签" width="200" align="center">
            <template #default="{ row }">
                <el-tag v-for="tag in row.tags" :key="tag" type="info" size="small" style="margin-right: 5px;">
                    {{ tag }}
                </el-tag>
            </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-if="problemStore.pagination.totalItems > 0"
        background
        layout="prev, pager, next, jumper, ->, total"
        :total="problemStore.pagination.totalItems"
        :current-page="problemStore.pagination.currentPage"
        :page-size="problemStore.pagination.pageSize"
        @current-change="handlePageChange"
        style="margin-top: 20px; justify-content: flex-end;"
      />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive } from 'vue';
import { useProblemStore } from '@/store/problem';
import type { ProblemDifficulty } from '@/types/problem'; // 假设类型定义

const problemStore = useProblemStore();

const searchQuery = reactive({
  keyword: '',
  difficulty: '' as ProblemDifficulty | '',
});

const loadProblems = (page = 1) => {
  problemStore.fetchProblems({
    page,
    limit: problemStore.pagination.pageSize,
    keyword: searchQuery.keyword,
    difficulty: searchQuery.difficulty,
  });
};

const handleSearchClick = () => {
  loadProblems(1); // 明确从第一页开始搜索
};

const handlePageChange = (newPage: number) => {
  loadProblems(newPage);
};

const getDifficultyTagType = (difficulty: ProblemDifficulty) => {
  if (difficulty === 'Easy') return 'success';
  if (difficulty === 'Medium') return 'warning';
  if (difficulty === 'Hard') return 'danger';
  return 'info';
};

onMounted(() => {
  loadProblems();
});
</script>

<style scoped lang="scss">


.problem-list-view {
padding: 20px;
}
.card-header {
display: flex;
justify-content: space-between;
align-items: center;
}
.problem-title-link {
color: #409eff;
text-decoration: none;
&:hover {
text-decoration: underline;
}
}
</style>
