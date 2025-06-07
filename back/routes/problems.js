import express from 'express';
import Problem from '../models/Problem.js'; // 引入新的 Problem 模型
import upload from '../middleware/multerConfig.js'; // 导入我们配置好的 multer

const router = express.Router();

// 路由: POST /api/problems
router.post('/', upload.any(), async (req, res) => {
  try {
    // ==================== 请在这里添加调试日志 ====================
    console.log('--- [DEBUG] Received Create Problem Request ---');
    console.log('--- [DEBUG] Request Body (req.body):', JSON.stringify(req.body, null, 2));
    console.log('--- [DEBUG] Uploaded Files (req.files):', req.files);
    console.log('-------------------------------------------------');
    // ==========================================================

    // 1. 从文本字段中解析出题目的 JSON 数据
    const problemData = JSON.parse(req.body.problemData);

    // 2. 将上传的文件数组转换为 Map，以便通过字段名快速查找
    const files = req.files;
    if (!Array.isArray(files)) {
      throw new Error('No files were uploaded.');
    }
    
    const fileMap = new Map();
    for (const file of files) {
      fileMap.set(file.fieldname, file);
    }

    // 3. 遍历并配对测试用例文件
    const testCases = [];
    for (let i = 0; ; i++) {
      const inputFieldName = `test_input_file_${i}`;
      const outputFieldName = `test_output_file_${i}`;

      if (fileMap.has(inputFieldName) && fileMap.has(outputFieldName)) {
        testCases.push({
          inputFilePath: fileMap.get(inputFieldName).path,
          outputFilePath: fileMap.get(outputFieldName).path,
        });
      } else {
        break;
      }
    }

    // 4. 创建一个新的 Problem 文档实例
    const newProblem = new Problem({
      ...problemData,
      testCases: testCases,
    });

    // 5. 保存到数据库
    const savedProblem = await newProblem.save();
    
    res.status(201).json({ message: '题目创建成功!', problem: savedProblem });

  } catch (err) {
    console.error("Create problem error:", err);
    res.status(400).json({ message: '创建题目失败，请检查数据格式', error: err.message });
  }
});


// 我们也可以把“获取题目列表”和“获取题目详情”的逻辑从 files.js 移到这里，让管理更清晰

// 路由: GET /api/problems (获取题目列表)
router.get('/', async (req, res) => {
  try {
    const page = parseInt(String(req.query.page)) || 1;
    const limit = parseInt(String(req.query.limit)) || 10;
    const skip = (page - 1) * limit;
    const query = {};

    const totalItems = await Problem.countDocuments(query);
    const problems = await Problem.find(query)
      .sort({ _id: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      items: problems,
      pagination: {
        currentPage: page,
        pageSize: limit,
        totalItems: totalItems,
        totalPages: Math.ceil(totalItems / limit)
      }
    });
  } catch (err) {
    console.error("Get all problems error:", err);
    res.status(500).json({ error: 'Server error while fetching problems.' });
  }
});

// 路由: GET /api/problems/:id (获取题目详情)
router.get('/:id', async (req, res) => {
    try {
        const problem = await Problem.findById(req.params.id);
        if (!problem) {
            return res.status(404).json({ message: 'Problem not found' });
        }
        res.json(problem);
    } catch (err) {
        console.error("Get problem by id error:", err);
        res.status(400).json({ error: 'Invalid ID format or server error.' });
    }
});


export default router;