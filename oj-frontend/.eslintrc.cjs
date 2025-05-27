module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:vue/vue3-recommended', // 使用 Vue 3 推荐规则
    'plugin:@typescript-eslint/recommended',
    'prettier', // Prettier 规则应放在最后，以覆盖其他规则中的格式化部分
  ],
  parser: 'vue-eslint-parser', // 解析.vue 文件
  parserOptions: {
    parser: '@typescript-eslint/parser', // 解析 <script> 标签中的 TypeScript
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: ['vue', '@typescript-eslint', 'prettier'],
  rules: {
    'prettier/prettier': 'error', // 将 Prettier 问题视为 ESLint 错误
    // 在此添加或覆盖其他规则
  },
};
