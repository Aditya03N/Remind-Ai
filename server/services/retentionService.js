/**
 * Calculate the forgetting rate (lambda) based on difficulty.
 * Easy -> slower decay
 * Medium -> normal decay
 * Hard -> faster decay
 */
const getForgettingRate = (difficulty) => {
  switch (difficulty) {
    case "Easy":
      return 0.05; // slower decay
    case "Hard":
      return 0.15; // faster decay
    case "Medium":
    default:
      return 0.10; // normal decay
  }
};

/**
 * Calculates estimated retention using exponential decay:
 * retention = score * e^(-lambda * days)
 */
const calculateEstimatedRetention = (lastScore, difficulty, daysSinceAssessment, revisionCount) => {
  // Base lambda
  let lambda = getForgettingRate(difficulty);
  
  // Revisions reduce the forgetting rate (spaced repetition principle)
  // Each revision slows decay slightly, maxing out at some point
  if (revisionCount > 0) {
    lambda = lambda / (1 + (revisionCount * 0.2));
  }
  
  // Calculate decay
  const retention = lastScore * Math.exp(-lambda * daysSinceAssessment);
  
  // Ensure we don't return negative or impossibly low bounds if not realistic
  return Math.max(0, Math.round(retention));
};

/**
 * Determine the knowledge status based on estimated retention.
 */
const determineKnowledgeStatus = (estimatedRetention) => {
  if (estimatedRetention >= 80) return "STRONG";
  if (estimatedRetention >= 60) return "MODERATE_RISK";
  if (estimatedRetention >= 40) return "HIGH_RISK";
  return "CRITICAL";
};

/**
 * Calculates how many days have passed since the given date.
 */
const getDaysSince = (date) => {
  if (!date) return 0;
  const now = new Date();
  const diffTime = Math.abs(now - new Date(date));
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

module.exports = {
  calculateEstimatedRetention,
  determineKnowledgeStatus,
  getDaysSince,
};
