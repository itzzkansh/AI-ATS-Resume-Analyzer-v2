import { GoogleGenAI } from "@google/genai";

const GEMINI_MODELS = [
  process.env.GEMINI_MODEL || "gemini-3.8-flash",
  process.env.GEMINI_FALLBACK_MODEL,
].filter(Boolean);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const toArray = (v) => (Array.isArray(v) ? v : []);

const getStatus = (error) => {
  if (error?.status) return error.status;
  const match = String(error?.message || "").match(/"code":\s*(\d{3})/);
  return match ? Number(match[1]) : null;
};

// ---------- Provider 1: Gemini ----------
const callGemini = async (model, prompt) => {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: { responseMimeType: "application/json" },
  });
  return response.text;
};

// ---------- Provider 2: any OpenAI-compatible API (Groq, DeepSeek, OpenRouter) ----------
const callFallbackProvider = async (prompt) => {
  const { FALLBACK_API_URL, FALLBACK_API_KEY, FALLBACK_MODEL } = process.env;
  if (!FALLBACK_API_URL || !FALLBACK_API_KEY || !FALLBACK_MODEL) {
    throw new Error("Fallback provider not configured");
  }

  const res = await fetch(`${FALLBACK_API_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${FALLBACK_API_KEY}`,
    },
    body: JSON.stringify({
      model: FALLBACK_MODEL,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.2,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    const err = new Error(
      `Fallback provider ${res.status}: ${body.slice(0, 150)}`,
    );
    err.status = res.status;
    throw err;
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content || "";
};

// ---------- Orchestrator ----------
// Gemini models first (retry only on 503), then the fallback provider.
// A 429 (quota) never retries: it moves straight to the next option.
const generateText = async (prompt) => {
  for (const model of GEMINI_MODELS) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        return await callGemini(model, prompt);
      } catch (error) {
        const status = getStatus(error);
        console.warn(
          `Gemini ${model} attempt ${attempt} failed (${status}): ${String(error.message).slice(0, 80)}`,
        );
        if (status !== 503) break; // 429, 404, 400...: don't retry this model
        await sleep(2000 * attempt);
      }
    }
  }

  console.warn("Switching to fallback provider...");
  return await callFallbackProvider(prompt);
};

export const analyzeResume = async (resumeText, jobDescription = "") => {
  const hasJD = jobDescription.trim().length > 0;

  const prompt = `You are an expert ATS system and technical recruiter.
Analyze the resume below${hasJD ? " against the job description" : ""}.
Be strict and realistic with scoring. Return ONLY a valid JSON object with exactly these keys:
{
  "atsScore": integer 0-100,
  "summary": string (2-3 sentences),
  "strengths": string[],
  "weaknesses": string[],
  "missingSkills": string[],
  "recommendations": string[],
  "sectionScores": { "contact": int, "summary": int, "experience": int, "education": int, "skills": int, "projects": int },
  "improvedBullets": [ { "original": string, "improved": string } ]  (max 3)${
    hasJD
      ? `,\n  "matchedKeywords": string[],\n  "missingKeywords": string[]`
      : ""
  }
}

RESUME:
${resumeText.slice(0, 15000)}
${hasJD ? `\nJOB DESCRIPTION:\n${jobDescription.slice(0, 5000)}` : ""}`;

  const text = await generateText(prompt);
  const data = JSON.parse(text.replace(/```json|```/g, "").trim());

  return {
    atsScore: Math.max(
      0,
      Math.min(100, Math.round(Number(data.atsScore) || 0)),
    ),
    summary: data.summary || "",
    strengths: toArray(data.strengths),
    weaknesses: toArray(data.weaknesses),
    missingSkills: toArray(data.missingSkills),
    recommendations: toArray(data.recommendations),
    sectionScores: data.sectionScores || {},
    improvedBullets: toArray(data.improvedBullets),
    matchedKeywords: toArray(data.matchedKeywords),
    missingKeywords: toArray(data.missingKeywords),
  };
};
