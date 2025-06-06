const Problem = require('../models/Problem');
const fs = require('fs').promises;
const path = require('path');
const File = require('../models/File'); // 'File' 模型即为我们的 Problem 模型

exports.createProblem = async (req, res) => {
  try {
    // 从请求体中解构出题目的元数据
    const { title, description, difficulty, tags, timeLimit, memoryLimit } = req.body;
    
    // 从 req.files 中获取上传的测试用例
    const testCases = req.files.testCases;

    // 校验测试用例是否存在
    if (!testCases || testCases.length === 0) {
      return res.status(400).json({ message: 'Test case files are required.' });
    }

    // 创建一个新的题目实例
    const newProblem = new File({
      title,
      description,
      difficulty,
      tags: JSON.parse(tags), // 前端发送的 tags 是字符串化的数组，后端需要解析
      timeLimit,
      memoryLimit,
      testCases: testCases.map(file => ({
        input: file.path, // 保存输入文件的路径
        output: ''       // 输出暂时留空
      }))
    });

    // 将新题目保存到数据库
    await newProblem.save();

    // 返回成功响应
    res.status(201).json({
      message: 'Problem created successfully!',
      file: newProblem
    });

  } catch (err) {
    console.error('Error creating problem:', err);
    if (err.name === 'ValidationError') {
        return res.status(400).json({ message: 'Validation Error', errors: err.errors });
    }
    // 返回统一的服务器错误
    res.status(500).send('Server Error');
  }
};

// 根据ID获取题目
exports.getProblemById = async (req, res) => {
  try {
    const problem = await Problem.findOne({ problemId: req.params.id });
    
    if (!problem) {
      return res.status(404).json({
        success: false,
        message: '题目未找到'
      });
    }
    
    // 返回题目信息
    const responseData = {
      problemId: problem.problemId,
      title: problem.title,
      description: problem.description,
      difficulty: problem.difficulty,
      tags: problem.tags,
      inputFormat: problem.inputFormat,
      outputFormat: problem.outputFormat,
      timeLimit: problem.timeLimit,
      memoryLimit: problem.memoryLimit,
      examples: problem.examples,
      createdAt: problem.createdAt
    };
    
    res.status(200).json({
      success: true,
      problem: responseData
    });
  } catch (error) {
    console.error('获取题目失败:', error);
    res.status(500).json({ 
      success: false, 
      message: '获取题目失败',
      error: error.message 
    });
  }
};