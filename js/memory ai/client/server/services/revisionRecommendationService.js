const { getDaysSince, determineKnowledgeStatus } = require("./retentionService");

/**
 * Calculate revision priority score.
 * priority = riskScore + difficultyWeight + overdueDaysWeight + weakPerformanceWeight
 */
const calculatePriority = (estimatedRetention, difficulty, daysSinceAssessment, previousScore) => {
  // 1. Risk Score: lower retention -> higher risk score
  let riskScore = 100 - estimatedRetention;

  // 2. Difficulty Weight
  let difficultyWeight = 0;
  if (difficulty === "Hard") difficultyWeight = 20;
  if (difficulty === "Medium") difficultyWeight = 10;

  // 3. Overdue Days Weight (cap at 30 to avoid blowing up)
  let overdueDaysWeight = Math.min(daysSinceAssessment, 30) * 1.5;

  // 4. Weak Performance Weight
  let weakPerformanceWeight = 0;
  if (previousScore < 60) {
    weakPerformanceWeight = 25;
  } else if (previousScore < 80) {
    weakPerformanceWeight = 10;
  }

  return Math.round(riskScore + difficultyWeight + overdueDaysWeight + weakPerformanceWeight);
};

/**
 * Estimate required revision duration based on status and difficulty.
 */
const estimateRevisionDuration = (status, difficulty) => {
  if (status === "STRONG" || status === "MASTERED") {
    return "No revision required";
  }

  let min = 5;
  let max = 10;

  if (status === "MODERATE_RISK") {
    min = 5; max = 10;
  } else if (status === "HIGH_RISK") {
    min = 10; max = 15;
  } else if (status === "CRITICAL") {
    min = 15; max = 20;
  }

  // Adjust for difficulty
  if (difficulty === "Hard") {
    min += 5; max += 5;
  }

  return `${min}–${max} minutes`;
};

module.exports = {
  calculatePriority,
  estimateRevisionDuration,
};
