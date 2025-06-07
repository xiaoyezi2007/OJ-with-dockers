import mongoose from 'mongoose';

const FileSchema = new mongoose.Schema({
  filename: { type: String, required: true },
  contentType: { type: String, required: true },
  size: { type: Number, required: true },
  filePath: { type: String, required: true },
  type: { 
    type: String, 
    required: true, 
    enum: ['code', 'input', 'output', 'submission']
  },
  problemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Problem' },
  language: { type: String },
  status: { type: String, default: 'Pending' },
  
  // 新增：用于存储评测结果的字段
  executionTime: { type: Number }, // 执行耗时 (ms)
  memoryUsage: { type: Number }, // 内存使用 (KB)
  
  uploadedAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('File', FileSchema);