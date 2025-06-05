const express = require('express');
const router = express.Router();
const problemController = require('../controllers/problemController');
const fileMiddleware = require('../middlewares/fileMiddleware');

// 创建新题目 (无需权限)
router.post(
  '/', 
  (req, res, next) => {
    // 从请求中获取样例数量
    try {
      if (req.body.problemData) {
        const problemData = JSON.parse(req.body.problemData);
        req.body.exampleCount = problemData.examples?.length || 0;
      }
    } catch (e) {
      console.error('解析problemData出错:', e);
    }
    next();
  },
  fileMiddleware.handleProblemFiles,
  problemController.createProblem
);

// 根据ID获取题目
router.get('/:id', problemController.getProblemById);

module.exports = router;