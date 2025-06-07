import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import connectDB from './config/db.js';
import fileRoutes from './routes/files.js'; // 引入路由
import problemRoutes from './routes/problems.js'; // <-- 1. 在这里导入新路由

// 加载 .env 文件中的环境变量 (应在最前面)
dotenv.config();

const app = express();

// 连接数据库
connectDB();

// 中间件
app.use(cors());
app.use(express.json());

// 路由
app.use('/api/files', fileRoutes);
app.use('/api/problems', problemRoutes); // <-- 2. 在这里注册新路由，使用 /api/problems 前缀

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
});