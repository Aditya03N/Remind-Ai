const { GoogleGenerativeAI, SchemaType } = require("@google/generative-ai");

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.AI_API_KEY || "");

// Prioritized model chain: gemini-3.5-flash is fast (~14s) and stable.
// If any model experiences high demand (503) or rate limits (429), it automatically fails over.
const CANDIDATE_MODELS = [
  process.env.AI_MODEL,
  "gemini-3.5-flash",
  "gemini-3.7-flash",
  "gemini-3.8-flash",
  "gemini-3.6-flash",
  "gemini-flash-latest"
].filter(Boolean);

const UNIQUE_MODELS = [...new Set(CANDIDATE_MODELS)];

/**
 * Executes a Gemini request with automatic retries and model failover
 * Handles [503 Service Unavailable] and [429 Too Many Requests] gracefully.
 */
async function generateWithFallback(prompt, generationConfig = {}) {
  let lastError = null;

  for (const modelName of UNIQUE_MODELS) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        console.log(`[aiService] Calling model "${modelName}" (attempt ${attempt})...`);
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig,
        });

        const result = await model.generateContent(prompt);
        console.log(`[aiService] Successfully received response from "${modelName}"`);
        return { result, modelName };
      } catch (err) {
        lastError = err;
        const msg = (err.message || "").toLowerCase();
        const isOverloaded = msg.includes("503") || msg.includes("high demand") || msg.includes("overloaded") || msg.includes("unavailable");
        const isRateLimited = msg.includes("429") || msg.includes("quota") || msg.includes("resourceexhausted");

        console.warn(`[aiService] Model "${modelName}" attempt ${attempt} error: ${err.message}`);

        if ((isOverloaded || isRateLimited) && attempt === 1) {
          // Wait 1.5 seconds and retry on same model once before failing over
          await new Promise((r) => setTimeout(r, 1500));
          continue;
        }

        // Move to next candidate model
        break;
      }
    }
  }

  throw new Error(`All available AI models failed. Last error: ${lastError?.message || "Unknown error"}`);
}

/**
 * Parses JSON robustly from AI response text
 */
const parseJSONSafely = (text) => {
  try {
    let cleanText = text.trim();
    if (cleanText.startsWith("```json")) {
      cleanText = cleanText.substring(7);
    } else if (cleanText.startsWith("```")) {
      cleanText = cleanText.substring(3);
    }
    if (cleanText.endsWith("```")) {
      cleanText = cleanText.substring(0, cleanText.length - 3);
    }
    return JSON.parse(cleanText.trim());
  } catch (err) {
    console.error("Failed to parse AI JSON response:", err);
    throw new Error("AI returned an invalid JSON response.");
  }
};

/**
 * Generates multiple-choice questions for a specific topic, optionally using study material.
 * Returns an array of questions. Defaults to 10 questions.
 */
