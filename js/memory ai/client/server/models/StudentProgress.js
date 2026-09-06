const mongoose = require("mongoose");

const assessmentHistorySchema = new mongoose.Schema({
  score: {
    type: Number,
    required: true,
  },
  assessmentType: {
    type: String,
    enum: ["INITIAL", "RETENTION_CHECK", "POST_REVISION", "LONG_TERM_CHECK"],
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  timeTaken: {
    type: Number,
  }
});

const studentProgressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  conceptId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Concept",
    required: true,
  },
  initialScore: {
    type: Number,
    required: true,
  },
  currentScore: {
    type: Number,
    required: true,
  },
  estimatedRetention: {
    type: Number,
    required: true,
  },
  knowledgeStatus: {
    type: String,
    enum: ["STRONG", "MODERATE_RISK", "HIGH_RISK", "CRITICAL", "MASTERED"],
    default: "STRONG",
  },
  revisionCount: {
    type: Number,
    default: 0,
  },
  successfulRetentionChecks: {
    type: Number,
    default: 0,
  },
  lastAssessmentDate: {
    type: Date,
    default: Date.now,
  },
  lastRevisionDate: {
    type: Date,
  },
  nextReviewDate: {
    type: Date,
  },
  learningDate: {
    type: Date,
    default: Date.now,
  },
  difficulty: {
    type: String,
    enum: ["Easy", "Medium", "Hard"],
    default: "Medium",
  },
  assessmentHistory: [assessmentHistorySchema]
}, {
  timestamps: true,
});

const StudentProgress = mongoose.model("StudentProgress", studentProgressSchema);

module.exports = StudentProgress;
