const Problem = require('../models/Problem');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// 创建新题目（带文件上传）
exports.createProblem = async (req, res) => {
  try {
    // 解析表单数据
    const problemData = JSON.parse(req.body.problemData);
    
    // 创建新题目
    const newProblem = new Problem({
      ...problemData,
      createdBy: req.user.id
    });

    // 处理测试点文件
    if (req.files && req.files.length > 0) {
      const testCases = [];
      
      // 创建题目专属目录
      const problemDir = path.join(__dirname, '../../storage/testcases', newProblem.problemId);
      await fs.mkdir(problemDir, { recursive: true });
      
      // 处理每个测试点
      for (let i = 0; i < newProblem.examples.length; i++) {
        if (i < req.files.length / 2) {
          const inputFile = req.files.find(f => 
            f.fieldname === `test_input_file_${i}` && f.originalname.endsWith('.in')
          );
          
          const outputFile = req.files.find(f => 
            f.fieldname === `test_output_file_${i}` && 
            (f.originalname.endsWith('.out') || f.originalname.endsWith('.ans'))
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
      }
      
      newProblem.testCases = testCases;
    }

    // 保存到数据库
    const savedProblem = await newProblem.save();
    
    res.status(201).json({
      success: true,
      message: 'Problem created successfully',
      problemId: savedProblem.problemId
    });
  } catch (error) {
    console.error('Error creating problem:', error);
    
    // 清理已上传的文件
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          await fs.unlink(file.path);
        } catch (cleanupErr) {
          console.error('Error cleaning up file:', cleanupErr);
        }
      }
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create problem',
      error: error.message 
    });
  }
};

// 根据ID获取题目
exports.getProblemById = async (req, res) => {
  try {
    const problem = await Problem.findOne({ problemId: req.params.id })
      .populate('createdBy', 'username -_id');
    
    if (!problem) {
      return res.status(404).json({
        success: false,
        message: 'Problem not found'
      });
    }
    
    // 只返回必要信息，不返回测试点文件路径
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
      createdAt: problem.createdAt,
      createdBy: problem.createdBy
    };
    
    res.status(200).json({
      success: true,
      problem: responseData
    });
  } catch (error) {
    console.error('Error fetching problem:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch problem',
      error: error.message 
    });
  }
};