const mongoose = require('mongoose');

const testCaseSchema = new mongoose.Schema({
  inputPath: String,    // 输入文件存储路径
  outputPath: String,   // 输出文件存储路径
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
      message: 'At least one tag is required'
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
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
});

// 自动生成problemId
problemSchema.pre('save', async function(next) {
  if (!this.problemId) {
    // 生成格式为 PROB-YYYY-XXXX 的ID
    const year = new Date().getFullYear();
    const count = await mongoose.model('Problem').countDocuments();
    this.problemId = `PROB-${year}-${(count + 1).toString().padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Problem', problemSchema);