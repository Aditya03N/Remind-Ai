const Subject = require("../models/Subject");
const Concept = require("../models/Concept");
const Quiz = require("../models/Quiz");
const Attempt = require("../models/Attempt");
const StudentProgress = require("../models/StudentProgress");
const { determineKnowledgeStatus } = require("../services/retentionService");
const { generateQuestions } = require("../services/aiService");

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
  const { subjectId, name, difficulty, description, studyMaterial } = req.body;
  try {
    const concept = await Concept.create({
      subjectId,
      name,
      difficulty,
      description,
      studyMaterial,
      createdBy: req.user._id,
    });

    // Auto-initialize progress for the creator
    const initialScore = 0; // Default score for newly added concepts before taking a quiz
    const status = determineKnowledgeStatus(initialScore);
    await StudentProgress.create({
      userId: req.user._id,
      conceptId: concept._id,
      initialScore,
      currentScore: initialScore,
      estimatedRetention: initialScore,
      knowledgeStatus: status,
      difficulty: concept.difficulty,
      nextReviewDate: new Date(new Date().setDate(new Date().getDate() + 1)), // Due next day or immediately
      assessmentHistory: [{
        score: initialScore,
        assessmentType: "INITIAL"
      }]
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

const saveStudyMaterial = async (req, res) => {
  try {
    const concept = await Concept.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user._id },
      { studyMaterial: req.body.studyMaterial },
      { new: true }
    );
    if (!concept) return res.status(404).json({ message: "Concept not found" });
    res.json(concept);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// === AI GENERATION ===
const generateAIQuestions = async (req, res) => {
  const { conceptId, count } = req.body;
  try {
    const concept = await Concept.findOne({ _id: conceptId, createdBy: req.user._id });
    if (!concept) return res.status(404).json({ message: "Concept not found" });

    // Find existing quiz to pass existing questions and avoid duplicates
    let quiz = await Quiz.findOne({ conceptId });
    const existingQuestions = quiz ? quiz.questions : [];

    // Call AI Service
    const aiQuestions = await generateQuestions(concept.name, concept.studyMaterial, count || 10, existingQuestions);

    if (!quiz) {
      // Create new quiz if none exists
      quiz = await Quiz.create({
        conceptId,
        title: `${concept.name} Knowledge Check`,
        questions: aiQuestions,
        createdBy: req.user._id,
      });
    } else {
      // Append new questions
      quiz.questions.push(...aiQuestions);
      await quiz.save();
    }

    res.status(201).json(quiz);
  } catch (error) {
    console.error("Generate AI Questions Error:", error);
    let errorMessage = "Failed to generate questions. Please try again.";
    
    // Check if the error is related to high demand or 503 service unavailable
    if (error.message && (error.message.includes("503") || error.message.includes("high demand"))) {
      errorMessage = "The AI service is currently experiencing high demand. Please try again later.";
    } else if (error.message) {
      // Still show other messages but keep them cleaner if possible
      errorMessage = error.message;
    }

    res.status(500).json({ message: errorMessage });
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
  saveStudyMaterial,
  generateAIQuestions
};
