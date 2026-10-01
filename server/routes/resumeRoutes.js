import express from "express";
import {
  uploadResume,
  reanalyzeResume,
  getResumeHistory,
  getSingleResume,
  deleteResume,
} from "../controllers/resumeController.js";
import auth from "../middleware/auth.js";
import upload from "../middleware/upload.js";

const router = express.Router();

router.post("/upload", auth, upload.single("resume"), uploadResume);
router.get("/history", auth, getResumeHistory);
router.post("/:id/reanalyze", auth, reanalyzeResume);
router.get("/:id", auth, getSingleResume);
router.delete("/:id", auth, deleteResume);

export default router;
