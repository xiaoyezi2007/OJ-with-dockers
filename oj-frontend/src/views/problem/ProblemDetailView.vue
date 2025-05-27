<template>
  <div class="problem-detail-view" v-if="problemStore.currentProblem && !problemStore.isLoading">
    <el-row :gutter="20">
      <el-col :xs="24" :sm="24" :md="12">
        <el-card class="problem-description-card">
          <template #header>
            <h2>{{ problemStore.currentProblem.title }} (ID: {{ problemId }})</h2>
          </template>
          <el-descriptions :column="1" border>
            <el-descriptions-item label="时间限制">{{ problemStore.currentProblem.timeLimit }} MS</el-descriptions-item>
            <el-descriptions-item label="内存限制">{{ problemStore.currentProblem.memoryLimit }} MB</el-descriptions-item>
          </el-descriptions>

          <h3>题目描述</h3>
          <div v-html="compiledMarkdown(problemStore.currentProblem.description)"></div>

          <h3>输入格式</h3>
          <div v-html="compiledMarkdown(problemStore.currentProblem.inputFormat)"></div>

          <h3>输出格式</h3>
          <div v-html="compiledMarkdown(problemStore.currentProblem.outputFormat)"></div>

          <div v-if="problemStore.currentProblem.examples && problemStore.currentProblem.examples.length > 0">
            <div v-for="(example, index) in problemStore.currentProblem.examples" :key="index" class="sample-case">
              <h4>样例 {{ index + 1 }}</h4>
              <h5>输入：</h5>
              <pre class="sample-code">{{ example.input }}</pre>
              <h5>输出：</h5>
              <pre class="sample-code">{{ example.output }}</pre>
              <div v-if="example.explanation">
                <h5>解释：</h5>
                <div v-html="compiledMarkdown(example.explanation)"></div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="24" :md="12">
        <el-card class="code-submission-card">
          <template #header>
            <span>代码提交</span>
          </template>
          <el-form label-position="top">
            <el-form-item label="选择语言">
              <el-select v-model="selectedLanguage" placeholder="请选择语言" style="width: 100%;">
                <el-option label="C++" value="cpp" />
                <el-option label="Java" value="java" />
                <el-option label="Python" value="python" />
              </el-select>
            </el-form-item>
            <el-form-item label="代码编辑器">
              <CodeEditor
                v-model="userCode"
                :language="selectedLanguage"
                :theme="editorTheme"
                style="width: 100%;"
              />
            </el-form-item>
            <el-form-item>
              <el-button
                type="primary"
                @click="handleSubmitCode"
                :loading="submissionStore.isSubmitting"
              >

                提交代码
              </el-button>
            </el-form-item>
          </el-form>
          <div v-if="submissionStore.currentSubmissionResult" class="submission-result">
            <h4>提交结果:</h4>
            <p>状态: <el-tag :type="getResultTagType(submissionStore.currentSubmissionResult.status)">{{ submissionStore.currentSubmissionResult.status }}</el-tag></p>
            <p v-if="submissionStore.currentSubmissionResult.message">信息: {{ submissionStore.currentSubmissionResult.message }}</p>
            <p v-if="submissionStore.currentSubmissionResult.time !== undefined">耗时: {{ submissionStore.currentSubmissionResult.time }} ms</p>
            <p v-if="submissionStore.currentSubmissionResult.memory !== undefined">内存: {{ submissionStore.currentSubmissionResult.memory }} KB</p>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
  <el-skeleton :rows="10" animated v-else />
</template>

<script setup lang="ts">
import { useProblemStore } from '@/store/problem';
import { useRoute } from 'vue-router';
import { onMounted, ref } from 'vue'; // `computed` 如果没有用到可以暂时移除
import { marked } from 'marked';
import { ElMessage } from 'element-plus'; // 导入 ElMessage

// 新增导入
import CodeEditor from '@/components/common/CodeEditor.vue';
import { useSubmissionStore } from '@/store/submission'; // 假设你创建了这个 store
import type { SubmissionStatus } from '@/types/submission'; // 假设你创建了这个类型

const route = useRoute();
const problemStore = useProblemStore();
const submissionStore = useSubmissionStore(); // 初始化 submission store

const problemId = ref(route.params.id as string);

// 代码编辑器和提交相关状态
const userCode = ref('');
const selectedLanguage = ref<'cpp' | 'java' | 'python'>('cpp');
const editorTheme = ref<'light' | 'dark'>('light');

