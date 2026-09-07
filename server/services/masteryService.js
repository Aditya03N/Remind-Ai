/**
 * Process a retention check result.
 * @param {Object} progress - StudentProgress document
 * @param {Number} score - Actual quiz score
 */
const processRetentionCheck = (progress, score) => {
  let isMastered = false;

  if (score >= 80) {
    // Knowledge retained
    progress.successfulRetentionChecks += 1;
    
    // Check for mastery (3 consecutive checks >= 80)
    if (progress.successfulRetentionChecks >= 3) {
      isMastered = true;
      progress.knowledgeStatus = "MASTERED";
      // Schedule long-term check (e.g., 45 days)
      const nextReview = new Date();
      nextReview.setDate(nextReview.getDate() + 45);
      progress.nextReviewDate = nextReview;
    } else {
      // Schedule next normal check (e.g., 7 days)
      const nextReview = new Date();
      nextReview.setDate(nextReview.getDate() + 7);
      progress.nextReviewDate = nextReview;
    }
  } else {
    // Knowledge decay
    progress.successfulRetentionChecks = 0;
    
    if (progress.knowledgeStatus === "MASTERED") {
      // Demote from mastered if it was a long-term check that failed
      progress.knowledgeStatus = score < 60 ? "CRITICAL" : "MODERATE_RISK";
    }
    
    // Revise immediately
    progress.nextReviewDate = new Date(); 
  }
  
  return { progress, isMastered };
};

module.exports = {
  processRetentionCheck,
};
