const StudentProgress = require("../models/StudentProgress");
const Concept = require("../models/Concept");
const Attempt = require("../models/Attempt");

const { 
  calculateEstimatedRetention, 
  determineKnowledgeStatus, 
  getDaysSince 
} = require("../services/retentionService");

const { 
  calculatePriority, 
  estimateRevisionDuration 
} = require("../services/revisionRecommendationService");

const { processRetentionCheck } = require("../services/masteryService");

// @desc    Initialize progress for a concept after first learning/assessment
// @route   POST /api/progress/initialize
const initializeProgress = async (req, res) => {
  const { conceptId, initialScore } = req.body;

  try {
    const concept = await Concept.findById(conceptId);
    if (!concept) return res.status(404).json({ message: "Concept not found" });

    // Ensure it doesn't already exist
    let progress = await StudentProgress.findOne({ userId: req.user._id, conceptId });
    if (progress) return res.status(400).json({ message: "Progress already initialized" });

    const status = determineKnowledgeStatus(initialScore);

    progress = await StudentProgress.create({
      userId: req.user._id,
      conceptId,
      initialScore,
      currentScore: initialScore,
      estimatedRetention: initialScore,
      knowledgeStatus: status,
      difficulty: concept.difficulty,
      nextReviewDate: new Date(new Date().setDate(new Date().getDate() + (status === "STRONG" ? 3 : 1))), // Next review based on initial
      assessmentHistory: [{
        score: initialScore,
        assessmentType: "INITIAL"
      }]
    });

    res.status(201).json(progress);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get dashboard metrics and today's priority
const getDashboard = async (req, res) => {
  try {
    const progresses = await StudentProgress.find({ userId: req.user._id }).populate({
      path: "conceptId",
      populate: {
        path: "subjectId",
        select: "name"
      }
    });
    
    const defaultCategorized = {
      STRONG: [],
      MODERATE_RISK: [],
      HIGH_RISK: [],
      CRITICAL: [],
      MASTERED: []
    };

    if (progresses.length === 0) {
      return res.json({
        overallHealth: 0,
        totalConcepts: 0,
        todayPriority: null,
        knowledgeOverview: { STRONG: 0, MODERATE_RISK: 0, HIGH_RISK: 0, CRITICAL: 0, MASTERED: 0 },
        categorizedTopics: defaultCategorized,
        revisionPlan: []
      });
    }

    // Update retention for all before calculating dashboard metrics
    let totalRetention = 0;
    const knowledgeOverview = { STRONG: 0, MODERATE_RISK: 0, HIGH_RISK: 0, CRITICAL: 0, MASTERED: 0 };
    const categorizedTopics = {
      STRONG: [],
      MODERATE_RISK: [],
      HIGH_RISK: [],
      CRITICAL: [],
      MASTERED: []
    };
    const revisionPlan = [];

    for (let prog of progresses) {
      if (!prog.conceptId) continue;

      if (prog.knowledgeStatus !== "MASTERED") {
        const daysPassed = getDaysSince(prog.lastAssessmentDate);
        prog.estimatedRetention = calculateEstimatedRetention(
          prog.currentScore, 
          prog.difficulty, 
          daysPassed, 
          prog.revisionCount
        );
        prog.knowledgeStatus = determineKnowledgeStatus(prog.estimatedRetention);
        await prog.save();
      }

      totalRetention += prog.estimatedRetention;
      const status = prog.knowledgeStatus || "STRONG";
      knowledgeOverview[status] = (knowledgeOverview[status] || 0) + 1;

      const topicItem = {
        progressId: prog._id,
        conceptId: prog.conceptId._id,
        name: prog.conceptId.name,
        subjectName: prog.conceptId.subjectId?.name || "General",
        difficulty: prog.difficulty || prog.conceptId.difficulty || "Medium",
        estimatedRetention: prog.estimatedRetention,
        currentScore: prog.currentScore,
        knowledgeStatus: status,
        revisionCount: prog.revisionCount,
        lastAssessmentDate: prog.lastAssessmentDate,
        nextReviewDate: prog.nextReviewDate
      };

      if (categorizedTopics[status]) {
        categorizedTopics[status].push(topicItem);
      }

      // Calculate priority for revision plan
      if (status !== "MASTERED") {
        const daysSinceAssessment = getDaysSince(prog.lastAssessmentDate);
        const priority = calculatePriority(prog.estimatedRetention, prog.difficulty, daysSinceAssessment, prog.currentScore);
        
        revisionPlan.push({
          progressId: prog._id,
          concept: prog.conceptId,
          status: status,
          estimatedRetention: prog.estimatedRetention,
          priorityScore: priority,
          recommendedDuration: estimateRevisionDuration(status, prog.difficulty)
        });
      }
    }

    const activeCount = progresses.filter(p => p.conceptId).length;
    const overallHealth = activeCount > 0 ? Math.round(totalRetention / activeCount) : 0;
    
    // Sort revision plan by priority desc
    revisionPlan.sort((a, b) => b.priorityScore - a.priorityScore);

    const todayPriority = revisionPlan.length > 0 ? revisionPlan[0] : null;

    res.json({
      overallHealth,
      totalConcepts: activeCount,
      todayPriority,
      knowledgeOverview,
      categorizedTopics,
      revisionPlan: revisionPlan.slice(0, 5) // Top 5
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get full revision recommendations
// @route   GET /api/progress/recommendations
const getRecommendations = async (req, res) => {
  try {
    const progresses = await StudentProgress.find({ userId: req.user._id }).populate("conceptId");
    const revisionPlan = [];

    for (let prog of progresses) {
      if (prog.knowledgeStatus !== "MASTERED") {
        const daysPassed = getDaysSince(prog.lastAssessmentDate);
        prog.estimatedRetention = calculateEstimatedRetention(
          prog.currentScore, 
          prog.difficulty, 
          daysPassed, 
          prog.revisionCount
        );
        prog.knowledgeStatus = determineKnowledgeStatus(prog.estimatedRetention);
        await prog.save();
        
        const priority = calculatePriority(prog.estimatedRetention, prog.difficulty, daysPassed, prog.currentScore);
        
        revisionPlan.push({
          progressId: prog._id,
          concept: prog.conceptId,
          status: prog.knowledgeStatus,
          estimatedRetention: prog.estimatedRetention,
          priorityScore: priority,
          recommendedDuration: estimateRevisionDuration(prog.knowledgeStatus, prog.difficulty)
        });
      }
    }

    revisionPlan.sort((a, b) => b.priorityScore - a.priorityScore);
    res.json(revisionPlan);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Submit retention check result
// @route   POST /api/progress/retention-check
const submitRetentionCheck = async (req, res) => {
  const { conceptId, score, timeTaken } = req.body;
  try {
    let progress = await StudentProgress.findOne({ userId: req.user._id, conceptId });
    if (!progress) return res.status(404).json({ message: "Progress not found" });

    // Process logic
    const result = processRetentionCheck(progress, score);
    progress = result.progress;
    
    progress.currentScore = score;
    progress.lastAssessmentDate = new Date();
    progress.estimatedRetention = score;
    
    if (!result.isMastered) {
      progress.knowledgeStatus = determineKnowledgeStatus(score);
    }
    
    progress.assessmentHistory.push({
      score,
      assessmentType: result.isMastered && progress.knowledgeStatus === "MASTERED" ? "LONG_TERM_CHECK" : "RETENTION_CHECK",
      timeTaken
    });

    await progress.save();
    res.json(progress);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Mark a concept as revised
// @route   POST /api/progress/revision-complete
const markRevisionComplete = async (req, res) => {
  const { conceptId } = req.body;
  try {
    let progress = await StudentProgress.findOne({ userId: req.user._id, conceptId });
    if (!progress) return res.status(404).json({ message: "Progress not found" });

    progress.revisionCount += 1;
    progress.lastRevisionDate = new Date();
    await progress.save();

    res.json(progress);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Submit post-revision assessment
// @route   POST /api/progress/post-revision-assessment
const submitPostRevision = async (req, res) => {
  const { conceptId, score, timeTaken } = req.body;
  try {
    let progress = await StudentProgress.findOne({ userId: req.user._id, conceptId });
    if (!progress) return res.status(404).json({ message: "Progress not found" });

    progress.currentScore = score;
    progress.lastAssessmentDate = new Date();
    progress.estimatedRetention = score;
    progress.knowledgeStatus = determineKnowledgeStatus(score);

    // Note: Post-revision success does NOT increase successfulRetentionChecks directly
    
    if (score >= 80) {
      // Schedule next check
      const nextReview = new Date();
      nextReview.setDate(nextReview.getDate() + 3);
      progress.nextReviewDate = nextReview;
    } else {
      progress.nextReviewDate = new Date(); // Immediately due
    }

    progress.assessmentHistory.push({
      score,
      assessmentType: "POST_REVISION",
      timeTaken
    });

    await progress.save();
    res.json(progress);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get details for a specific concept
// @route   GET /api/progress/:conceptId
const getConceptProgress = async (req, res) => {
  try {
    let progress = await StudentProgress.findOne({ userId: req.user._id, conceptId: req.params.conceptId }).populate("conceptId");
    if (!progress) return res.status(404).json({ message: "Progress not found" });

    // Update retention before serving
    if (progress.knowledgeStatus !== "MASTERED") {
      const daysPassed = getDaysSince(progress.lastAssessmentDate);
      progress.estimatedRetention = calculateEstimatedRetention(
        progress.currentScore, 
        progress.difficulty, 
        daysPassed, 
        progress.revisionCount
      );
      progress.knowledgeStatus = determineKnowledgeStatus(progress.estimatedRetention);
      await progress.save();
    }

    res.json({
      progress,
      recommendationReason: `Concept is at ${progress.knowledgeStatus} due to ${getDaysSince(progress.lastAssessmentDate)} days since last assessment. Previous score was ${progress.currentScore}%.`
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  initializeProgress,
  getDashboard,
  getRecommendations,
  submitRetentionCheck,
  markRevisionComplete,
  submitPostRevision,
  getConceptProgress
};
