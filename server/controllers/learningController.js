const mongoose = require("mongoose");
const multer = require("multer");
const pdfParse = require("pdf-parse");
const Subject = require("../models/Subject");
const Concept = require("../models/Concept");
const Quiz = require("../models/Quiz");
const Attempt = require("../models/Attempt");
const StudentProgress = require("../models/StudentProgress");
const { generateQuestions, generateSummary } = require("../services/aiService");
const { determineKnowledgeStatus } = require("../services/retentionService");

// Configure Multer for in-memory file uploads with 5MB max size
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

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

const deleteSubject = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid Subject ID" });
    }

    const subject = await Subject.findOne({ _id: id, createdBy: req.user._id });
    if (!subject) return res.status(404).json({ message: "Subject not found" });

    // Find all concepts under this subject
    const concepts = await Concept.find({ subjectId: id });
    const conceptIds = concepts.map(c => c._id);

    // Delete associated quizzes, student progress, attempts
    await Quiz.deleteMany({ conceptId: { $in: conceptIds } });
    await StudentProgress.deleteMany({ conceptId: { $in: conceptIds } });
    await Attempt.deleteMany({ conceptId: { $in: conceptIds } });
    await Concept.deleteMany({ subjectId: id });

    // Delete subject
    await Subject.deleteOne({ _id: id });

    res.json({ message: "Subject and associated concepts deleted successfully" });
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
      difficulty: difficulty || "Medium",
      description,
      studyMaterial: studyMaterial || "",
      createdBy: req.user._id,
    });
    res.status(201).json(concept);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getConceptsBySubject = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.subjectId)) {
      return res.status(400).json({ message: "Invalid Subject ID" });
    }
    const concepts = await Concept.find({ subjectId: req.params.subjectId, createdBy: req.user._id });
    
    // Also attach quiz count / baseline info for each concept
    const enhancedConcepts = await Promise.all(
      concepts.map(async (c) => {
        const quiz = await Quiz.findOne({ conceptId: c._id });
        const progress = await StudentProgress.findOne({ userId: req.user._id, conceptId: c._id });
        return {
          ...c.toObject(),
          quizCount: quiz ? quiz.questions.length : 0,
          hasQuiz: !!quiz && quiz.questions.length > 0,
          baselineTaken: !!progress,
          currentRetention: progress ? progress.estimatedRetention : null,
          knowledgeStatus: progress ? progress.knowledgeStatus : null
        };
      })
    );

    res.json(enhancedConcepts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getConceptById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid Concept ID format." });
    }
    const concept = await Concept.findById(req.params.id).populate("subjectId", "name description");
    if (!concept) return res.status(404).json({ message: "Concept not found" });

    const quiz = await Quiz.findOne({ conceptId: concept._id });
    const progress = await StudentProgress.findOne({ userId: req.user._id, conceptId: concept._id });

    res.json({
      ...concept.toObject(),
      quiz: quiz || null,
      quizCount: quiz ? quiz.questions.length : 0,
      progress: progress || null
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteConcept = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid Concept ID" });
    }

    const concept = await Concept.findOne({ _id: id, createdBy: req.user._id });
    if (!concept) return res.status(404).json({ message: "Concept not found" });

    // Delete associated quizzes, student progress, attempts
    await Quiz.deleteMany({ conceptId: id });
    await StudentProgress.deleteMany({ conceptId: id });
    await Attempt.deleteMany({ conceptId: id });

    // Delete concept
    await Concept.deleteOne({ _id: id });

    res.json({ message: "Concept deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const saveStudyMaterial = async (req, res) => {
  const { studyMaterial } = req.body;
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.conceptId)) {
      return res.status(400).json({ message: "Invalid Concept ID format." });
    }
    const concept = await Concept.findOneAndUpdate(
      { _id: req.params.conceptId, createdBy: req.user._id },
      { studyMaterial },
      { new: true }
    );
    if (!concept) return res.status(404).json({ message: "Concept not found" });
    res.json(concept);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Upload & extract text from PDF, TXT, MD documents
const uploadNotesDocument = async (req, res) => {
  const { conceptId } = req.params;
  try {
    if (!mongoose.Types.ObjectId.isValid(conceptId)) {
      return res.status(400).json({ message: "Invalid Concept ID format." });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No document attached. Please select a file (PDF, TXT, MD under 5MB)." });
    }

    const concept = await Concept.findById(conceptId);
    if (!concept) return res.status(404).json({ message: "Concept not found." });

    let extractedText = "";
    const fileName = req.file.originalname || "notes-doc";
    const mimeType = req.file.mimetype || "";

    if (mimeType.includes("pdf") || fileName.toLowerCase().endsWith(".pdf")) {
      const pdfData = await pdfParse(req.file.buffer);
      extractedText = pdfData.text || "";
    } else {
      extractedText = req.file.buffer.toString("utf-8");
    }

    // Clean up excessive whitespace
    extractedText = extractedText.replace(/\r\n/g, "\n").trim();

    if (!extractedText) {
      return res.status(400).json({ message: "Unable to extract readable text from this document." });
    }

    concept.studyMaterial = extractedText;
    concept.notesFileName = fileName;
    await concept.save();

    res.json({
      message: `Document "${fileName}" parsed and saved successfully!`,
      fileName,
      studyMaterial: extractedText,
      characterCount: extractedText.length,
      concept
    });
  } catch (error) {
    console.error("Document Upload Error:", error);
    res.status(500).json({ message: "Failed to process document: " + error.message });
  }
};

// === AI GENERATION ===
const generateAIQuestions = async (req, res) => {
  const { conceptId, count = 10, studyMaterial } = req.body;
  
  try {
    if (!mongoose.Types.ObjectId.isValid(conceptId)) {
      return res.status(400).json({ message: "Invalid Concept ID format." });
    }
    const concept = await Concept.findById(conceptId);
    if (!concept) return res.status(404).json({ message: "Concept not found" });

    const materialToUse = studyMaterial !== undefined ? studyMaterial : concept.studyMaterial;
    if (studyMaterial !== undefined) {
      concept.studyMaterial = studyMaterial;
      await concept.save();
    }

    // Find existing questions to avoid duplication
    let existingQuiz = await Quiz.findOne({ conceptId });
    const existingQuestions = existingQuiz ? existingQuiz.questions : [];

    // Call AI Service (generates 10 MCQs)
    const newQuestions = await generateQuestions(concept.name, materialToUse, count, existingQuestions);

    if (existingQuiz) {
      existingQuiz.questions = newQuestions;
      await existingQuiz.save();
    } else {
      existingQuiz = await Quiz.create({
        conceptId,
        title: `${concept.name} Assessment Quiz`,
        questions: newQuestions,
        createdBy: req.user._id
      });
    }

    res.json({
      message: `Successfully generated ${newQuestions.length} questions.`,
      quiz: existingQuiz,
      questionsCount: newQuestions.length
    });
  } catch (error) {
    console.error("AI Generation Error:", error);
    res.status(500).json({ message: error.message });
  }
};

const generateAISummary = async (req, res) => {
  const { conceptId, studyMaterial } = req.body;
  
  try {
    if (!mongoose.Types.ObjectId.isValid(conceptId)) {
      return res.status(400).json({ message: "Invalid Concept ID format." });
    }
    const concept = await Concept.findById(conceptId);
    if (!concept) return res.status(404).json({ message: "Concept not found" });

    const materialToUse = studyMaterial !== undefined ? studyMaterial : concept.studyMaterial;

    const summary = await generateSummary(concept.name, materialToUse);
    
    concept.aiSummary = summary;
    if (studyMaterial !== undefined) {
      concept.studyMaterial = studyMaterial;
    }
    await concept.save();

    res.json({
      summary,
      concept
    });
  } catch (error) {
    console.error("AI Summary Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// === QUIZZES ===
const createQuiz = async (req, res) => {
  const { conceptId, title, questions } = req.body;
  try {
    let quiz = await Quiz.findOne({ conceptId });
    if (quiz) {
      quiz.questions = questions;
      quiz.title = title || quiz.title;
      await quiz.save();
    } else {
      quiz = await Quiz.create({
        conceptId,
        title: title || "Concept Quiz",
        questions,
        createdBy: req.user._id,
      });
    }
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
    const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
    
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

    // Automatically initialize or update StudentProgress
    let progress = await StudentProgress.findOne({ userId: req.user._id, conceptId });
    const status = determineKnowledgeStatus(percentage);

    if (!progress) {
      const concept = await Concept.findById(conceptId);
      progress = await StudentProgress.create({
        userId: req.user._id,
        conceptId,
        initialScore: percentage,
        currentScore: percentage,
        estimatedRetention: percentage,
        knowledgeStatus: status,
        difficulty: concept?.difficulty || "Medium",
        nextReviewDate: new Date(new Date().setDate(new Date().getDate() + (status === "STRONG" ? 3 : 1))),
        assessmentHistory: [{
          score: percentage,
          assessmentType: assessmentType || "INITIAL",
          timeTaken
        }]
      });
    } else {
      progress.currentScore = percentage;
      progress.estimatedRetention = percentage;
      progress.lastAssessmentDate = new Date();
      if (progress.knowledgeStatus !== "MASTERED") {
        progress.knowledgeStatus = status;
      }
      progress.assessmentHistory.push({
        score: percentage,
        assessmentType: assessmentType || "RETENTION_CHECK",
        timeTaken
      });
      await progress.save();
    }

    res.status(201).json({ attempt, progress });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  upload,
  createSubject,
  getSubjects,
  deleteSubject,
  createConcept,
  getConceptsBySubject,
  getConceptById,
  deleteConcept,
  saveStudyMaterial,
  uploadNotesDocument,
  generateAIQuestions,
  generateAISummary,
  createQuiz,
  getQuizByConcept,
  saveAttempt,
};
