import Resume from "../models/Resume.js";
import { extractText } from "../services/pdfService.js";
import { analyzeResume } from "../services/geminiService.js";
import { analyzeWithRules } from "../services/ruleBasedAnalyzer.js";

const withTimeout = (promise, ms) =>
  Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("AI request timed out")), ms),
    ),
  ]);

// 1) Try Gemini first. 2) If it fails, fall back to the offline rule-based analyzer.
const runAnalysis = async (resume) => {
  let analysis;

  try {
    const ai = await withTimeout(
      analyzeResume(resume.extractedText, resume.jobDescription),
      30000,
    );
    analysis = { ...ai, source: "ai" };
  } catch (error) {
    console.error(
      "Gemini unavailable, using offline analysis:",
      String(error.message).slice(0, 150),
    );
    analysis = {
      ...analyzeWithRules(resume.extractedText, resume.jobDescription),
      source: "rules",
    };
  }

  resume.analysis = analysis;
  resume.atsScore = analysis.atsScore;
  resume.status = "analyzed";
  await resume.save();
  return resume;
};

export const uploadResume = async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "Please upload a resume." });
    }

    const text = await extractText(req.file);
    if (!text || text.trim().length < 100) {
      return res.status(422).json({
        success: false,
        message:
          "Couldn't read enough text. Scanned or image-only resumes aren't supported.",
      });
    }

    const resume = await Resume.create({
      user: req.user._id,
      originalFileName: req.file.originalname,
      extractedText: text,
      jobDescription: (req.body.jobDescription || "").trim(),
    });

    await runAnalysis(resume);

    return res.status(201).json({
      success: true,
      message:
        resume.analysis.source === "ai"
          ? "Resume analyzed with AI."
          : "Resume analyzed. The AI is busy right now, so this is an offline rule-based result. You can re-run the AI analysis later.",
      resume,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const reanalyzeResume = async (req, res) => {
  try {
    const resume = await Resume.findOne({
      _id: req.params.id,
      user: req.user._id,
    });
    if (!resume) {
      return res
        .status(404)
        .json({ success: false, message: "Resume not found" });
    }
    await runAnalysis(resume);
    return res.status(200).json({ success: true, resume });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getResumeHistory = async (req, res) => {
  try {
    const resumes = await Resume.find({ user: req.user._id })
      .select("-extractedText -analysis")
      .sort({ createdAt: -1 });
    return res.status(200).json({ success: true, resumes });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getSingleResume = async (req, res) => {
  try {
    const resume = await Resume.findOne({
      _id: req.params.id,
      user: req.user._id,
    }).select("-extractedText");
    if (!resume) {
      return res
        .status(404)
        .json({ success: false, message: "Resume not found" });
    }
    return res.status(200).json({ success: true, resume });
  } catch (error) {
    // an invalid ObjectId format also lands here
    return res
      .status(404)
      .json({ success: false, message: "Resume not found" });
  }
};

export const deleteResume = async (req, res) => {
  try {
    const resume = await Resume.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });
    if (!resume) {
      return res
        .status(404)
        .json({ success: false, message: "Resume not found" });
    }
    return res
      .status(200)
      .json({ success: true, message: "Resume deleted successfully" });
  } catch (error) {
    return res
      .status(404)
      .json({ success: false, message: "Resume not found" });
  }
};
