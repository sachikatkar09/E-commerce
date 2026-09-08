const { GoogleGenerativeAI } = require("@google/generative-ai");

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const EMBEDDING_MODEL = process.env.GEMINI_EMBEDDING_MODEL || "text-embedding-004";

let genAI = null;

const getGenAI = () => {
  if (!genAI && GEMINI_API_KEY && GEMINI_API_KEY !== "YOUR_GEMINI_API_KEY_HERE") {
    genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  }
  return genAI;
};

const generateEmbedding = async (text) => {
  const client = getGenAI();
  if (!client) {
    throw new Error("Gemini API key not configured");
  }
  try {
    const model = client.getGenerativeModel({ model: EMBEDDING_MODEL });
    const result = await model.embedContent(text);
    return result.embedding.values;
  } catch (error) {
    console.error("[Embedding] Gemini embedding error:", error.message);
    throw error;
  }
};

const generateBatchEmbeddings = async (texts) => {
  const client = getGenAI();
  if (!client) {
    throw new Error("Gemini API key not configured");
  }
  try {
    const model = client.getGenerativeModel({ model: EMBEDDING_MODEL });
    const result = await model.batchEmbedContents({
      requests: texts.map((text) => ({
        content: { role: "user", parts: [{ text }] },
      })),
    });
    return result.embeddings.map((e) => e.values);
  } catch (error) {
    console.error("[Embedding] Gemini batch embedding error:", error.message);
    throw error;
  }
};

module.exports = { generateEmbedding, generateBatchEmbeddings };
