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

          <h3>输入格式 </h3>

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
            <el-form-item label="从文件加载代码">
              <input type="file" @change="handleFileUpload" accept=".cpp,.java,.py,.txt" style="margin-bottom: 10px;" />
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
            <p v-if="submissionStore.currentSubmissionResult.executionTime !== undefined">耗时: {{ submissionStore.currentSubmissionResult.executionTime }} ms</p>
            <p v-if="submissionStore.currentSubmissionResult.memoryUsage !== undefined">内存: {{ submissionStore.currentSubmissionResult.memoryUsage }} KB</p>
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
import { onMounted, ref } from 'vue';
import { marked } from 'marked';
import { ElMessage } from 'element-plus';

import CodeEditor from '@/components/common/CodeEditor.vue';
import { useSubmissionStore } from '@/store/submission';
import type { SubmissionStatus } from '@/types/submission';

const route = useRoute();
const problemStore = useProblemStore();
const submissionStore = useSubmissionStore();

const problemId = ref(route.params.id as string);

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


const handleFileUpload = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    const file = target.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target && typeof e.target.result === 'string') {
        userCode.value = e.target.result; // Set the file content to userCode
        ElMessage.success('文件内容已成功加载到编辑器！');
      } else {
        ElMessage.error('读取文件内容失败。');
      }
    };
    reader.onerror = () => {
      ElMessage.error('读取文件时发生错误。');
    };
    reader.readAsText(file); // Read file as plain text
  }
  // Reset file input to allow uploading the same file again if needed
  target.value = ''; 
};
// END ADDED

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
    problemId: problemStore.currentProblem._id,
    code: userCode.value,
    language: selectedLanguage.value,
  });
};

const getResultTagType = (status: SubmissionStatus) => {
  if (status === 'Accepted') return 'success';
  if (status === 'Wrong Answer' || status === 'Compile Error') return 'danger';
  if (status === 'Time Limit Exceeded' || status === 'Memory Limit Exceeded' || status === 'Runtime Error') return 'warning';
  if (status === 'Pending' || status === 'Judging') return 'primary';
  return 'info';
};

onMounted(() => {
  problemStore.clearCurrentProblem();
  submissionStore.clearCurrentSubmissionResult();
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
  height: calc(100vh - 120px); 
  overflow-y: auto;
  width: 100%; 
}

@media (max-width: 991px) {
  .problem-description-card,
  .code-submission-card {
    height: auto; 
    overflow-y: visible; 
  }
}

.code-submission-card {
  :deep(.el-form),
  :deep(.el-form-item) {
    width: 100%;
  }
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

.el-select {
  width: 100%;
}
</style>