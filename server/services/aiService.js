const { GoogleGenerativeAI, SchemaType } = require("@google/generative-ai");

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.AI_API_KEY || "");

// Prioritized model chain: gemini-3.5-flash is the fastest and most capable.
const CANDIDATE_MODELS = [
  process.env.AI_MODEL,
  "gemini-3.5-flash",
  "gemini-2.5-flash",
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
          await new Promise((r) => setTimeout(r, 800));
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

  const avoidContext = existingQuestions.length > 0 
    ? `\nAvoid repeating these questions:\n${existingQuestions.map(q => q.questionText).join("\n")}\n` 
    : "";

  // When no notes: use a short, direct prompt for fast generation
  // When notes provided: use the full detailed prompt for accuracy
  let prompt;
  if (hasMaterial) {
    prompt = `You are an expert examiner. Generate exactly ${count} MCQs based STRICTLY on the uploaded notes for "${topicName}".

STRICT SOURCE GROUNDING — base ALL questions exclusively on this material:

${cleanMaterial}
${avoidContext}
Rules: 4 options each, correctOptionIndex 0-3, explanation must cite the notes, mix Easy/Medium/Hard.`;
  } else {
    prompt = `Generate ${count} MCQs on "${topicName}". 4 options each, correctOptionIndex 0-3, brief explanation, mix Easy/Medium/Hard.${avoidContext}`;
  }

  const generationConfig = {
    temperature: hasMaterial ? 0.5 : 0.8,
    responseMimeType: "application/json",
    responseSchema: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          questionText: { type: SchemaType.STRING },
          options: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
          correctOptionIndex: { type: SchemaType.INTEGER },
          explanation: { type: SchemaType.STRING },
          difficulty: { type: SchemaType.STRING }
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

  let prompt;
  if (hasMaterial) {
    prompt = `Create a quick pre-quiz summary for "${topicName}" based STRICTLY on these notes:

${cleanMaterial}

Structure: 1) Core Overview (1-2 sentences) 2) Key Principles (3-4 bullets) 3) Important Formulas/Definitions 4) Common Pitfalls (2-3 bullets). Keep it under 2 min read.`;
  } else {
    prompt = `Create a concise study summary for "${topicName}". Cover: key concepts, important principles, formulas/definitions, and common pitfalls. Keep it under 2 min read.`;
  }

  try {
    const { result } = await generateWithFallback(prompt, { temperature: 0.5 });
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
