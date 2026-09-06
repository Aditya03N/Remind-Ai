const express = require("express");
const router = express.Router();
const {
  initializeProgress,
  getDashboard,
  getRecommendations,
  submitRetentionCheck,
  markRevisionComplete,
  submitPostRevision,
  getConceptProgress
} = require("../controllers/progressController");
const { protect } = require("../middleware/authMiddleware");

router.use(protect);

router.post("/initialize", initializeProgress);
router.get("/dashboard", getDashboard);
router.get("/recommendations", getRecommendations);
router.post("/retention-check", submitRetentionCheck);
router.post("/revision-complete", markRevisionComplete);
router.post("/post-revision-assessment", submitPostRevision);
router.get("/:conceptId", getConceptProgress);

module.exports = router;
