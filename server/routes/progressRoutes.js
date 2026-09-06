const express = require("express");
const router = express.Router();
const {
  initializeProgress,
  getDashboard,
  getRecommendations,
  submitRetentionCheck,
  markRevisionComplete,
  submitPostRevision,
  getConceptProgress,
  getMasteredConcepts,
  getAllProgress,
  setManualReminder
} = require("../controllers/progressController");
const { protect } = require("../middleware/authMiddleware");

router.use(protect);

router.post("/initialize", initializeProgress);
router.get("/dashboard", getDashboard);
router.get("/recommendations", getRecommendations);
router.get("/mastered", getMasteredConcepts);
router.get("/all", getAllProgress);
router.post("/retention-check", submitRetentionCheck);
router.post("/revision-complete", markRevisionComplete);
router.post("/post-revision-assessment", submitPostRevision);
router.post("/post-revision-assessment", submitPostRevision);
router.put("/:progressId/reminder", setManualReminder);
router.get("/:conceptId", getConceptProgress);

module.exports = router;
