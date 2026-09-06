const Subject = require("../models/Subject");
const Concept = require("../models/Concept");
const Quiz = require("../models/Quiz");
const Attempt = require("../models/Attempt");
const StudentProgress = require("../models/StudentProgress");

// === SUBJECTS ===
const createSubject = async (req, res) => {
  const { name, description } = req.body;
  try {
    const subject = await Subject.create({
      name,
      description,
      createdBy: req.user._id,
    });
    res.status(201).json(subject);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getSubjects = async (req, res) => {
  try {
    const subjects = await Subject.find({ createdBy: req.user._id });
    res.json(subjects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// === CONCEPTS ===
const createConcept = async (req, res) => {
  const { subjectId, name, difficulty, description } = req.body;
  try {
    const concept = await Concept.create({
      subjectId,
      name,
      difficulty,
      description,
      createdBy: req.user._id,
    });
    res.status(201).json(concept);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getConceptsBySubject = async (req, res) => {
  try {
    const concepts = await Concept.find({ subjectId: req.params.subjectId, createdBy: req.user._id });
    res.json(concepts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// === QUIZZES ===
const createQuiz = async (req, res) => {
  const { conceptId, title, questions } = req.body;
  try {
    const quiz = await Quiz.create({
      conceptId,
      title,
      questions,
      createdBy: req.user._id,
    });
    res.status(201).json(quiz);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getQuizByConcept = async (req, res) => {
  try {
    const quiz = await Quiz.findOne({ conceptId: req.params.conceptId });
    if (!quiz) return res.status(404).json({ message: "Quiz not found for this concept" });
    res.json(quiz);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// === ATTEMPTS ===
const saveAttempt = async (req, res) => {
  const { quizId, conceptId, score, totalQuestions, assessmentType, timeTaken } = req.body;
  
  try {
    const percentage = Math.round((score / totalQuestions) * 100);
    
    const attempt = await Attempt.create({
      userId: req.user._id,
      quizId,
      conceptId,
      score,
      totalQuestions,
      percentage,
      assessmentType: assessmentType || "INITIAL",
      timeTaken
    });

    res.status(201).json(attempt);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createSubject,
  getSubjects,
  createConcept,
  getConceptsBySubject,
  createQuiz,
  getQuizByConcept,
  saveAttempt,
};
