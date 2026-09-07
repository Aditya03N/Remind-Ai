const { GoogleGenerativeAI, SchemaType } = require("@google/generative-ai");

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.AI_API_KEY || "");

/**
 * Parses JSON robustly from AI response text
 */
const parseJSONSafely = (text) => {
  try {
    // Sometimes the model wraps JSON in markdown blocks
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
 * Returns an array of questions.
 */
const generateQuestions = async (topicName, studyMaterial, count = 5, existingQuestions = []) => {
  if (!process.env.AI_API_KEY) {
    throw new Error("AI API Key is not configured.");
  }

  const model = genAI.getGenerativeModel({
    model: "gemini-3.6-flash",
    generationConfig: {
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
    }
  });

  const materialContext = studyMaterial ? `Use the following study material as the primary source of truth. Make sure questions test understanding of this material:\n\n${studyMaterial}\n\n` : `Use your general knowledge about the topic.`;
  const avoidContext = existingQuestions.length > 0 ? `Avoid asking questions very similar to these existing ones:\n${existingQuestions.map(q => q.questionText).join("\n")}\n\n` : "";

  const prompt = `You are an expert tutor creating a quiz for a student on the topic: "${topicName}".
  
${materialContext}

${avoidContext}

Generate exactly ${count} distinct, high-quality multiple choice questions.
Each question MUST have exactly 4 options.
The correctOptionIndex MUST be 0, 1, 2, or 3.
Ensure the questions test conceptual understanding rather than just rote memorization.`;

  try {
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // In gemini-1.5-flash with JSON mode, the output should already be valid JSON
    const parsedData = parseJSONSafely(responseText);
    
    // Validate output structure
    if (!Array.isArray(parsedData) || parsedData.length === 0) {
      throw new Error("AI did not return an array of questions.");
    }
    
    // Enforce 4 options and valid correctOptionIndex
    const validatedQuestions = parsedData.map(q => {
      if (!Array.isArray(q.options) || q.options.length !== 4) {
        throw new Error("AI generated a question without exactly 4 options.");
      }
      if (typeof q.correctOptionIndex !== 'number' || q.correctOptionIndex < 0 || q.correctOptionIndex > 3) {
        q.correctOptionIndex = 0; // Fallback to safe value if AI makes a mistake
      }
      return {
        ...q,
        source: studyMaterial ? "ai_material" : "ai_topic"
      };
    });

    return validatedQuestions;
  } catch (error) {
    console.error("AI Generation Error:", error);
    throw new Error(`Failed to generate questions: ${error.message}`);
  }
};

module.exports = {
  generateQuestions,
};