const generateQuestions = async (topicName, studyMaterial, count = 10, existingQuestions = []) => {
  if (!process.env.AI_API_KEY) {
    throw new Error("AI API Key is not configured in server .env.");
  }

  const cleanMaterial = (studyMaterial || "").trim().slice(0, 25000);
  const hasMaterial = !!cleanMaterial;
  const materialContext = hasMaterial
    ? `CRITICAL MANDATORY INSTRUCTION - STRICT SOURCE GROUNDING:
You MUST base ALL questions, answer options, and explanations STRICTLY AND EXCLUSIVELY on the provided study material below.
Do NOT invent facts, use outside textbook knowledge, or ask about topics not present in this text.
Analyze the provided material thoroughly (specific terms, definitions, equations, steps, data points, and examples):

================ UPLOADED NOTES / MATERIAL START ================
${cleanMaterial}
================ UPLOADED NOTES / MATERIAL END ================`
    : `Use your general scientific/academic knowledge about the topic: "${topicName}".`;

  const avoidContext = existingQuestions.length > 0 
    ? `Avoid asking questions very similar to these existing ones:\n${existingQuestions.map(q => q.questionText).join("\n")}\n\n` 
    : "";

  const prompt = hasMaterial 
    ? `You are an expert examiner creating an active-recall assessment based STRICTLY on the student's uploaded notes for: "${topicName}".

${materialContext}

${avoidContext}

Generate exactly ${count} multiple choice questions.
STRICT RULES:
1. Every question must directly test concepts, facts, formulas, or mechanisms explicitly explained in the uploaded notes above.
2. Each question MUST have exactly 4 options.
3. The correctOptionIndex MUST be 0, 1, 2, or 3.
4. The explanation MUST reference or cite the specific point from the notes that confirms the answer.
5. Provide a good distribution of Easy, Medium, and Hard conceptual questions directly reflecting the document content.`
    : `You are an expert tutor creating an active-recall quiz for a student on the topic: "${topicName}".

${materialContext}

${avoidContext}

Generate exactly ${count} distinct, high-quality multiple choice questions.
Each question MUST have exactly 4 options.
The correctOptionIndex MUST be 0, 1, 2, or 3.
Ensure the questions test conceptual understanding, edge cases, and principles rather than just rote memorization.`;

  const generationConfig = {
    temperature: 0.7,
    responseMimeType: "application/json",
    responseSchema: {
      type: SchemaType.ARRAY,
      description: "A list of multiple choice questions.",
      items: {
        type: SchemaType.OBJECT,
        properties: {
          questionText: { type: SchemaType.STRING, description: "The multiple choice question text." },
          options: { 
            type: SchemaType.ARRAY, 
            items: { type: SchemaType.STRING },
            description: "Exactly 4 options for the multiple choice question."
          },
          correctOptionIndex: { type: SchemaType.INTEGER, description: "The index (0-3) of the correct option in the options array." },
          explanation: { type: SchemaType.STRING, description: "A brief explanation of why the correct option is correct." },
          difficulty: { type: SchemaType.STRING, description: "The difficulty level: Easy, Medium, or Hard." }
        },
        required: ["questionText", "options", "correctOptionIndex", "explanation", "difficulty"]
      }
    }
  };

  try {
    const { result } = await generateWithFallback(prompt, generationConfig);
    const responseText = result.response.text();
    const parsedData = parseJSONSafely(responseText);
    
    if (!Array.isArray(parsedData) || parsedData.length === 0) {
      throw new Error("AI did not return an array of questions.");
    }
    
    const validatedQuestions = parsedData.map(q => {
      if (!Array.isArray(q.options) || q.options.length !== 4) {
        throw new Error("AI generated a question without exactly 4 options.");
      }
      let correctIdx = typeof q.correctOptionIndex === 'number' ? q.correctOptionIndex : 0;
      if (correctIdx < 0 || correctIdx > 3) correctIdx = 0;
      
      return {
        questionText: q.questionText,
        options: q.options,
        correctOptionIndex: correctIdx,
        explanation: q.explanation || "Correct answer.",
        difficulty: q.difficulty || "Medium",
        source: studyMaterial ? "ai_material" : "ai_topic"
      };
    });

    return validatedQuestions;
  } catch (error) {
    console.error("AI Question Generation Error:", error);
    throw new Error(`Failed to generate questions: ${error.message}`);
  }
};

/**
 * Generates a concise, structured markdown summary for quick pre-quiz revision.
 */
const generateSummary = async (topicName, studyMaterial) => {
  if (!process.env.AI_API_KEY) {
    throw new Error("AI API Key is not configured in server .env.");
  }

  const cleanMaterial = (studyMaterial || "").trim().slice(0, 25000);
  const hasMaterial = !!cleanMaterial;
  const materialContext = hasMaterial
    ? `CRITICAL MANDATORY INSTRUCTION - STRICT SOURCE GROUNDING:
Analyze and synthesize the student's uploaded notes below STRICTLY without bringing in outside information:

================ UPLOADED NOTES START ================
${cleanMaterial}
================ UPLOADED NOTES END ================`
    : `Using your core domain knowledge for this topic: "${topicName}".\n\n`;

  const prompt = `You are a spaced-repetition study coach. Create a quick, high-yield summary for the topic "${topicName}" so the student can review it right before taking a quiz.

${materialContext}

Structure the summary cleanly with:
1. **Core Concept Overview** (1-2 clear sentences defining the topic based on the notes)
2. **Key Mechanisms & Principles** (3-4 concise bullet points extracted directly from the notes)
3. **Important Formulas, Rules & Definitions** (Key takeaways from the text)
4. **Common Pitfalls & Exam Traps** (2-3 bullet points)

Keep it concise, clear, and easy to read in 2 minutes.`;

  try {
    const { result } = await generateWithFallback(prompt, { temperature: 0.7 });
    return result.response.text();
  } catch (error) {
    console.error("AI Summary Generation Error:", error);
    throw new Error(`Failed to generate summary: ${error.message}`);
  }
};

module.exports = {
  generateQuestions,
  generateSummary,
};
