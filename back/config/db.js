import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config(); // 加载 .env 文件中的环境变量

async function connectDB() {
  try {
    mongoose.set('strictQuery', false);
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ MongoDB 连接成功');
  } catch (err) {
    console.error('❌ MongoDB 连接失败:', err.message);
    process.exit(1);
  }
}

export default connectDB;