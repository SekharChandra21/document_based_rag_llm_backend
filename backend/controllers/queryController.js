import Embedding from "../models/Embedding.js";
import { generateEmbedding } from "../utils/generateEmbedding.js";
import { cosineSimilarity } from "../utils/similarity.js";
import Groq from "groq-sdk";

export const queryRAG = async (req, res) => {
  try {
    const { question } = req.body;

    // Initialize Groq client
    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });

    // 1. Convert question → embedding
    const queryEmbedding = await generateEmbedding(question);

    // 2. Get stored embeddings
    const allDocs = await Embedding.find();

    // 3. Calculate similarity
    const scored = allDocs.map(doc => ({
      text: doc.text,
      trial_id: doc.trial_id,
      score: cosineSimilarity(queryEmbedding, doc.embedding)
    }));

    // 4. Get top chunks
    const topChunks = scored
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    // 🚨 If no data
    if (topChunks.length === 0) {
      return res.json({
        answer: "No relevant information found.",
        sources: []
      });
    }

    // 5. Build context
    const context = topChunks.map(c => c.text).join("\n\n");

    // 6. Call LLM (Groq)
    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant. Answer ONLY using the given context."
        },
        {
          role: "user",
          content: `
            Context:
            ${context}

            Question:
            ${question}

            Answer clearly in 2-3 lines.
        `
        }
      ]
    });

    const answer = completion.choices[0].message.content;

    // 7. Return response
    res.json({
      answer,
      sources: topChunks
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Query failed" });
  }
};