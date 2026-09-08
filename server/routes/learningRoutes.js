const express = require("express");
const router = express.Router();
const {
  createSubject,
  getSubjects,
  createConcept,
  getConceptsBySubject,
  createQuiz,
  getQuizByConcept,
  saveAttempt
} = require("../controllers/learningController");
const { protect } = require("../middleware/authMiddleware");

// All routes are protected
router.use(protect);

router.post("/subjects", createSubject);
router.get("/subjects", getSubjects);

router.post("/concepts", createConcept);
router.get("/concepts/subject/:subjectId", getConceptsBySubject);

router.post("/quizzes", createQuiz);
router.get("/quizzes/concept/:conceptId", getQuizByConcept);

router.post("/attempts", saveAttempt);

module.exports = router;
