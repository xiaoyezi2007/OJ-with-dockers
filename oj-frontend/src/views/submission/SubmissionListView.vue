<template>
  <div class="submission-list-view">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>提交记录</span>
          <div class="filter-controls">
            <el-input
              v-model="filterQuery.problemId"
              placeholder="题目ID"
              style="width: 180px; margin-right: 10px;"
              clearable
              @keyup.enter="handleFilterChange"
              @clear="() => { filterQuery.problemId = ''; handleFilterChange(); }"
            />
            <el-select
              v-model="filterQuery.status"
              placeholder="状态"
              clearable
              style="width: 160px; margin-right: 10px;"
              @change="handleFilterChange"
              @clear="() => { filterQuery.status = ''; handleFilterChange(); }"
            >
              <el-option label="全部状态" value="" />
              <el-option label="等待评测" value="Pending" />
              <el-option label="正在评测" value="Judging" />
              <el-option label="答案正确" value="Accepted" />
              <el-option label="答案错误" value="Wrong Answer" />
              <el-option label="编译错误" value="Compile Error" />
              <el-option label="运行超时" value="Time Limit Exceeded" />
              <el-option label="内存超限" value="Memory Limit Exceeded" />
              <el-option label="输出超限" value="Output Limit Exceeded" />
              <el-option label="运行时错误" value="Runtime Error" />
              <el-option label="系统错误" value="System Error" />
              <el-option label="已跳过" value="Skipped" />
            </el-select>
            <el-button type="primary" @click="handleFilterChange" :loading="submissionStore.isLoadingHistory">
              筛选
            </el-button>
          </div>
        </div>
      </template>

      <el-table :data="submissionStore.submissionHistory" style="width: 100%" v-loading="submissionStore.isLoadingHistory">
        <el-table-column prop="_id" label="提交ID" width="180" align="center" show-overflow-tooltip />
        <el-table-column label="题目" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">
            <router-link :to="`/problem/${row.problemId}`" class="problem-link" v-if="row.problemId">
              {{ row.problemTitle || `题目 ${row.problemId}` }}
            </router-link>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="180" align="center">
          <template #default="{ row }">
            <el-tag :type="getResultTagType(row.status)" size="small">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="language" label="语言" width="100" align="center" />
        <el-table-column prop="time" label="耗时 (ms)" width="110" align="center">
          <template #default="{ row }">
            {{ row.executionTime !== undefined ? row.executionTime : '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="memory" label="内存 (KB)" width="110" align="center">
          <template #default="{ row }">
            {{ row.memoryUsage !== undefined ? row.memoryUsage : '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="提交时间" width="170" align="center">
          <template #default="{ row }">
            {{ formatDateTime(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="viewSubmissionDetail(row._id)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-if="submissionStore.pagination && submissionStore.pagination.totalItems > 0"
        class="pagination-container"
        background
        layout="total, sizes, prev, pager, next, jumper"
        :total="submissionStore.pagination.totalItems"
        :current-page="submissionStore.pagination.currentPage"
        :page-size="submissionStore.pagination.pageSize"
        :page-sizes="[10, 20, 30, 50, 100]"
        @current-change="handlePageChange"
        @size-change="handleSizeChange"
      />
    </el-card>

    <el-dialog v-model="detailDialogVisible" title="提交详情" width="75%" top="5vh" :destroy-on-close="true" :close-on-click-modal="false">
      <div v-if="submissionStore.isLoadingDetail" class="dialog-loading-placeholder">
        <el-skeleton :rows="10" animated />
      </div>
      <div v-else-if="submissionStore.currentSubmissionDetail" class="submission-detail-content">
        <el-descriptions :column="2" border size="small" class="detail-descriptions">
          <el-descriptions-item label="提交ID" label-class-name="detail-label-bold">{{ submissionStore.currentSubmissionDetail.submissionId }}</el-descriptions-item>
          <el-descriptions-item label="题目" label-class-name="detail-label-bold">
            <router-link :to="`/problem/${submissionStore.currentSubmissionDetail.problemId}`" class="problem-link">
             {{ submissionStore.currentSubmissionDetail.problemTitle || submissionStore.currentSubmissionDetail.problemId }}
            </router-link>
          </el-descriptions-item>
          <el-descriptions-item label="状态" label-class-name="detail-label-bold">
            <el-tag :type="getResultTagType(submissionStore.currentSubmissionDetail.status)">
              {{ submissionStore.currentSubmissionDetail.status }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="语言" label-class-name="detail-label-bold">{{ submissionStore.currentSubmissionDetail.language }}</el-descriptions-item>
          <el-descriptions-item label="耗时" label-class-name="detail-label-bold">{{ submissionStore.currentSubmissionDetail.executionTime !== undefined ? `${submissionStore.currentSubmissionDetail.executionTime} ms` : '-' }}</el-descriptions-item>
          <el-descriptions-item label="内存" label-class-name="detail-label-bold">{{ submissionStore.currentSubmissionDetail.memoryUsage !== undefined ? `${submissionStore.currentSubmissionDetail.memoryUsage} KB` : '-' }}</el-descriptions-item>
          <el-descriptions-item label="提交时间" label-class-name="detail-label-bold">{{ formatDateTime(submissionStore.currentSubmissionDetail.createdAt) }}</el-descriptions-item>
          <el-descriptions-item label="评测时间" label-class-name="detail-label-bold">{{ formatDateTime(submissionStore.currentSubmissionDetail.judgedAt) }}</el-descriptions-item>
        </el-descriptions>

        <div v-if="submissionStore.currentSubmissionDetail.message" class="detail-section">
          <h4>评测信息:</h4>
          <pre class="output-block">{{ submissionStore.currentSubmissionDetail.message }}</pre>
        </div>

        <div v-if="submissionStore.currentSubmissionDetail.code" class="detail-section">
          <h4>提交的代码:</h4>
          <CodeEditor
            :model-value="submissionStore.currentSubmissionDetail.code"
            :language="(submissionStore.currentSubmissionDetail.language?.toLowerCase() || 'plaintext') as ('cpp' | 'java' | 'python')"
            :readOnly="true"
            height="300px"
            editor-style="border: 1px solid #dcdfe6; border-radius: 4px;"
          />
        </div>
        
        <div v-if="submissionStore.currentSubmissionDetail.testCases && submissionStore.currentSubmissionDetail.testCases.length > 0" class="detail-section">
            <h4>测试点详情:</h4>
            <el-table :data="submissionStore.currentSubmissionDetail.testCases" size="small" border style="width: 100%">
                <el-table-column prop="id" label="#" width="50" align="center"/>
                <el-table-column prop="status" label="状态" width="180" align="center">
                    <template #default="{ row }">
                        <el-tag :type="getResultTagType(row.status)" size="small">{{ row.status }}</el-tag>
                    </template>
                </el-table-column>
                <el-table-column prop="time" label="耗时(ms)" width="100" align="center" />
                <el-table-column prop="memory" label="内存(KB)" width="100" align="center"/>
                <el-table-column prop="checkerMessage" label="Checker信息" min-width="150" show-overflow-tooltip>
                  <template #default="{row}">
                    <pre class="output-block-inline" v-if="row.checkerMessage">{{ row.checkerMessage }}</pre>
                    <span v-else>-</span>
                  </template>
                </el-table-column>
            </el-table>
        </div>

      </div>
      <div v-else class="dialog-empty-placeholder">
        <el-empty description="无法加载提交详情或详情为空" />
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="detailDialogVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue';
import { useSubmissionStore } from '@/store/submission';
// 确保导入所有需要的类型，特别是 SubmissionResult (虽然模板中直接用 store.property)
import type { SubmissionStatus, SubmissionResult, TestCaseResult } from '@/types/submission';
import { ElMessage } from 'element-plus';
import CodeEditor from '@/components/common/CodeEditor.vue'; // 导入代码编辑器
// import { useRouter } from 'vue-router'; // 如果需要编程式导航到题目详情以外的页面

// 定义 ElTag 的 type 类型 (与 Element Plus TagProps['type'] 兼容)
type ElTagType = 'success' | 'info' | 'warning' | 'primary' | 'danger';

// const router = useRouter(); // 如果不需要，可以注释掉
const submissionStore = useSubmissionStore();
const detailDialogVisible = ref(false);

// 筛选查询参数
const filterQuery = reactive({
  problemId: '',
  status: '' as SubmissionStatus | '', // 使用 undefined 代表“全部状态”
});

/**
 * 加载提交记录列表
 */
const loadSubmissions = (page: number = 1, pageSize?: number) => {
  // 检查 action 是否存在，防止运行时错误
  if (typeof submissionStore.fetchSubmissionHistory !== 'function') {
    console.warn('fetchSubmissionHistory action is not defined in submission store. Displaying empty list.');
    ElMessage.error('提交记录功能当前不可用。');
    // 确保在 action 不存在时，相关的 loading 状态也被重置
    submissionStore.$patch({
        submissionHistory: [],
        pagination: null, // 或者一个默认的空分页对象
        isLoadingHistory: false
    });
    return;
  }

  submissionStore.fetchSubmissionHistory({
    page,
    limit: pageSize || (submissionStore.pagination ? submissionStore.pagination.pageSize : 10),
    problemId: filterQuery.problemId || undefined,
    status: filterQuery.status|| undefined,
  });
};

/**
 * 当筛选条件改变或点击筛选按钮时调用
 */
const handleFilterChange = () => {
  loadSubmissions(1, submissionStore.pagination ? submissionStore.pagination.pageSize : 10);
};

/**
 * 处理分页组件的页码改变事件
 */
const handlePageChange = (newPage: number) => {
  loadSubmissions(newPage, submissionStore.pagination ? submissionStore.pagination.pageSize : 10);
};

/**
 * 处理分页组件的每页显示数量改变事件
 */
const handleSizeChange = (newSize: number) => {
  loadSubmissions(1, newSize); // 页码大小改变时，回到第一页
};

/**
 * 根据提交状态返回 Element Plus Tag 的类型
 */
const getResultTagType = (status?: SubmissionStatus): ElTagType => {
  if (!status) return 'info';
  switch (status) {
    case 'Accepted': return 'success';
    case 'Wrong Answer':
    case 'Compile Error':
    case 'Runtime Error':
      return 'danger';
    case 'Time Limit Exceeded':
    case 'Memory Limit Exceeded':
    case 'Output Limit Exceeded':
      return 'warning';
    case 'Pending':
    case 'Judging':
      return 'primary';
    case 'Skipped':
    case 'System Error':
      return 'info';
    default:
      // TypeScript 的穷尽性检查: 如果 SubmissionStatus 将来添加了新的值而这里没有处理，编译时会报错
      const exhaustiveCheck: never = status;
      // 在运行时，如果遇到未知的 status (理论上不应该，因为 status 是 SubmissionStatus 类型)
      console.warn(`Unknown submission status encountered: ${exhaustiveCheck}`);
      return 'info';
  }
};

/**
 * 查看单个提交详情
 */
const viewSubmissionDetail = async (submissionId: string) => {
  if (typeof submissionStore.fetchSubmissionById !== 'function') {
      console.warn('fetchSubmissionById action is not defined in submission store.');
      ElMessage.error('无法获取提交详情功能。');
      // 即使无法加载，也打开弹窗显示“无法加载”的状态
      submissionStore.$patch({ isLoadingDetail: false, currentSubmissionDetail: null });
      detailDialogVisible.value = true;
      return;
  }

  // 确保 clearCurrentSubmissionDetail action 存在再调用
  if (typeof submissionStore.clearCurrentSubmissionDetail === 'function') {
    submissionStore.clearCurrentSubmissionDetail();
  } else {
    // 如果 action 不存在，手动重置 currentSubmissionDetail (作为备用方案)
    submissionStore.$patch({ currentSubmissionDetail: null });
  }
  detailDialogVisible.value = true; // 先打开弹窗，让用户看到加载状态
  await submissionStore.fetchSubmissionById(submissionId);

  // 可以在这里检查 submissionStore.error (如果在 store 中设置了的话)
  if (!submissionStore.isLoadingDetail && !submissionStore.currentSubmissionDetail && submissionStore.error) {
      ElMessage.error(`加载详情失败: ${submissionStore.error}`);
  } else if (!submissionStore.isLoadingDetail && !submissionStore.currentSubmissionDetail) {
      // 如果 store 中没有 error 状态，或者 error 没被设置，可以给一个通用提示
      // 但通常 fetchSubmissionById action 内部的 catch 应该会设置 error
      // ElMessage.warning('未找到该提交的详细信息。');
  }
};

/**
 * 格式化日期时间字符串
 */
const formatDateTime = (dateTime?: string | Date): string => {
  if (!dateTime) return '-';
  try {
    const date = new Date(dateTime);
    // 检查日期是否有效
    if (isNaN(date.getTime())) {
        return String(dateTime); // 如果无效，返回原始字符串
    }
    return date.toLocaleString('zh-CN', { // 使用中文环境格式
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: false // 使用24小时制
    }).replace(/\//g, '-'); // 将 / 替换为 -，例如 "2023-01-01 14:05:30"
  } catch (e) {
    console.error("Error formatting date:", dateTime, e);
    return String(dateTime); // 出错时返回原始字符串
  }
};

// 监听弹窗关闭事件，当弹窗关闭时清除 store 中的详情数据
watch(detailDialogVisible, (newValue) => {
    if (!newValue) {
        if (typeof submissionStore.clearCurrentSubmissionDetail === 'function') {
            submissionStore.clearCurrentSubmissionDetail();
        }
    }
});

onMounted(() => {
  // 进入页面时，如果 store 中有清除历史的方法，可以调用它
  if (typeof submissionStore.clearSubmissionHistory === 'function') {
      submissionStore.clearSubmissionHistory();
  }
  loadSubmissions(1); // 加载第一页的提交记录
});
</script>

<style scoped lang="scss">
.submission-list-view {
  padding: 20px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap; // 允许筛选器换行，以适应小屏幕
  gap: 10px; // 筛选器之间的间距
}
.filter-controls {
  display: flex;
  align-items: center;
  gap: 10px; // 筛选控件之间的间距
  flex-wrap: wrap; // 允许在空间不足时换行
}
.problem-link {
  color: #409eff;
  text-decoration: none;
  &:hover {
    text-decoration: underline;
  }
}
.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.detail-section {
  margin-top: 20px;
  h4 {
    margin-bottom: 10px;
    font-size: 1rem; // 16px
    font-weight: 600;
    color: #303133; // 深灰色标题
  }
}

// 统一样式给所有预格式化文本块
.output-block,
.output-block-inline {
  background-color: #f8f9fa; // 更淡的背景色
  padding: 8px 12px;
  border-radius: 4px;
  white-space: pre-wrap;   // 保持换行和空格
  word-break: break-all;   // 长单词或字符串换行
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace; // 等宽字体
  font-size: 0.875em; // 14px
  line-height: 1.6;
  border: 1px solid #e9ecef; // 更淡的边框
  color: #495057; // 文本颜色
}
.output-block { // 用于有固定高度和滚动条的块
  max-height: 200px;
  overflow-y: auto;
}
.output-block-inline { // 用于表格内，高度自适应
  max-height: none;
  overflow-y: visible;
  background-color: transparent; // 表格内可能不需要背景色
  border: none;                  // 表格内可能不需要边框
  padding: 0;                    // 表格内可能不需要内边距
  font-size: 0.8em;              // 表格内字体可以小一点
}


.dialog-loading-placeholder,
.dialog-empty-placeholder {
  min-height: 200px; /* 给骨架屏或空状态一些最小高度 */
  display: flex;
  align-items: center;
  justify-content: center;
  color: #909399;
}

// 使用 :deep() 来修改 Element Plus 组件的内部样式
:deep(.el-dialog__body) {
  padding-top: 10px; // 减少弹窗内容区的上内边距
  padding-bottom: 20px; // 增加下内边距，给滚动条留空间
  .detail-descriptions {
    margin-bottom: 20px; // 与下面的 .detail-section 间距一致
    .el-descriptions__label.detail-label-bold { // 使 descriptions 的 label 加粗
      font-weight: 600;
      color: #606266; // Element Plus 默认 label 颜色
    }
  }
  // 调整弹窗内测试点表格的单元格内边距，使其更紧凑
  .el-table th.el-table__cell,
  .el-table td.el-table__cell {
    padding: 6px 0;
  }
}
</style>