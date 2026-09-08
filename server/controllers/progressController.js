const StudentProgress = require("../models/StudentProgress");
const Concept = require("../models/Concept");
const Attempt = require("../models/Attempt");
const mongoose = require("mongoose");

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
      nextReviewDate: new Date(new Date().setDate(new Date().getDate() + (status === "STRONG" ? 3 : 1))),
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
// @route   GET /api/progress/dashboard
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

      if (knowledgeOverview[prog.knowledgeStatus] !== undefined) {
        knowledgeOverview[prog.knowledgeStatus]++;
      }

      const topicInfo = {
        progressId: prog._id,
        conceptId: prog.conceptId._id,
        name: prog.conceptId.name,
        subjectName: prog.conceptId.subjectId?.name || "Subject",
        difficulty: prog.difficulty,
        estimatedRetention: Math.round(prog.estimatedRetention),
        knowledgeStatus: prog.knowledgeStatus,
        revisionCount: prog.revisionCount,
        lastAssessmentDate: prog.lastAssessmentDate,
        manualReminderDate: prog.manualReminderDate || null
      };

      if (categorizedTopics[prog.knowledgeStatus]) {
        categorizedTopics[prog.knowledgeStatus].push(topicInfo);
      }

      if (prog.knowledgeStatus !== "MASTERED") {
        const priorityScore = calculatePriority(prog.estimatedRetention, prog.difficulty, prog.knowledgeStatus);
        const duration = estimateRevisionDuration(prog.difficulty, prog.knowledgeStatus);
        
        revisionPlan.push({
          progressId: prog._id,
          concept: prog.conceptId,
          estimatedRetention: Math.round(prog.estimatedRetention),
          status: prog.knowledgeStatus,
          priorityScore,
          recommendedDuration: duration,
          manualReminderDate: prog.manualReminderDate || null
        });
      }
    }

    revisionPlan.sort((a, b) => b.priorityScore - a.priorityScore);

    const overallHealth = progresses.length > 0 ? Math.round(totalRetention / progresses.length) : 0;
    const todayPriority = revisionPlan.length > 0 ? revisionPlan[0] : null;

    res.json({
      overallHealth,
      totalConcepts: progresses.length,
      todayPriority,
      knowledgeOverview,
      categorizedTopics,
      revisionPlan
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all learned concepts progress list
// @route   GET /api/progress/all
const getAllProgress = async (req, res) => {
  try {
    const progresses = await StudentProgress.find({ userId: req.user._id })
      .populate({
        path: "conceptId",
        populate: {
          path: "subjectId",
          select: "name"
        }
      })
      .sort({ updatedAt: -1 });

    const updatedProgresses = [];

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

      updatedProgresses.push(prog);
    }

    res.json(updatedProgresses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Set or clear manual reminder date
// @route   PUT /api/progress/:progressId/reminder
const setManualReminder = async (req, res) => {
  const { progressId } = req.params;
  const { manualReminderDate } = req.body;

  try {
    if (!mongoose.Types.ObjectId.isValid(progressId)) {
      return res.status(400).json({ message: "Invalid Progress ID" });
    }

    const progress = await StudentProgress.findOne({ _id: progressId, userId: req.user._id });
    if (!progress) return res.status(404).json({ message: "Progress record not found" });

    progress.manualReminderDate = manualReminderDate ? new Date(manualReminderDate) : null;
    await progress.save();

    res.json({
      message: manualReminderDate ? "Manual reminder scheduled successfully!" : "Reminder cleared.",
      progress
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Set manual reminder directly by concept ID
// @route   PUT /api/progress/concept/:conceptId/reminder
const setConceptManualReminder = async (req, res) => {
  const { conceptId } = req.params;
  const { manualReminderDate } = req.body;

  try {
    if (!mongoose.Types.ObjectId.isValid(conceptId)) {
      return res.status(400).json({ message: "Invalid Concept ID" });
    }

    let progress = await StudentProgress.findOne({ conceptId, userId: req.user._id });
    if (!progress) {
      const concept = await Concept.findById(conceptId);
      if (!concept) return res.status(404).json({ message: "Concept not found" });

      progress = await StudentProgress.create({
        userId: req.user._id,
        conceptId,
        initialScore: 70,
        currentScore: 70,
        estimatedRetention: 70,
        knowledgeStatus: "MODERATE_RISK",
        difficulty: concept.difficulty || "Medium",
        manualReminderDate: manualReminderDate ? new Date(manualReminderDate) : null
      });
    } else {
      progress.manualReminderDate = manualReminderDate ? new Date(manualReminderDate) : null;
      await progress.save();
    }

    res.json({
      message: manualReminderDate ? "Revision schedule updated!" : "Revision schedule removed.",
      progress
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get recommendations list
// @route   GET /api/progress/recommendations
const getRecommendations = async (req, res) => {
  try {
    const progresses = await StudentProgress.find({ userId: req.user._id }).populate({
      path: "conceptId",
      populate: {
        path: "subjectId",
        select: "name"
      }
    });

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

      if (prog.knowledgeStatus !== "MASTERED") {
        const priorityScore = calculatePriority(prog.estimatedRetention, prog.difficulty, prog.knowledgeStatus);
        const duration = estimateRevisionDuration(prog.difficulty, prog.knowledgeStatus);

        revisionPlan.push({
          progressId: prog._id,
          concept: prog.conceptId,
          estimatedRetention: Math.round(prog.estimatedRetention),
          status: prog.knowledgeStatus,
          priorityScore,
          recommendedDuration: `${duration.minMinutes}–${duration.maxMinutes} mins`,
          manualReminderDate: prog.manualReminderDate || null
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
const submitRetentionCheck = async (req, res) => {
  const { conceptId, score, timeTaken } = req.body;
  try {
    let progress = await StudentProgress.findOne({ userId: req.user._id, conceptId });
    if (!progress) return res.status(404).json({ message: "Progress not found" });

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
const submitPostRevision = async (req, res) => {
  const { conceptId, score, timeTaken } = req.body;
  try {
    let progress = await StudentProgress.findOne({ userId: req.user._id, conceptId });
    if (!progress) return res.status(404).json({ message: "Progress not found" });

    progress.currentScore = score;
    progress.lastAssessmentDate = new Date();
    progress.estimatedRetention = score;
    progress.knowledgeStatus = determineKnowledgeStatus(score);

    if (score >= 80) {
      const nextReview = new Date();
      nextReview.setDate(nextReview.getDate() + 3);
      progress.nextReviewDate = nextReview;
    } else {
      progress.nextReviewDate = new Date();
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
const getConceptProgress = async (req, res) => {
  try {
    let progress = await StudentProgress.findOne({ userId: req.user._id, conceptId: req.params.conceptId }).populate("conceptId");
    if (!progress) return res.status(404).json({ message: "Progress not found" });

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
  getAllProgress,
  setManualReminder,
  setConceptManualReminder,
  getRecommendations,
  submitRetentionCheck,
  markRevisionComplete,
  submitPostRevision,
  getConceptProgress
};
