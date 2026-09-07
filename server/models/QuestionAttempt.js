const mongoose = require("mongoose");

const questionAttemptSchema = new mongoose.Schema({
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
  quizId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Quiz",
    required: true,
  },
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  isCorrect: {
    type: Boolean,
    required: true,
  },
  selectedAnswerIndex: {
    type: Number,
  },
  timeTaken: {
    type: Number, // in seconds
  }
}, {
  timestamps: true,
});

const QuestionAttempt = mongoose.model("QuestionAttempt", questionAttemptSchema);

module.exports = QuestionAttempt;