const compiledMarkdown = (markdownText?: string) => {
  if (!markdownText) return '';
  try {
    return marked(markdownText);
  } catch (e) {
    console.error("Error compiling markdown:", e);
    return markdownText;
  }
};

const toggleTheme = () => {
  editorTheme.value = editorTheme.value === 'light' ? 'dark' : 'light';
};

const handleSubmitCode = async () => {
  if (!userCode.value.trim()) {
    ElMessage.warning('代码不能为空');
    return;
  }
  if (!problemStore.currentProblem) {
    ElMessage.error('题目信息加载失败，无法提交');
    return;
  }
  await submissionStore.submitCode({
    problemId: problemStore.currentProblem.id, // 使用加载到的题目ID
    code: userCode.value,
    language: selectedLanguage.value,
  });
  // 提交后可以根据需要清空编辑器，或者 submissionStore 内部处理结果显示逻辑
};

const getResultTagType = (status: SubmissionStatus) => {
  // 确保使用逻辑或 ||
  if (status === 'Accepted') return 'success';
  if (status === 'Wrong Answer' || status === 'Compile Error') return 'danger';
  if (status === 'Time Limit Exceeded' || status === 'Memory Limit Exceeded' || status === 'Runtime Error') return 'warning'; // 增加了 Runtime Error
  if (status === 'Pending' || status === 'Judging') return 'primary';
  return 'info'; // 其他未知状态
};

onMounted(() => {
  // 清除可能存在的上一个题目详情和提交结果
  problemStore.clearCurrentProblem(); // 假设你在 problemStore 中有这个 action
  submissionStore.clearCurrentSubmissionResult(); // 假设你在 submissionStore 中有这个 action
  
  problemStore.fetchProblemById(problemId.value);
});
</script>

<style scoped lang="scss">
.problem-detail-view {
  padding: 20px;
}

.problem-description-card,
.code-submission-card {
  margin-bottom: 20px;
  // 对于大屏幕，可以保留或调整这个高度
  // 在小屏幕下，我们会通过媒体查询覆盖它
  height: calc(100vh - 120px); // 比如减去导航栏和一些padding的高度
  overflow-y: auto;
  width: 100%; // 默认让卡片尝试填充其 <el-col> 父容器
}

// 针对小屏幕的特定样式调整 (Element Plus 的 md 断点通常是 992px)
// 当屏幕宽度小于 992px 时，我们认为是小屏幕，应用上下布局的样式
@media (max-width: 991px) {
  .problem-description-card,
  .code-submission-card {
    height: auto; // 在小屏幕上下布局时，让卡片高度自适应内容
    overflow-y: visible; // 内容超出时，让整个页面滚动，而不是卡片内部滚动
    // width: 100%; // <el-col :xs="24"> 应该已经处理了列宽，这里可以不写或作为强调
  }
}

// 确保代码提交卡片内部的表单和表单项能正确填充宽度
.code-submission-card {
  // 使用 :deep() 穿透到 Element Plus 组件的内部类，如果需要的话
  // 但通常 el-form 和 el-form-item 会自动适应宽度
  // 如果它们没有，可以尝试下面的样式
  :deep(.el-form),
  :deep(.el-form-item) {
    width: 100%;
  }

  // 确保 CodeEditor 组件实例也占据100%宽度
  // 你在模板中已经给 CodeEditor 设置了 style="width: 100%;" 这是好的
  // 如果 CodeEditor 组件的根元素是 .code-editor-wrapper，并且它没有占满
  // :deep(.code-editor-wrapper) {
  //   width: 100% !important; // 可以尝试用 !important 提高优先级，但要谨慎
  // }
}


.sample-case {
  margin-top: 20px;
  padding: 10px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  background-color: #fafafa;
}
.sample-case h4 {
  margin-top: 0;
  margin-bottom: 15px;
  font-size: 1.1em;
}
.sample-case h5 {
  margin-top: 10px;
  margin-bottom: 5px;
  font-weight: bold;
}
.sample-code {
  background-color: #f5f5f5;
  padding: 10px;
  border: 1px solid #eee;
  border-radius: 4px;
  white-space: pre-wrap;
  word-break: break-all;
}
h3 {
  margin-top: 20px;
  margin-bottom: 10px;
}

.submission-result {
  margin-top: 20px;
  padding: 15px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background-color: #f9f9f9;

  h4 {
    margin-top: 0;
    margin-bottom: 10px;
  }
  p {
    margin: 5px 0;
    font-size: 14px;
    .el-tag {
      margin-left: 8px;
    }
  }
}

.el-select { // 这个样式确保了下拉选择框撑满宽度
  width: 100%;
}
</style>