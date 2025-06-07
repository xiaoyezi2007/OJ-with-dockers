import mongoose from 'mongoose';

const FileSchema = new mongoose.Schema({
  // 保留的原有字段
  filename: { type: String, required: true },
  contentType: { type: String, required: true },
  size: { type: Number, required: true },
  
  // 修正和新增的字段
  type: { 
    type: String, 
    required: true, 
    enum: ['code', 'input', 'output', 'submission'] // 增加 'submission' 类型
  },
  
  // 新增：用于存储提交记录的元数据
  problemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Problem' }, // 关联到 Problem 模型
  language: { type: String },
  status: { 
    type: String, 
    default: 'Pending' // 默认状态为等待评测
  },
  
  // 新增：存储代码文件的物理路径，而不是文件内容本身
  filePath: { type: String, required: true },

  // 保留的关联字段
  reference: { type: mongoose.Schema.Types.ObjectId, ref: 'File' },
  inputFile: { type: mongoose.Schema.Types.ObjectId, ref: 'File' },

  // 新增：上传时间
  uploadedAt: {
    type: Date,
    default: Date.now
  }
  
  // 我们不再需要 `data` 字段，因为它会被 `filePath` 替代
  // data: Buffer 
});

export default mongoose.model('File', FileSchema);