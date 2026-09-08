const express = require("express");
const router = express.Router();
const {
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
  saveAttempt
} = require("../controllers/learningController");
const { protect } = require("../middleware/authMiddleware");

// All routes are protected
router.use(protect);

router.post("/subjects", createSubject);
router.get("/subjects", getSubjects);
router.delete("/subjects/:id", deleteSubject);

router.post("/concepts", createConcept);
router.get("/concepts/subject/:subjectId", getConceptsBySubject);
router.get("/concepts/:id", getConceptById);
router.delete("/concepts/:id", deleteConcept);

router.put("/concepts/:conceptId/material", saveStudyMaterial);
router.post("/concepts/:conceptId/upload-material", upload.single("file"), uploadNotesDocument);

router.post("/ai/generate", generateAIQuestions);
router.post("/ai/summary", generateAISummary);

router.post("/quizzes", createQuiz);
router.get("/quizzes/concept/:conceptId", getQuizByConcept);

router.post("/attempts", saveAttempt);

module.exports = router;
