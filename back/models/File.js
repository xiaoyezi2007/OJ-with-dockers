import mongoose from 'mongoose';

// 定义测试用例的 Schema
const TestCaseSchema = new mongoose.Schema({
  input: {
    type: String,
    required: true
  },
  output: {
    type: String,
    // 在本阶段，输出可以为空字符串，之后再生成
    required: true
  }
});

// 定义题目的 Schema
const FileSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required.']
  },
  description: {
    type: String,
    required: [true, 'Description is required.']
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    required: [true, 'Difficulty is required.']
  },
  tags: {
    type: [String],
    required: true
  },
  timeLimit: {
    type: Number,
    required: [true, 'Time limit is required.']
  },
  memoryLimit: {
    type: Number,
    required: [true, 'Memory limit is required.']
  },
  testCases: [TestCaseSchema]
});

const File = mongoose.model('File', FileSchema);

export default File;