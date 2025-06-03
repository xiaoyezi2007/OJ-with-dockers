<template>
  <div class="problem-upload-page">
    <el-card header="上传新题目">
      <el-form :model="problemForm" :rules="rules" ref="problemFormRef" label-width="120px" label-position="top">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="题目ID" prop="id">
              <el-input v-model="problemForm.id" placeholder="可选，若留空则后端自动生成"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="题目名称" prop="title">
              <el-input v-model="problemForm.title" placeholder="请输入题目名称"></el-input>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="难度" prop="difficulty">
              <el-select v-model="problemForm.difficulty" placeholder="请选择难度" style="width: 100%;">
                <el-option label="简单 (Easy)" value="Easy"></el-option>
                <el-option label="中等 (Medium)" value="Medium"></el-option>
                <el-option label="困难 (Hard)" value="Hard"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="标签" prop="tags">
              <el-select
                v-model="problemForm.tags"
                multiple
                filterable
                allow-create
                default-first-option
                placeholder="请输入或选择标签 (回车创建)"
                style="width: 100%;"
              >
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="题目描述" prop="description">
          <el-input type="textarea" :autosize="{ minRows: 5, maxRows: 15 }" v-model="problemForm.description" placeholder="支持 Markdown 格式"></el-input>
        </el-form-item>
        <el-form-item label="输入格式描述" prop="inputFormat">
          <el-input type="textarea" :autosize="{ minRows: 3, maxRows: 10 }" v-model="problemForm.inputFormat" placeholder="描述输入数据的格式，支持 Markdown"></el-input>
        </el-form-item>
        <el-form-item label="输出格式描述" prop="outputFormat">
          <el-input type="textarea" :autosize="{ minRows: 3, maxRows: 10 }" v-model="problemForm.outputFormat" placeholder="描述输出数据的格式，支持 Markdown"></el-input>
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="时间限制 (MS)" prop="timeLimit">
              <el-input-number v-model="problemForm.timeLimit" :min="100" :step="100" controls-position="right" style="width: 100%;"></el-input-number>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="内存限制 (MB)" prop="memoryLimit">
              <el-input-number v-model="problemForm.memoryLimit" :min="16" :step="16" controls-position="right" style="width: 100%;"></el-input-number>
            </el-form-item>
          </el-col>
        </el-row>
        <el-divider content-position="left">题目样例</el-divider>
        <div v-for="(example, index) in problemForm.examples" :key="`example-${index}`" class="dynamic-item-container">
          <h4>样例 {{ index + 1 }}</h4>
          <el-form-item
            :label="'样例输入 ' + (index + 1)"
            :prop="'examples.' + index + '.input'"
            :rules="{required: true, message: '样例输入不能为空', trigger: 'blur'}"
          >
            <el-input type="textarea" :autosize="{ minRows: 3, maxRows: 8 }" v-model="example.input" placeholder="样例输入内容"></el-input>
          </el-form-item>
          <el-form-item
            :label="'样例输出 ' + (index + 1)"
            :prop="'examples.' + index + '.output'"
            :rules="{required: true, message: '样例输出不能为空', trigger: 'blur'}"
          >
            <el-input type="textarea" :autosize="{ minRows: 3, maxRows: 8 }" v-model="example.output" placeholder="样例输出内容"></el-input>
          </el-form-item>
          <el-button type="danger" @click="removeExample(index)" size="small" :icon="DeleteIcon">删除此样例</el-button>
          <el-divider v-if="index < problemForm.examples.length - 1" class="item-divider"></el-divider>
        </div>
        <el-button type="primary" @click="addExample" plain :icon="PlusIcon">添加样例</el-button>

        <el-divider content-position="left" style="margin-top: 30px;">测试点</el-divider>
        <div v-for="(testCase, index) in testCases" :key="`testcase-${index}`" class="dynamic-item-container">
          <h4>测试点 {{ index + 1 }}</h4>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item :label="'输入文件 (.in/.txt)'" required>
                <input type="file" @change="handleTestCaseFileChange($event, index, 'input')" :ref="el => testCaseInputRefs[index] = el" accept=".in,.txt" class="file-input">
                <div v-if="testCase.inputFile" class="file-selected-info">
                  已选择: {{ testCase.inputFile.name }} ({{ formatFileSize(testCase.inputFile.size) }})
                </div>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item :label="'输出文件 (.out/.ans/.txt)'" required>
                <input type="file" @change="handleTestCaseFileChange($event, index, 'output')" :ref="el => testCaseOutputRefs[index] = el" accept=".out,.ans,.txt" class="file-input">
                <div v-if="testCase.outputFile" class="file-selected-info">
                  已选择: {{ testCase.outputFile.name }} ({{ formatFileSize(testCase.outputFile.size) }})
                </div>
              </el-form-item>
            </el-col>
          </el-row>
          <el-button type="danger" @click="removeTestCase(index)" size="small" :icon="DeleteIcon">删除此测试点</el-button>
          <el-divider v-if="index < testCases.length - 1" class="item-divider"></el-divider>
        </div>
        <el-button type="primary" @click="addTestCase" plain :icon="PlusIcon" style="margin-top:10px;">添加测试点</el-button>

        <el-form-item style="margin-top: 30px;">
          <el-button type="success" @click="submitProblem" :loading="isSubmitting" size="large" :icon="UploadIcon">
            {{ isSubmitting ? '提交中...' : '确认并提交题目' }}
          </el-button>
          <el-button @click="resetForm" size="large" :icon="RefreshLeftIcon" plain style="margin-left: 10px;">
            重置表单
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, nextTick } from 'vue';
import type { FormInstance, FormRules } from 'element-plus';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  Delete as DeleteIcon,
  Plus as PlusIcon,
  RefreshLeft as RefreshLeftIcon, // 用于重置按钮
  Upload as UploadIcon             // 用于提交按钮
} from '@element-plus/icons-vue';

