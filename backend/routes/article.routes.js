//backend/routes/article.routes.js
const express = require('express');
const router = express.Router();

const {
  analyzeArticle,
  processArticle,
  getArticles,
  searchByEntity,
} = require('../controllers/article.controller');
const validate = require('../middlewares/validation');
const { processArticleSchema } = require('../validations/article.validation');

router.post('/analyze', validate(processArticleSchema), analyzeArticle);
router.post('/process', validate(processArticleSchema), processArticle);
router.get('/', getArticles);
router.get('/search', searchByEntity);

module.exports = router;
