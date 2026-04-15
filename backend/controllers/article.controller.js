//backend/controllers/article.controller.js
const Article = require('../models/Article');
const { extractEntities } = require('../services/ner.service');
const logger = require('../Utils/logger');

const buildArticleEntityPayload = async ({ title = '', content }) => {
  const entities = await extractEntities(content);

  return {
    title,
    content,
    extractedEntities: entities,
  };
};

// ANALYZE ARTICLE WITHOUT SAVING
exports.analyzeArticle = async (req, res, next) => {
  try {
    const { title, content } = req.body;
    const payload = await buildArticleEntityPayload({ title, content });

    logger.info('Article analyzed without saving', {
      title: title || null,
      entityCount: payload.extractedEntities.length,
    });

    res.json(payload);
  } catch (error) {
    next(error);
  }
};

// PROCESS ARTICLE
exports.processArticle = async (req, res, next) => {
  try {
    const { title, content } = req.body;

    if (!content) {
      return res.status(400).json({ message: 'Content is required' });
    }

    const payload = await buildArticleEntityPayload({ title, content });

    logger.info('Article processed for entities', {
      title: title || null,
      entityCount: payload.extractedEntities.length,
    });

    const article = await Article.create(payload);

    res.status(201).json(article);
  } catch (error) {
    next(error);
  }
};

// GET ALL ARTICLES
exports.getArticles = async (req, res, next) => {
  try {
    const articles = await Article.find().sort({ createdAt: -1 });

    logger.info('Articles fetched', {
      count: articles.length,
    });

    res.json(articles);
  } catch (error) {
    next(error);
  }
};

// SEARCH BY ENTITY
exports.searchByEntity = async (req, res, next) => {
  try {
    const { q } = req.query;

    const articles = await Article.find({
      'extractedEntities.text': { $regex: q, $options: 'i' },
    });

    logger.info('Entity search completed', {
      query: q || '',
      count: articles.length,
    });

    res.json(articles);
  } catch (error) {
    next(error);
  }
};
