import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import connectDB from './config/db.js';
import fileRoutes from './routes/files.js'; // 引入路由

// 加载 .env 文件中的环境变量 (应在最前面)
dotenv.config();

const app = express();

// 连接数据库
connectDB();

// 中间件
app.use(cors());
app.use(express.json());

// 路由
// 你可以将所有API路由放在一个共同的前缀下，例如 /api
// app.use('/api/files', fileRoutes);
// 或者如果你的路由本身就定义了完整的路径 (如 /upload), 则直接使用
app.use('/', fileRoutes); // 这样路由中定义的 /upload 就是根路径下的 /upload

// 确保存储目录存在
const storageDir = path.join(__dirname, 'storage');
const testcasesDir = path.join(storageDir, 'testcases');
const tmpDir = path.join(storageDir, 'tmp');

const fs = require('fs').promises;
fs.mkdir(storageDir, { recursive: true })
  .then(() => fs.mkdir(testcasesDir, { recursive: true }))
  .then(() => fs.mkdir(tmpDir, { recursive: true }))
  .catch(err => console.error('Error creating storage directories:', err));

// 路由
const problemRoutes = require('./routes/problemRoutes');
app.use('/api/problems', problemRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
});