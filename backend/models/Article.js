//backend/models/Article.js
const mongoose = require('mongoose');

const entitySchema = new mongoose.Schema({
  text: String,
  label: String,
  confidence: Number,
  start: Number,
  end: Number,
});

const articleSchema = new mongoose.Schema(
  {
    title: String,
    content: { type: String, required: true },

    extractedEntities: [entitySchema],

    sourceUrl: String,
    publishedDate: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Article', articleSchema);