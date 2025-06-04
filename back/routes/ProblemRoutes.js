const express = require('express');
const router = express.Router();
const problemController = require('../controllers/problemController');
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');
const fileMiddleware = require('../middlewares/fileMiddleware');

// 创建新题目（需要管理员权限）
router.post(
  '/', 
  authMiddleware, 
  adminMiddleware,
  (req, res, next) => {
    // 从请求中获取样例数量（前端通过problemData传递）
    try {
      if (req.body.problemData) {
        const problemData = JSON.parse(req.body.problemData);
        req.body.exampleCount = problemData.examples?.length || 0;
      }
    } catch (e) {
      console.error('Error parsing problemData:', e);
    }
    next();
  },
  fileMiddleware.handleProblemFiles,
  problemController.createProblem
);

// 根据ID获取题目（公开）
router.get('/:id', problemController.getProblemById);

module.exports = router;