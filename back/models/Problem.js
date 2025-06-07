import mongoose from 'mongoose';

const ExampleSchema = new mongoose.Schema({
  input: { type: String, required: true },
  output: { type: String, required: true },
  explanation: { type: String }
});

// 新增：用于存储测试点文件路径的 Schema
const TestCaseSchema = new mongoose.Schema({
  inputFilePath: { type: String, required: true },
  outputFilePath: { type: String, required: true }
});

const ProblemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  difficulty: {
    type: String,
    required: true,
    enum: ['Easy', 'Medium', 'Hard']
  },
  tags: {
    type: [String],
    default: []
  },
  timeLimit: {
    type: Number,
    required: true
  },
  memoryLimit: {
    type: Number,
    required: true
  },
  inputFormat: String,
  outputFormat: String,
  constraints: [String],
  examples: [ExampleSchema],
  // 新增的字段，用于保存测试用例
  testCases: [TestCaseSchema],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Problem', ProblemSchema);