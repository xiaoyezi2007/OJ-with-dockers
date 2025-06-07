import multer from 'multer';
import path from 'path';
import fs from 'fs';

// 1. 配置存储引擎 (diskStorage)，告诉 multer 将文件保存到磁盘
const storage = multer.diskStorage({
  // 2. 设置文件存储的目标目录
  destination: function (req, file, cb) {
    // 我们将所有测试用例文件都存储在 back/uploads/testcases/ 目录下
    // process.cwd() 会获取项目根目录，确保路径正确
    const dir = path.join(process.cwd(), 'back', 'uploads', 'testcases');

    // 确保这个目录存在，如果不存在则自动创建
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // 将文件放入这个目录
    cb(null, dir);
  },
  
  // 3. 设置保存的文件名
  filename: function (req, file, cb) {
    // 为了避免文件名冲突，我们在原始文件名前加上时间戳和随机数
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

// 4. 创建并导出配置好的 multer 实例
const upload = multer({ storage: storage });

export default upload;