// --- 接口定义 ---
interface ProblemExample {
  input: string;
  output: string;
}

interface TestCaseFileHolder {
  inputFile: File | null;
  outputFile: File | null;
}

// --- 响应式状态 ---
const problemFormRef = ref<FormInstance>();
const initialProblemFormData = () => ({
  id: '',
  title: '',
  difficulty: 'Easy',
  tags: [] as string[],
  description: '',
  inputFormat: '',
  outputFormat: '',
  timeLimit: 1000,
  memoryLimit: 128,
  examples: [{ input: '', output: '' }] as ProblemExample[],
});
const problemForm = reactive(initialProblemFormData());

const initialTestCasesData = () => ([{ inputFile: null, outputFile: null }] as TestCaseFileHolder[]);
const testCases = reactive<TestCaseFileHolder[]>(initialTestCasesData());

const testCaseInputRefs = ref<(HTMLInputElement | null)[]>([]);
const testCaseOutputRefs = ref<(HTMLInputElement | null)[]>([]);

const isSubmitting = ref(false);

// --- 表单校验规则 ---
const rules = reactive<FormRules>({
  title: [{ required: true, message: '请输入题目名称', trigger: 'blur' }],
  difficulty: [{ required: true, message: '请选择难度', trigger: 'change' }],
  tags: [{ type: 'array', required: true, message: '请至少选择或创建一个标签', trigger: 'change' }],
  description: [{ required: true, message: '请输入题目描述', trigger: 'blur' }],
  inputFormat: [{ required: true, message: '请输入输入格式描述', trigger: 'blur' }],
  outputFormat: [{ required: true, message: '请输入输出格式描述', trigger: 'blur' }],
  timeLimit: [{ type: 'number', required: true, message: '请输入时间限制', trigger: 'blur' }],
  memoryLimit: [{ type: 'number', required: true, message: '请输入内存限制', trigger: 'blur' }],
  examples: [{
    type: 'array',
    required: true,
    validator: (rule, value, callback) => {
      if (!value || value.length === 0) {
        callback(new Error('请至少添加一个样例'));
      } else if (value.some((ex: ProblemExample) => !ex.input.trim() || !ex.output.trim())) {
        callback(new Error('样例的输入和输出均不能为空'));
      } else {
        callback();
      }
    },
    trigger: 'blur'
  }]
});

