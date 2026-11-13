/**
 * Firebase Cloud Function for NaCCA Curriculum Document Ingestion & Expansion using Gemini API
 */
const { onRequest } = require("firebase-functions/v2/https");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { GoogleGenAI } = require("@google/genai");

initializeApp();
const db = getFirestore();

const ai = new GoogleGenAI();

const ITEM_BANK_SCHEMA = {
  type: "OBJECT",
  properties: {
    subject_id: { type: "STRING" },
    grade_level: { type: "STRING" },
    strand: { type: "STRING" },
    sub_strand: { type: "STRING" },
    indicator_code: { type: "STRING" },
    quest_id: { type: "STRING" },
    mechanic_type: { type: "STRING", enum: ["MULTIPLE_CHOICE", "PUZZLE", "SIMULATION", "SPEED_DUEL"] },
    narrative_hook: { type: "STRING" },
    questions: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          id: { type: "STRING" },
          prompt: { type: "STRING" },
          options: { type: "ARRAY", items: { type: "STRING" } },
          correct_index: { type: "INTEGER" },
          misconception_map: {
            type: "OBJECT",
            additionalProperties: { type: "STRING" }
          },
          hints: { type: "ARRAY", items: { type: "STRING" } }
        },
        required: ["id", "prompt", "options", "correct_index", "misconception_map", "hints"]
      }
    }
  },
  required: ["subject_id", "grade_level", "strand", "sub_strand", "indicator_code", "quest_id", "mechanic_type", "narrative_hook", "questions"]
};

exports.expandCurriculumDocument = onRequest(async (req, res) => {
  try {
    const { documentText } = req.body;

    if (!documentText) {
      return res.status(400).json({ error: "Missing documentText in request body" });
    }

    const systemInstruction = `
You are an expert curriculum developer and AI parser for the Ghana Education Service (GES) NaCCA Standards-Based Curriculum.
Your task is to analyze raw textbook/TLM document text and AUTOMATICALLY DETERMINE:
1. Grade Level / Class (e.g., JHS_1, JHS_2)
2. Subject ID (e.g., JHS_COMPUTING, JHS_SCIENCE)
3. Strand / Main Topic
4. Sub-strand / Subsection
5. Indicator Code (e.g., B7.1.1.1)

Then generate a gamified item bank wrapped in a culturally authentic Ghanaian story/problem (e.g. farming in Sunyani, trading in Kejetia, solar energy in Tamale).
Generate 3 to 5 tiered questions with diagnostic misconception mapping for every distractor and a 3-step progressive hint tree.
Strictly output valid JSON matching the schema.
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Raw Curriculum / Textbook Content:\n\"\"\"${documentText}\"\"\"`,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: ITEM_BANK_SCHEMA,
        temperature: 0.2
      }
    });

    const parsedItemBank = JSON.parse(response.text());

    await db.collection("item_banks").doc(parsedItemBank.quest_id).set({
      ...parsedItemBank,
      status: "PENDING_REVIEW",
      createdAt: new Date().toISOString()
    });

    return res.status(200).json({ success: true, data: parsedItemBank });
  } catch (error) {
    console.error("Error expanding document:", error);
    return res.status(500).json({ success: error.message });
  }
});
