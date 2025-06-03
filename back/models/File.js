import mongoose from 'mongoose';

const FileSchema = new mongoose.Schema({
  filename: String,
  contentType: String,
  size: Number,
  type: {
    type: String,
    enum: ['code', 'output', 'input']
  },
  reference: { type: mongoose.Schema.Types.ObjectId, ref: 'File' },
  inputFile: { type: mongoose.Schema.Types.ObjectId, ref: 'File' },
  data: Buffer,
  createdAt: { type: Date, default: Date.now }
});

const File = mongoose.model('File', FileSchema);

export default File;