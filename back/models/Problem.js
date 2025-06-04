const mongoose = require('mongoose');

const testCaseSchema = new mongoose.Schema({
  inputPath: String,
  outputPath: String,
  isSample: { 
    type: Boolean, 
    default: false 
  }
});

const problemSchema = new mongoose.Schema({
  problemId: {
    type: String,
    unique: true,
    trim: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    minlength: 5,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    minlength: 20
  },
  difficulty: {
    type: String,
    required: true,
    enum: ['Easy', 'Medium', 'Hard'],
    default: 'Medium'
  },
  tags: {
    type: [String],
    required: true,
    validate: {
      validator: tags => tags.length > 0,
      message: '至少需要一个标签'
    }
  },
  inputFormat: String,
  outputFormat: String,
  timeLimit: {
    type: Number,
    required: true,
    min: 100
  },
  memoryLimit: {
    type: Number,
    required: true,
    min: 16
  },
  examples: [{
    input: String,
    output: String
  }],
  testCases: [testCaseSchema],
  createdAt: {
    type: Date,
    default: Date.now
  }
  // 移除了 createdBy 字段
});

// 自动生成problemId
problemSchema.pre('save', async function(next) {
  if (!this.problemId) {
    const year = new Date().getFullYear();
    const count = await mongoose.model('Problem').countDocuments();
    this.problemId = `PROB-${year}-${(count + 1).toString().padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Problem', problemSchema);