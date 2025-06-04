const Problem = require('../models/Problem');
const fs = require('fs').promises;
const path = require('path');

exports.createProblem = async (req, res) => {
  try {
    // 解析表单数据
    const problemData = JSON.parse(req.body.problemData);
    
    // 创建新题目 (无用户关联)
    const newProblem = new Problem(problemData);

    // 处理测试点文件
    if (req.files && req.files.length > 0) {
      const testCases = [];
      
      // 创建题目专属目录
      const problemDir = path.join(__dirname, '../../storage/testcases', newProblem.problemId);
      await fs.mkdir(problemDir, { recursive: true });
      
      // 处理每个测试点
      for (let i = 0; i < problemData.examples.length; i++) {
        const inputFile = req.files.find(f => 
          f.fieldname === `test_input_file_${i}`
        );
        
        const outputFile = req.files.find(f => 
          f.fieldname === `test_output_file_${i}`
        );
        
        if (inputFile && outputFile) {
          const inputFilename = `input_${i}.in`;
          const outputFilename = `output_${i}.out`;
          
          const inputPath = path.join(problemDir, inputFilename);
          const outputPath = path.join(problemDir, outputFilename);
          
          await fs.writeFile(inputPath, inputFile.buffer);
          await fs.writeFile(outputPath, outputFile.buffer);
          
          testCases.push({
            inputPath: inputPath.replace(/\\/g, '/'),
            outputPath: outputPath.replace(/\\/g, '/'),
            isSample: true
          });
        }
      }
      
      newProblem.testCases = testCases;
    }

    // 保存到数据库
    const savedProblem = await newProblem.save();
    
    res.status(201).json({
      success: true,
      message: '题目创建成功',
      problemId: savedProblem.problemId
    });
  } catch (error) {
    console.error('创建题目失败:', error);
    
    res.status(500).json({ 
      success: false, 
      message: '创建题目失败',
      error: error.message 
    });
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