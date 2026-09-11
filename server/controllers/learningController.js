const mongoose = require("mongoose");
const multer = require("multer");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");
const zlib = require("zlib");
const Subject = require("../models/Subject");
const Concept = require("../models/Concept");
const Quiz = require("../models/Quiz");
const Attempt = require("../models/Attempt");
const StudentProgress = require("../models/StudentProgress");
const { generateQuestions, generateSummary } = require("../services/aiService");
const { determineKnowledgeStatus } = require("../services/retentionService");

// Configure Multer for in-memory file uploads with 5MB max size
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// === SUBJECTS ===
const createSubject = async (req, res) => {
  const { name, description } = req.body;
  try {
    const subject = await Subject.create({
      name,
      description,
      createdBy: req.user._id,
    });
    res.status(201).json(subject);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getSubjects = async (req, res) => {
  try {
    const subjects = await Subject.find({ createdBy: req.user._id });
    res.json(subjects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteSubject = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid Subject ID" });
    }

    const subject = await Subject.findOne({ _id: id, createdBy: req.user._id });
    if (!subject) return res.status(404).json({ message: "Subject not found" });

    // Find all concepts under this subject
    const concepts = await Concept.find({ subjectId: id });
    const conceptIds = concepts.map(c => c._id);

    // Delete associated quizzes, student progress, attempts
    await Quiz.deleteMany({ conceptId: { $in: conceptIds } });
    await StudentProgress.deleteMany({ conceptId: { $in: conceptIds } });
    await Attempt.deleteMany({ conceptId: { $in: conceptIds } });
    await Concept.deleteMany({ subjectId: id });

    // Delete subject
    await Subject.deleteOne({ _id: id });

    res.json({ message: "Subject and associated concepts deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// === CONCEPTS ===
const createConcept = async (req, res) => {
  const { subjectId, name, difficulty, description, studyMaterial } = req.body;
  try {
    const concept = await Concept.create({
      subjectId,
      name,
      difficulty: difficulty || "Medium",
      description,
      studyMaterial: studyMaterial || "",
      createdBy: req.user._id,
    });
    res.status(201).json(concept);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getConceptsBySubject = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.subjectId)) {
      return res.status(400).json({ message: "Invalid Subject ID" });
    }
    const concepts = await Concept.find({ subjectId: req.params.subjectId, createdBy: req.user._id });
    
    // Also attach quiz count / baseline info for each concept
    const enhancedConcepts = await Promise.all(
      concepts.map(async (c) => {
        const quiz = await Quiz.findOne({ conceptId: c._id });
        const progress = await StudentProgress.findOne({ userId: req.user._id, conceptId: c._id });
        return {
          ...c.toObject(),
          quizCount: quiz ? quiz.questions.length : 0,
          hasQuiz: !!quiz && quiz.questions.length > 0,
          baselineTaken: !!progress,
          currentRetention: progress ? progress.estimatedRetention : null,
          knowledgeStatus: progress ? progress.knowledgeStatus : null
        };
      })
    );

    res.json(enhancedConcepts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getConceptById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid Concept ID format." });
    }
    const concept = await Concept.findById(req.params.id).populate("subjectId", "name description");
    if (!concept) return res.status(404).json({ message: "Concept not found" });

    const quiz = await Quiz.findOne({ conceptId: concept._id });
    const progress = await StudentProgress.findOne({ userId: req.user._id, conceptId: concept._id });

    res.json({
      ...concept.toObject(),
      quiz: quiz || null,
      quizCount: quiz ? quiz.questions.length : 0,
      progress: progress || null
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteConcept = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid Concept ID" });
    }

    const concept = await Concept.findOne({ _id: id, createdBy: req.user._id });
    if (!concept) return res.status(404).json({ message: "Concept not found" });

    // Delete associated quizzes, student progress, attempts
    await Quiz.deleteMany({ conceptId: id });
    await StudentProgress.deleteMany({ conceptId: id });
    await Attempt.deleteMany({ conceptId: id });

    // Delete concept
    await Concept.deleteOne({ _id: id });

    res.json({ message: "Concept deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const saveStudyMaterial = async (req, res) => {
  const { studyMaterial } = req.body;
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.conceptId)) {
      return res.status(400).json({ message: "Invalid Concept ID format." });
    }
    const concept = await Concept.findOneAndUpdate(
      { _id: req.params.conceptId, createdBy: req.user._id },
      { studyMaterial },
      { new: true }
    );
    if (!concept) return res.status(404).json({ message: "Concept not found" });
    res.json(concept);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Robust universal PDF text extraction supporting pdf-parse v2, v1, and fallback stream parsing
async function extractTextFromPDF(buffer) {
  // 1. Try PDFParse v2 class API
  if (pdfParse && pdfParse.PDFParse) {
    try {
      const parser = new pdfParse.PDFParse({ data: buffer });
      const result = await parser.getText();
      if (result && result.text && result.text.trim().length > 0) {
        return result.text;
      }
    } catch (e) {
      console.warn("PDFParse v2 error:", e.message);
    }
  }

  // 2. Try v1 direct function call
  if (typeof pdfParse === "function") {
    try {
      const result = await pdfParse(buffer);
      if (result && result.text && result.text.trim().length > 0) {
        return result.text;
      }
    } catch (e) {
      console.warn("pdfParse v1 function error:", e.message);
    }
  }

  // 3. Try default export if present
  if (pdfParse && pdfParse.default && typeof pdfParse.default === "function") {
    try {
      const result = await pdfParse.default(buffer);
      if (result && result.text && result.text.trim().length > 0) {
        return result.text;
      }
    } catch (e) {
      console.warn("pdfParse.default error:", e.message);
    }
  }

  // 4. Fallback text stream extraction from uncompressed / standard PDF objects
  try {
    const raw = buffer.toString("latin1");
    const textMatches = [];
    const textBlocks = raw.match(/BT[\s\S]*?ET/g) || [];
    for (const block of textBlocks) {
      const lines = block.match(/\((.*?)\)\s*T[jJ]/g);
      if (lines) {
        const joined = lines.map(l => l.replace(/^[(\s]+/, "").replace(/[)\s]+T[jJ]$/, "")).join(" ");
        textMatches.push(joined);
      }
    }
    if (textMatches.length > 0) {
      return textMatches.join("\n");
    }
  } catch (rawErr) {
    console.warn("Raw PDF stream parse error:", rawErr.message);
  }

  return "";
}

// Robust Word (.docx / .doc) text extraction
async function extractTextFromWordDocument(buffer) {
  // 1. Primary: Use mammoth to extract clean text from standard .docx (ZIP archive)
  try {
    const result = await mammoth.extractRawText({ buffer });
    if (result && result.value && result.value.trim().length > 0) {
      return result.value;
    }
  } catch (err) {
    console.warn("mammoth docx extraction error:", err.message);
  }

  // 2. Fallback for .docx: Parse word/document.xml directly from ZIP stream if mammoth fails
  try {
    let offset = 0;
    const signature = Buffer.from([0x50, 0x4b, 0x03, 0x04]);
    while ((offset = buffer.indexOf(signature, offset)) !== -1) {
      if (offset + 30 > buffer.length) break;
      const fnLen = buffer.readUInt16LE(offset + 26);
      const extraLen = buffer.readUInt16LE(offset + 28);
      const fn = buffer.slice(offset + 30, offset + 30 + fnLen).toString("utf-8");
      const dataOffset = offset + 30 + fnLen + extraLen;
      if (fn === "word/document.xml") {
        const inflated = zlib.inflateRawSync(buffer.slice(dataOffset));
        const xml = inflated.toString("utf-8");
        const matches = xml.match(/<w:t[^>]*>(.*?)<\/w:t>/gi) || [];
        const text = matches.map((m) => m.replace(/<[^>]+>/g, "")).join(" ").trim();
        if (text.length > 0) return text;
      }
      offset += 4;
    }
  } catch (zipErr) {
    console.warn("Zip document.xml extraction error:", zipErr.message);
  }

  // 3. Fallback for legacy binary Word 97-2003 (.doc) files (OLE2 format)
  try {
    const str16 = buffer.toString("utf16le").replace(/[^\x20-\x7E\r\n\t]/g, " ");
    const chunks16 = str16.match(/[a-zA-Z0-9\s.,?!;:()'\/\-]{15,}/g) || [];
    const text16 = chunks16
      .filter((c) => !c.includes("Microsoft") && !c.includes("Word.Document") && !c.includes("Normal.dot"))
      .join("\n")
      .replace(/[ ]{2,}/g, " ")
      .trim();

    const str8 = buffer.toString("latin1").replace(/[^\x20-\x7E\r\n\t]/g, " ");
    const chunks8 = str8.match(/[a-zA-Z0-9\s.,?!;:()'\/\-]{15,}/g) || [];
    const text8 = chunks8
      .filter((c) => !c.includes("Microsoft") && !c.includes("Word.Document") && !c.includes("Normal.dot"))
      .join("\n")
      .replace(/[ ]{2,}/g, " ")
      .trim();

    const legacyText = text16.length > text8.length ? text16 : text8;
    if (legacyText && legacyText.length > 20) {
      return legacyText;
    }
  } catch (legacyErr) {
    console.warn("Legacy .doc extraction error:", legacyErr.message);
  }

  return "";
}

// Upload & extract text from ANY document: PDF, DOCX, DOC, TXT, MD, RTF, CSV, JSON, HTML, etc.
const uploadNotesDocument = async (req, res) => {
  const { conceptId } = req.params;
  try {
    if (!mongoose.Types.ObjectId.isValid(conceptId)) {
      return res.status(400).json({ message: "Invalid Concept ID format." });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No document attached. Please select a file (Word, PDF, TXT, MD under 5MB)." });
    }

    const concept = await Concept.findById(conceptId);
    if (!concept) return res.status(404).json({ message: "Concept not found." });

    const fileName = req.file.originalname || "notes-doc";
    const fileNameLower = fileName.toLowerCase();
    const mimeType = req.file.mimetype || "";
    
    // Sample up to 64KB to inspect file headers and detect invalid login redirects
    const bufferStringSample = req.file.buffer.slice(0, Math.min(65536, req.file.buffer.length)).toString("utf-8");

    // 1. Guard against Microsoft OneDrive login or OAuth redirect pages downloaded by mistake
    const isLoginOrHtmlPage =
      (bufferStringSample.includes("login.live.com") ||
       bufferStringSample.includes("login.microsoftonline.com") ||
       bufferStringSample.includes("msauth.net") ||
       bufferStringSample.includes("ServerData = {") ||
       bufferStringSample.includes("<!-- Copyright (C) Microsoft Corporation") ||
       bufferStringSample.includes("<title>OneDrive</title>") ||
       bufferStringSample.includes("accounts.google.com") ||
       bufferStringSample.includes("Microsoft account requires JavaScript")
      ) && (
       bufferStringSample.includes("<html") ||
       bufferStringSample.includes("<!DOCTYPE") ||
       bufferStringSample.includes("<head") ||
       bufferStringSample.includes("<script")
      );

    if (isLoginOrHtmlPage) {
      return res.status(400).json({
        message: "The uploaded file is a Microsoft/OneDrive Login Webpage, not actual study notes. This happens when a file is saved from OneDrive web without logging in, or when using 'Save Link As'. Please open OneDrive, make sure you are signed in, download the actual PDF/Word file to your computer, and upload that file."
      });
    }

    // 2. Detect if an HTML webpage is disguised with a .pdf extension
    const isPDF = mimeType.includes("pdf") || fileNameLower.endsWith(".pdf") || req.file.buffer.slice(0, 4).toString() === "%PDF";
    if (fileNameLower.endsWith(".pdf") && !req.file.buffer.slice(0, 5).toString().includes("%PDF") && (bufferStringSample.trim().startsWith("<!DOCTYPE") || bufferStringSample.trim().startsWith("<html") || bufferStringSample.trim().startsWith("<!--"))) {
      return res.status(400).json({
        message: `"${fileName}" is an HTML webpage renamed as .pdf (not a valid PDF document). Please open the file and export/download it as a real PDF.`
      });
    }

    const isWord =
      fileNameLower.endsWith(".docx") ||
      fileNameLower.endsWith(".doc") ||
      mimeType.includes("word") ||
      mimeType.includes("officedocument") ||
      (req.file.buffer.slice(0, 4).toString() === "PK\x03\x04" && !isPDF);

    let extractedText = "";

    // 3. Extract text based on file format
    if (isPDF) {
      extractedText = await extractTextFromPDF(req.file.buffer);
      if (!extractedText || extractedText.trim().length < 5) {
        return res.status(400).json({
          message: `Unable to extract readable text from PDF "${fileName}". Please ensure the PDF contains selectable text (not scanned images/photos), or copy and paste the notes into the notes editor.`
        });
      }
    } else if (isWord) {
      extractedText = await extractTextFromWordDocument(req.file.buffer);
      if (!extractedText || extractedText.trim().length < 5) {
        return res.status(400).json({
          message: `Unable to extract text from Word document "${fileName}". If this file was downloaded from Word Online/OneDrive, make sure it is a downloaded document and not an HTML link. You can also export as PDF or copy-paste text directly.`
        });
      }
    } else {
      // Plain text, markdown, CSV, JSON, RTF, code files
      extractedText = req.file.buffer.toString("utf-8");

      // If HTML file, strip markup tags
      if (fileNameLower.endsWith(".html") || fileNameLower.endsWith(".htm") || extractedText.trim().startsWith("<")) {
        extractedText = extractedText.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ");
        extractedText = extractedText.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ");
        extractedText = extractedText.replace(/<[^>]+>/g, " ");
      }
    }

    // Clean up non-printable binary characters & excessive whitespace
    extractedText = extractedText.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, " ");
    extractedText = extractedText.replace(/\r\n/g, "\n").replace(/[ \t]+/g, " ").replace(/\n\s*\n+/g, "\n\n").trim();

    if (!extractedText || extractedText.length < 5) {
      return res.status(400).json({
        message: `Unable to extract readable text from "${fileName}". Please ensure the file contains readable text notes, not scanned images or binary data.`
      });
    }

    concept.studyMaterial = extractedText;
    concept.notesFileName = fileName;
    await concept.save();

    res.json({
      message: `"${fileName}" (${extractedText.length} characters) extracted and saved!`,
      fileName,
      studyMaterial: extractedText,
      characterCount: extractedText.length,
      concept
    });
  } catch (error) {
    console.error("Document Upload Error:", error);
    res.status(500).json({ message: "Failed to process document: " + error.message });
  }
};

// Clear notes / study material from a concept
const clearStudyMaterial = async (req, res) => {
  const { conceptId } = req.params;
  try {
    if (!mongoose.Types.ObjectId.isValid(conceptId)) {
      return res.status(400).json({ message: "Invalid Concept ID format." });
    }
    const concept = await Concept.findOneAndUpdate(
      { _id: conceptId, createdBy: req.user._id },
      { studyMaterial: "", notesFileName: "" },
      { new: true }
    );
    if (!concept) return res.status(404).json({ message: "Concept not found" });
    res.json({ message: "Study notes cleared successfully.", concept });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// === AI GENERATION ===
const generateAIQuestions = async (req, res) => {
  const { conceptId, count = 10, studyMaterial } = req.body;
  
  try {
    if (!mongoose.Types.ObjectId.isValid(conceptId)) {
      return res.status(400).json({ message: "Invalid Concept ID format." });
    }
    const concept = await Concept.findById(conceptId);
    if (!concept) return res.status(404).json({ message: "Concept not found" });

    let materialToUse = (typeof studyMaterial === "string" && studyMaterial.trim().length > 0)
      ? studyMaterial.trim()
      : (concept.studyMaterial || "");

    // Purge corrupted Microsoft login redirects from previous uploads if still in database
    if (
      materialToUse && (
        materialToUse.includes("login.live.com") ||
        materialToUse.includes("login.microsoftonline.com") ||
        materialToUse.includes("Copyright (C) Microsoft Corporation") ||
        materialToUse.includes("ServerData = {")
      )
    ) {
      console.warn("Purging corrupted Microsoft login redirect from concept studyMaterial.");
      materialToUse = "";
      concept.studyMaterial = "";
      concept.notesFileName = "";
      await concept.save();
    }

    // Only update concept studyMaterial if valid new non-empty text was provided
    if (typeof studyMaterial === "string" && studyMaterial.trim().length > 0 && studyMaterial.trim() !== concept.studyMaterial) {
      concept.studyMaterial = materialToUse;
      await concept.save();
    }

    // Find existing questions to avoid duplication
    let existingQuiz = await Quiz.findOne({ conceptId });
    const existingQuestions = existingQuiz ? existingQuiz.questions : [];

    // Call AI Service (generates 10 MCQs strictly grounded in syllabus & notes)
    const newQuestions = await generateQuestions(concept.name, materialToUse, count, existingQuestions);

    if (existingQuiz) {
      existingQuiz.questions = newQuestions;
      await existingQuiz.save();
    } else {
      existingQuiz = await Quiz.create({
        conceptId,
        title: `${concept.name} Assessment Quiz`,
        questions: newQuestions,
        createdBy: req.user._id
      });
    }

    res.json({
      message: `Successfully generated ${newQuestions.length} questions.`,
      quiz: existingQuiz,
      questionsCount: newQuestions.length
    });
  } catch (error) {
    console.error("AI Generation Error:", error);
    res.status(500).json({ message: error.message });
  }
};

const generateAISummary = async (req, res) => {
  const { conceptId, studyMaterial } = req.body;
  
  try {
    if (!mongoose.Types.ObjectId.isValid(conceptId)) {
      return res.status(400).json({ message: "Invalid Concept ID format." });
    }
    const concept = await Concept.findById(conceptId);
    if (!concept) return res.status(404).json({ message: "Concept not found" });

    let materialToUse = (typeof studyMaterial === "string" && studyMaterial.trim().length > 0)
      ? studyMaterial.trim()
      : (concept.studyMaterial || "");

    // Purge corrupted Microsoft login redirects from previous uploads if still in database
    if (
      materialToUse && (
        materialToUse.includes("login.live.com") ||
        materialToUse.includes("login.microsoftonline.com") ||
        materialToUse.includes("Copyright (C) Microsoft Corporation") ||
        materialToUse.includes("ServerData = {")
      )
    ) {
      console.warn("Purging corrupted Microsoft login redirect from concept studyMaterial.");
      materialToUse = "";
      concept.studyMaterial = "";
      concept.notesFileName = "";
      await concept.save();
    }

    const summary = await generateSummary(concept.name, materialToUse);
    
    concept.aiSummary = summary;
    if (typeof studyMaterial === "string" && studyMaterial.trim().length > 0 && studyMaterial.trim() !== concept.studyMaterial) {
      concept.studyMaterial = materialToUse;
    }
    await concept.save();

    res.json({
      summary,
      concept
    });
  } catch (error) {
    console.error("AI Summary Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// === QUIZZES ===
const createQuiz = async (req, res) => {
  const { conceptId, title, questions } = req.body;
  try {
    let quiz = await Quiz.findOne({ conceptId });
    if (quiz) {
      quiz.questions = questions;
      quiz.title = title || quiz.title;
      await quiz.save();
    } else {
      quiz = await Quiz.create({
        conceptId,
        title: title || "Concept Quiz",
        questions,
        createdBy: req.user._id,
      });
    }
    res.status(201).json(quiz);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getQuizByConcept = async (req, res) => {
  try {
    const quiz = await Quiz.findOne({ conceptId: req.params.conceptId });
    if (!quiz) return res.status(404).json({ message: "Quiz not found for this concept" });
    res.json(quiz);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// === ATTEMPTS ===
const saveAttempt = async (req, res) => {
  const { quizId, conceptId, score, totalQuestions, assessmentType, timeTaken } = req.body;
  
  try {
    const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
    
    const attempt = await Attempt.create({
      userId: req.user._id,
      quizId,
      conceptId,
      score,
      totalQuestions,
      percentage,
      assessmentType: assessmentType || "INITIAL",
      timeTaken
    });

    // Automatically initialize or update StudentProgress
    let progress = await StudentProgress.findOne({ userId: req.user._id, conceptId });
    const status = determineKnowledgeStatus(percentage);

    if (!progress) {
      const concept = await Concept.findById(conceptId);
      progress = await StudentProgress.create({
        userId: req.user._id,
        conceptId,
        initialScore: percentage,
        currentScore: percentage,
        estimatedRetention: percentage,
        knowledgeStatus: status,
        difficulty: concept?.difficulty || "Medium",
        nextReviewDate: new Date(new Date().setDate(new Date().getDate() + (status === "STRONG" ? 3 : 1))),
        assessmentHistory: [{
          score: percentage,
          assessmentType: assessmentType || "INITIAL",
          timeTaken
        }]
      });
    } else {
      progress.currentScore = percentage;
      progress.estimatedRetention = percentage;
      progress.lastAssessmentDate = new Date();
      if (progress.knowledgeStatus !== "MASTERED") {
        progress.knowledgeStatus = status;
      }
      progress.assessmentHistory.push({
        score: percentage,
        assessmentType: assessmentType || "RETENTION_CHECK",
        timeTaken
      });
      await progress.save();
    }

    res.status(201).json({ attempt, progress });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  upload,
  createSubject,
  getSubjects,
  deleteSubject,
  createConcept,
  getConceptsBySubject,
  getConceptById,
  deleteConcept,
  saveStudyMaterial,
  clearStudyMaterial,
  uploadNotesDocument,
  generateAIQuestions,
  generateAISummary,
  createQuiz,
  getQuizByConcept,
  saveAttempt,
};
