<template>
  <div class="code-editor-wrapper" ref="editorWrapperRef">
    <codemirror
      v-if="isMounted"      
      v-model="codeValue"
      placeholder="请在此输入代码..."
      :style="editorStyle" 
      :autofocus="true"
      :indent-with-tab="true"
      :tab-size="tabSize"
      :extensions="extensions"
      @update:modelValue="handleChange"
      @ready="handleEditorReady" 
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue'; // 增加了 onMounted, nextTick
import { Codemirror } from 'vue-codemirror';
import { cpp } from '@codemirror/lang-cpp';
import { java } from '@codemirror/lang-java';
import { python } from '@codemirror/lang-python';
import { oneDark } from '@codemirror/theme-one-dark';
import { EditorView } from '@codemirror/view';
import type { Extension } from '@codemirror/state';
import type { ViewUpdate } from '@codemirror/view'; // 导入 ViewUpdate 类型

interface Props {
  modelValue: string;
  language?: 'cpp' | 'java' | 'python';
  tabSize?: number;
  height?: string;
}

const props = withDefaults(defineProps<Props>(), {
  language: 'cpp',
  tabSize: 4,
  height: '400px',
});

const editorStyle = computed(() => ({
  height: props.height,
  width: '100%', // 明确 Codemirror 组件容器宽度为 100%
}));

const emit = defineEmits(['update:modelValue', 'ready']); // 添加了 ready 事件

const codeValue = ref(props.modelValue);
const editorWrapperRef = ref<HTMLElement | null>(null); // 用于获取 DOM 元素
const isMounted = ref(false); // 控制 Codemirror 渲染
const view = shallowRef<EditorView>(); // 存储 EditorView 实例

onMounted(() => {
  // 确保在 DOM 挂载并且父容器尺寸稳定后再渲染 CodeMirror
  // 这有助于 CodeMirror 在初始化时获取正确的尺寸
  nextTick(() => {
    isMounted.value = true;
  });
});

watch(() => props.modelValue, (newValue) => {
  if (newValue !== codeValue.value) {
    codeValue.value = newValue;
  }
});

// handleChange 现在可以接收 ViewUpdate 参数，如果需要的话
const handleChange = (value: string, viewUpdate: ViewUpdate) => {
  emit('update:modelValue', value);
  // 你可以在这里访问 viewUpdate 对象获取更多更新信息
};

const handleEditorReady = (payload: { view: EditorView, state: any, container: HTMLElement }) => {
  view.value = payload.view;
  emit('ready', payload); // 将 ready 事件和 payload 向上冒泡
  // console.log('CodeMirror editor is ready:', payload.view);
  // 有时，如果编辑器在父容器尺寸变化后没有自动调整，可以在这里手动 dispatch viewUpdate
  // payload.view.dispatch({ effects: EditorView.requestMeasure.of({}) });
};


const languageExtensions = {
  cpp: cpp(),
  java: java(),
  python: python(),
};

const extensions = computed(() => {
  const langExt = languageExtensions[props.language] || cpp();
  const activeExtensions: Extension[] = [];

  // 确保 langExt 和 oneDark 被正确处理（单个 Extension 或数组）
  const addExtension = (ext: Extension | Extension[]) => {
    if (Array.isArray(ext)) {
      activeExtensions.push(...ext);
    } else if (ext) {
      activeExtensions.push(ext);
    }
  };

  addExtension(langExt);
  addExtension(oneDark); // 固定使用 oneDark 主题
  
  activeExtensions.push(EditorView.lineWrapping);
  // 可以考虑加入行号显示等其他常用扩展
  // import { lineNumbers } from '@codemirror/view';
  // activeExtensions.push(lineNumbers());

  return activeExtensions;
});
</script>

<style scoped lang="scss">
.code-editor-wrapper {
  width: 100%;
  // overflow: hidden; // 有时可以防止 CodeMirror 内部某些元素意外溢出导致布局问题
}

// 确保 CodeMirror 内部的 .cm-editor 也能正确适应宽度
// :deep() 用于穿透 scoped CSS 影响子组件的内部元素
:deep(.cm-editor) {
  width: 100% !important; // 强制 CodeMirror 编辑器宽度，如果还是有问题可以尝试
  height: 100%; // 让编辑器高度填满其容器（容器高度由 :style 控制）
}
</style>