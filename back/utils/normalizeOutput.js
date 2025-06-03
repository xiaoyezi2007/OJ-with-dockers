function normalizeOutput(str) {
  if (typeof str !== 'string') {
    console.warn('normalizeOutput received non-string input:', str);
    return ''; // 或者根据情况抛出错误或返回特定值
  }
  return str
    .replace(/\r\n/g, '\n')  // 统一换行符
    .replace(/\s+$/g, '')    // 去除尾部空白
    .trim();
}

export default normalizeOutput;