// --- 样例管理方法 ---
const addExample = () => {
  problemForm.examples.push({ input: '', output: '' });
};
const removeExample = (index: number) => {
  if (problemForm.examples.length > 1) {
    problemForm.examples.splice(index, 1);
  } else {
    ElMessage.warning('至少需要一个样例');
  }
};

// --- 测试点管理方法 ---
const addTestCase = () => {
  testCases.push({ inputFile: null, outputFile: null });
  nextTick(() => {
    testCaseInputRefs.value.push(null);
    testCaseOutputRefs.value.push(null);
  });
};
const removeTestCase = (index: number) => {
  if (testCases.length > 1) {
    testCases.splice(index, 1);
    testCaseInputRefs.value.splice(index, 1);
    testCaseOutputRefs.value.splice(index, 1);
  } else {
    ElMessage.warning('至少需要一个测试点');
  }
};
const handleTestCaseFileChange = (event: Event, index: number, type: 'input' | 'output') => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    const file = target.files[0];
    if (type === 'input') {
      testCases[index].inputFile = file;
    } else {
      testCases[index].outputFile = file;
    }
  } else {
    if (type === 'input') {
      testCases[index].inputFile = null;
    } else {
      testCases[index].outputFile = null;
    }
  }
};

// --- 工具函数 ---
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// --- 表单提交与重置 ---
const submitProblem = async () => {
  if (!problemFormRef.value) return;
  await problemFormRef.value.validate(async (validForm) => {
    if (validForm) {
      for (let i = 0; i < testCases.length; i++) {
        if (!testCases[i].inputFile || !testCases[i].outputFile) {
          ElMessage.error(`测试点 ${i + 1} 的输入或输出文件未选择完整`);
          return;
        }
      }
      if (problemForm.examples.length === 0) {
        ElMessage.error('请至少提供一个样例');
        return;
      }
       if (testCases.length === 0) {
        ElMessage.error('请至少提供一个测试点');
        return;
      }

      isSubmitting.value = true;
      const formData = new FormData();
      formData.append('problemData', JSON.stringify({ ...problemForm }));
      testCases.forEach((tc, index) => {
        if (tc.inputFile) formData.append(`test_input_file_${index}`, tc.inputFile, tc.inputFile.name);
        if (tc.outputFile) formData.append(`test_output_file_${index}`, tc.outputFile, tc.outputFile.name);
      });

      console.log('FormData to be submitted (for backend):');
      for (let [key, value] of formData.entries()) { console.log(key, value); }

      try {
        await new Promise(resolve => setTimeout(resolve, 1500)); // 模拟API
        isSubmitting.value = false;
        ElMessageBox.confirm(
          `题目 "${problemForm.title}" 已成功提交！是否需要清空表单以便添加下一题？`,
          '提交成功',
          {
            confirmButtonText: '清空表单',
            cancelButtonText: '保留内容',
            type: 'success',
          }
        ).then(() => {
          resetForm(true);
        }).catch(() => {
          ElMessage.info('表单内容已保留。');
        });
      } catch (error: any) {
        isSubmitting.value = false;
        console.error('提交题目失败:', error);
        const errorMessage = error.response?.data?.message || error.message || '题目提交失败，发生未知错误。';
        ElMessageBox.alert( `错误详情: ${errorMessage}`, '提交失败', { confirmButtonText: '我知道了', type: 'error' });
      }
    } else {
      ElMessage.error('表单校验失败，请检查所有必填项和格式');
      return false;
    }
  });
};

