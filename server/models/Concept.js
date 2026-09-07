const mongoose = require("mongoose");

const conceptSchema = new mongoose.Schema({
  subjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Subject",
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  difficulty: {
    type: String,
    enum: ["Easy", "Medium", "Hard"],
    default: "Medium",
  },
  description: {
    type: String,
  },
  studyMaterial: {
    type: String,
  },
  baselineTaken: {
    type: Boolean,
    default: false,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  }
}, {
  timestamps: true,
});

const Concept = mongoose.model("Concept", conceptSchema);

module.exports = Concept;
