const { getDaysSince, determineKnowledgeStatus } = require("./retentionService");

/**
 * Calculate revision priority score.
 * Higher score = more urgently needs revision.
 * @param {number} estimatedRetention - Current estimated retention percentage
 * @param {string} difficulty - "Easy", "Medium", or "Hard"
 * @param {string} knowledgeStatus - "STRONG", "MODERATE_RISK", "HIGH_RISK", "CRITICAL"
 */
const calculatePriority = (estimatedRetention, difficulty, knowledgeStatus) => {
  // 1. Risk Score: lower retention -> higher risk score
  let riskScore = 100 - estimatedRetention;

  // 2. Difficulty Weight
  let difficultyWeight = 0;
  if (difficulty === "Hard") difficultyWeight = 20;
  else if (difficulty === "Medium") difficultyWeight = 10;

  // 3. Status Weight
  let statusWeight = 0;
  if (knowledgeStatus === "CRITICAL") statusWeight = 30;
  else if (knowledgeStatus === "HIGH_RISK") statusWeight = 20;
  else if (knowledgeStatus === "MODERATE_RISK") statusWeight = 10;

  return Math.round(riskScore + difficultyWeight + statusWeight);
};

/**
 * Estimate required revision duration based on difficulty and status.
 * @param {string} difficulty - "Easy", "Medium", or "Hard"
 * @param {string} status - Knowledge status string
 * @returns {{ minMinutes: number, maxMinutes: number } | string}
 */
const estimateRevisionDuration = (difficulty, status) => {
  if (status === "STRONG" || status === "MASTERED") {
    return { minMinutes: 0, maxMinutes: 0 };
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

  return { minMinutes: min, maxMinutes: max };
};

module.exports = {
  calculatePriority,
  estimateRevisionDuration,
};