const resetForm = (calledAfterSuccess: boolean = false) => {
  const doReset = () => {
    if (problemFormRef.value) {
      problemFormRef.value.resetFields();
    }
    Object.assign(problemForm, initialProblemFormData());
    testCases.splice(0, testCases.length, ...initialTestCasesData());
    testCaseInputRefs.value.forEach(inputRef => { if (inputRef) inputRef.value = ''; });
    testCaseOutputRefs.value.forEach(outputRef => { if (outputRef) outputRef.value = ''; });
    ElMessage.success('表单已重置');
  };

  if (calledAfterSuccess) {
    doReset();
  } else {
     ElMessageBox.confirm(
    // 使用 HTML 来增强消息的可读性和视觉效果
    '<div style="line-height: 1.6;">' +
    '<p style="font-size: 16px; font-weight: bold; color: #303133; margin-bottom: 10px;">您确定要重置当前表单吗？</p>' +
    '<p style="font-size: 14px; color: #606266;">此操作将会清除所有您已输入的内容，<strong style="color: #F56C6C;">且无法恢复</strong>。</p>' +
    '<p style="font-size: 14px; color: #606266; margin-top: 8px;">请仔细确认。</p>' +
    '</div>',
    '操作确认', // 更中性或具体的标题
    {
      confirmButtonText: '是的，重置表单', // 更明确的按钮文字
      cancelButtonText: '不，再想想',
      type: 'warning', // 保持警告类型，以显示警告相关的颜色和默认图标
      dangerouslyUseHTMLString: true, // 必须设置为 true才能解析 HTML
      // 如果你想替换默认的警告图标，可以取消下面的注释并使用 icon 属性
      // icon: DeleteFilled, // 示例：使用不同的Element Plus图标
      // 如果使用自定义组件作为图标，可以这样：
      // import MyCustomIconComponent from './MyCustomIcon.vue';
      // icon: markRaw(MyCustomIconComponent), // 需要用 markRaw 包裹
      customClass: 'my-reset-confirm-dialog', // 可以添加自定义类名，方便CSS覆盖（如果需要）
      center: true, // 可以让文本内容也居中（如果标题和按钮已经是居中的话）
    }
  ).then(() => {
    doReset(); // 用户确认后执行重置
  }).catch(() => {
    ElMessage.info('重置操作已取消'); // 用户取消
  });
  }
};
</script>

<style scoped lang="scss">
.problem-upload-page {
  padding: 20px;
  max-width: 1000px;
  margin: 20px auto;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1);
}

.el-card {
  border: none;
}

.dynamic-item-container {
  border: 1px solid #ebeef5;
  padding: 20px;
  margin-bottom: 20px;
  border-radius: 6px;
  background-color: #fcfcfc;
  position: relative;

  h4 {
    margin-top: 0;
    margin-bottom: 18px;
    font-size: 1.1em;
    color: #303133;
  }

  .el-button[type="danger"] {
    position: absolute;
    top: 15px;
    right: 15px;
  }
}

.item-divider {
  margin-top: 25px !important;
}

.file-input {
  display: block;
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  box-sizing: border-box;
  cursor: pointer;
  transition: border-color 0.2s;

  &:hover {
    border-color: #c0c4cc;
  }
}

.file-selected-info {
  margin-top: 8px;
  font-size: 0.9em;
  color: #5cb85c;
  word-break: break-all;
}

.el-form-item {
  margin-bottom: 22px;
}

.el-divider--horizontal {
    margin: 25px 0;
}

// 确保按钮之间有间距，即使在 flex 布局中
.el-form-item > .el-button + .el-button {
  margin-left: 10px;
}


@media (max-width: 768px) {
  .el-row > .el-col {
    margin-bottom: 0;
    &:not(:last-child) .el-form-item{
        margin-bottom: 22px;
    }
  }
   .dynamic-item-container .el-button[type="danger"] {
    position: static;
    margin-top: 10px;
    display: block;
    width: 100%;
  }
}
</style>