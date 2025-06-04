const multer = require('multer');
const path = require('path');

// 配置multer存储
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../storage/tmp'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  }
});

// 文件过滤器 - 只允许特定扩展名的文件
const fileFilter = (req, file, cb) => {
  const allowedInputTypes = ['.in', '.txt'];
  const allowedOutputTypes = ['.out', '.ans', '.txt'];
  
  const extname = path.extname(file.originalname).toLowerCase();
  
  if (file.fieldname.startsWith('test_input_file_')) {
    if (allowedInputTypes.includes(extname)) {
      return cb(null, true);
    }
  } else if (file.fieldname.startsWith('test_output_file_')) {
    if (allowedOutputTypes.includes(extname)) {
      return cb(null, true);
    }
  }
  
  cb(new Error('Invalid file type'), false);
};

// 文件上传中间件
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB 限制
    files: 20 // 最多20个文件
  }
});

// 动态处理多文件上传
exports.handleProblemFiles = (req, res, next) => {
  // 动态创建multer实例
  const dynamicUpload = upload.fields([]);
  
  // 添加动态字段
  for (let i = 0; i < (req.body.exampleCount || 0); i++) {
    dynamicUpload.fields([
      { name: `test_input_file_${i}`, maxCount: 1 },
      { name: `test_output_file_${i}`, maxCount: 1 }
    ]);
  }
  
  // 执行上传
  dynamicUpload(req, res, (err) => {
    if (err) {
      console.error('File upload error:', err);
      return res.status(400).json({
        success: false,
        message: 'File upload failed',
        error: err.message
      });
    }
    next();
  });
};