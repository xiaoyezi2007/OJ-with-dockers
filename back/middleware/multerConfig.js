import multer from 'multer';

// 配置 multer 使用内存存储
// 这会将上传的文件作为一个 Buffer 对象保存在 req.files[<fieldname>][0].buffer 中
const storage = multer.memoryStorage();

const upload = multer({ storage: storage });

// 使用 ES 模块的 export default 导出配置好的 multer 实例
export default upload;