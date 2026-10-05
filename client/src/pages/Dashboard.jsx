import ScoreHistory from "../components/ScoreHistory";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import {
  FileText,
  Upload,
  Trash2,
  Eye,
  LogOut,
  FolderOpen,
  CalendarDays,
  RefreshCw,
} from "lucide-react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

function InkCircle({ className = "" }) {
  return (
    <svg
      viewBox="0 0 120 60"
      className={`pointer-events-none absolute ${className}`}
      fill="none"
    >
      <path
        d="M12 34C9 20 26 8 60 7c33-1 52 11 49 27-3 17-27 24-54 23C29 56 15 48 12 34Z"
        stroke="#dc2626"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ScoreBlock({ score }) {
  if (score == null) {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm text-gray-500">
        <span className="h-1.5 w-1.5 rounded-full bg-gray-300" />
        ATS Score: --%
      </span>
    );
  }
  const tone =
    score >= 75
      ? "text-emerald-600 bg-emerald-50"
      : score >= 50
        ? "text-amber-600 bg-amber-50"
        : "text-red-500 bg-red-50";

  return (
    <span
      className={`relative inline-flex items-center gap-1.5 text-sm font-medium px-2.5 py-1 rounded-md ${tone}`}
    >
      ATS Score: {score}%
    </span>
  );
}

function MarginNote({ score, status }) {
  if (status === "failed") {
    return (
      <p className="mt-3 text-xl leading-none font-['Caveat'] font-semibold text-red-600 rotate-[-1.5deg]">
        analysis failed, hit retry!
      </p>
    );
  }
  if (score == null) {
    return (
      <p className="mt-3 text-[15px] leading-none text-gray-400 italic font-['Caveat'] rotate-[-1deg]">
        still waiting on this one...
      </p>
    );
  }
  const note =
    score >= 75
      ? "nice work, this one's strong!"
      : score >= 50
        ? "close, tighten the bullet points"
        : "needs another pass, keep going";
  const color = score >= 75 ? "text-emerald-700" : "text-red-600";
  return (
    <p
      className={`mt-3 text-xl leading-none font-['Caveat'] font-semibold ${color} rotate-[-1.5deg]`}
    >
      {note}
    </p>
  );
}

const STATUS_STYLES = {
  analyzed: {
    label: "Analyzed",
    badge: "text-blue-700 border-blue-200 bg-blue-50",
    dot: "bg-blue-500",
  },
  failed: {
    label: "Failed",
    badge: "text-red-700 border-red-200 bg-red-50",
    dot: "bg-red-500",
  },
  pending: {
    label: "Pending",
    badge: "text-gray-500 border-gray-200 bg-gray-50",
    dot: "bg-gray-400",
  },
};

function ResumeCard({ resume, onDelete, onView, onRetry, retrying }) {
  const style = STATUS_STYLES[resume.status] || STATUS_STYLES.pending;

  return (
    <div className="group relative bg-white border border-gray-200 rounded-xl p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-gray-300">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <div className="shrink-0 rounded-lg bg-blue-50 p-3 text-blue-600">
            <FileText size={20} />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-gray-900 truncate">
              {resume.originalFileName}
            </h3>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-gray-500">
              <CalendarDays size={14} />
              Created: {new Date(resume.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border shrink-0 ${style.badge}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
          {style.label}
        </span>
      </div>

      <div className="mt-4 relative inline-block">
        <ScoreBlock score={resume.atsScore} />
        {resume.atsScore != null && (
          <InkCircle className="-inset-3 w-[calc(100%+24px)] h-[calc(100%+24px)] rotate-[-2deg]" />
        )}
      </div>

      <MarginNote score={resume.atsScore} status={resume.status} />

      <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onView(resume._id)}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 border border-blue-200 rounded-lg px-3 py-2 cursor-pointer transition-all duration-300 hover:bg-blue-50 hover:text-blue-700"
          >
            <Eye size={15} />
            View
          </button>
          {resume.status !== "analyzed" && (
            <button
              type="button"
              disabled={retrying}
              onClick={() => onRetry(resume._id)}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-700 border border-amber-200 rounded-lg px-3 py-2 cursor-pointer transition-all duration-300 hover:bg-amber-50 disabled:opacity-60"
            >
              <RefreshCw size={15} className={retrying ? "animate-spin" : ""} />
              {retrying ? "Retrying..." : "Retry"}
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => onDelete(resume._id)}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-red-500 rounded-lg px-3 py-2 cursor-pointer transition-all duration-300 hover:bg-red-50 hover:text-red-600"
        >
          <Trash2 size={15} />
          Delete
        </button>
      </div>
    </div>
  );
}

function EmptyState({ onUpload }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-20 px-6">
      <div className="text-gray-300 mb-4">
        <FolderOpen size={56} strokeWidth={1.25} />
      </div>
      <h3 className="text-lg font-semibold text-gray-700">
        No resumes uploaded yet.
      </h3>
      <p className="mt-2 text-sm text-gray-500 max-w-sm">
        Upload your first resume to receive AI-powered ATS feedback and start
        improving your chances of getting shortlisted.
      </p>
      <button
        type="button"
        onClick={onUpload}
        className="mt-6 inline-flex items-center gap-2 bg-blue-600 text-white font-medium px-6 py-3 rounded-lg cursor-pointer shadow-sm transition-all duration-300 hover:bg-blue-700 hover:shadow-md"
      >
        <Upload size={16} />
        Upload Resume
      </button>
    </div>
  );
}

function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [retryingId, setRetryingId] = useState(null);

  const fetchResumes = async () => {
    try {
      const { data } = await api.get("/resume/history");
      setResumes(data.resumes);
    } catch (error) {
      console.error(error);
      toast.error("Couldn't load your resumes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResumes();
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this resume? This can't be undone.")) return;
    try {
      await api.delete(`/resume/${id}`);
      toast.success("Resume deleted.");
      fetchResumes();
    } catch (error) {
      console.error(error);
      toast.error("Couldn't delete the resume.");
    }
  };

  const handleRetry = async (id) => {
    setRetryingId(id);
    try {
      const { data } = await api.post(`/resume/${id}/reanalyze`);
      if (data.resume.status === "analyzed")
        toast.success("Analysis complete!");
      else toast.error("The AI is still busy. Try again in a minute.");
      fetchResumes();
    } catch (error) {
      toast.error(error.response?.data?.message || "Retry failed.");
    } finally {
      setRetryingId(null);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#F8F7F5] bg-[radial-gradient(circle_at_1px_1px,rgba(0,0,0,0.035)_1px,transparent_0)] bg-[length:22px_22px] py-10 px-4 md:py-16">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Caveat:wght@500;600;700&display=swap');`}</style>

      <div className="relative max-w-[960px] mx-auto">
        <div
          aria-hidden="true"
          className="absolute inset-0 translate-x-3 translate-y-4 rotate-1 rounded-2xl bg-gray-50 border border-gray-100 shadow-md"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 -translate-x-2 translate-y-3 -rotate-1 rounded-2xl bg-white border border-gray-100 shadow-md"
        />

        <main className="relative bg-white rounded-2xl shadow-2xl p-8 md:p-12 min-h-[85vh] overflow-hidden">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-[0.035] mix-blend-multiply bg-[url('data:image/svg+xml,%3Csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20width=%27120%27%20height=%27120%27%3E%3Cfilter%20id=%27n%27%3E%3CfeTurbulence%20type=%27fractalNoise%27%20baseFrequency=%270.9%27%20numOctaves=%272%27%20stitchTiles=%27stitch%27/%3E%3C/filter%3E%3Crect%20width=%27100%25%27%20height=%27100%25%27%20filter=%27url(%23n)%27/%3E%3C/svg%3E')]"
          />
          <div
            aria-hidden="true"
            className="absolute -top-3 left-1/2 -translate-x-1/2 w-24 h-6 bg-amber-100/80 border border-amber-200/60 rotate-[-4deg] shadow-sm"
          />

          <header className="relative flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                AI ATS Resume Analyzer
              </h1>
              <p className="mt-1.5 text-sm text-gray-500">
                Manage, Analyze &amp; Improve your Resume using AI
              </p>
              <p className="mt-6 text-2xl text-blue-900 font-['Caveat'] font-semibold rotate-[-1deg] inline-block">
                Welcome back, {user?.name?.split(" ")[0] || "there"} 👋
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => navigate("/upload")}
                className="inline-flex items-center gap-2 bg-blue-600 text-white font-medium px-5 py-2.5 rounded-lg cursor-pointer shadow-sm transition-all duration-300 hover:bg-blue-700 hover:shadow-md"
              >
                <Upload size={16} />
                Upload Resume
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 font-medium px-5 py-2.5 rounded-lg cursor-pointer border border-gray-200 transition-all duration-300 hover:bg-gray-200"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          </header>

          <div className="relative mt-8">
            <div className="border-t border-gray-200" />
            <div className="mt-1 border-t border-gray-100" />
          </div>
          {!loading && <ScoreHistory resumes={resumes} />}
          <section className="relative mt-10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Your Uploaded Resumes
              </h2>
              {resumes.length > 0 && (
                <span className="text-sm text-gray-500">
                  {resumes.length} {resumes.length === 1 ? "file" : "files"}
                </span>
              )}
            </div>

            {loading ? (
              <p className="text-center text-gray-400 py-16">
                Loading your resumes...
              </p>
            ) : resumes.length === 0 ? (
              <EmptyState onUpload={() => navigate("/upload")} />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {resumes.map((resume) => (
                  <ResumeCard
                    key={resume._id}
                    resume={resume}
                    onDelete={handleDelete}
                    onView={(id) => navigate(`/result/${id}`)}
                    onRetry={handleRetry}
                    retrying={retryingId === resume._id}
                  />
                ))}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}

export default Dashboard;
