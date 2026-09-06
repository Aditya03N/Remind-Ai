const mongoose = require("mongoose");

const attemptSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  quizId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Quiz",
    required: true,
  },
  conceptId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Concept",
    required: true,
  },
  score: {
    type: Number,
    required: true,
  },
  totalQuestions: {
    type: Number,
    required: true,
  },
  percentage: {
    type: Number,
    required: true,
  },
  assessmentType: {
    type: String,
    enum: ["INITIAL", "RETENTION_CHECK", "POST_REVISION", "LONG_TERM_CHECK"],
    default: "INITIAL",
  },
  timeTaken: {
    type: Number, // in seconds
  }
}, {
  timestamps: true,
});

const Attempt = mongoose.model("Attempt", attemptSchema);

module.exports = Attempt;
