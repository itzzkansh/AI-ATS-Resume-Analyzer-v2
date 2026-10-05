import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowLeft, RefreshCw, Download } from "lucide-react";
import api from "../api/axios";
import SectionRadar from "../components/SectionRadar";

const list = (v) => (Array.isArray(v) ? v : []);

function ScoreRing({ score }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 75 ? "#059669" : score >= 50 ? "#d97706" : "#ef4444";

  return (
    <div className="relative h-36 w-36 shrink-0">
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="10"
        />
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold" style={{ color }}>
          {score}
        </span>
        <span className="text-xs text-gray-500">out of 100</span>
      </div>
    </div>
  );
}

function BulletList({ title, items, dot }) {
  if (!items.length) return null;
  return (
    <section>
      <h2 className="text-xl font-semibold">{title}</h2>
      <ul className="mt-3 space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2 text-gray-700">
            <span className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${dot}`} />
            <span>
              {typeof item === "string" ? item : JSON.stringify(item)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Chips({ title, items, tone }) {
  if (!items.length) return null;
  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-600 mb-2">{title}</h3>
      <div className="flex flex-wrap gap-2">
        {items.map((k, i) => (
          <span
            key={i}
            className={`text-sm px-3 py-1 rounded-full border ${tone}`}
          >
            {String(k)}
          </span>
        ))}
      </div>
    </div>
  );
}

function Result() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [resume, setResume] = useState(null);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    const fetchResume = async () => {
      try {
        const { data } = await api.get(`/resume/${id}`);
        setResume(data.resume);
      } catch (error) {
        console.error(error);
        toast.error("Unable to load this resume.");
        navigate("/dashboard");
      }
    };
    fetchResume();
  }, [id, navigate]);

  const handleRetry = async () => {
    setRetrying(true);
    try {
      const { data } = await api.post(`/resume/${id}/reanalyze`);
      setResume(data.resume);
      if (data.resume.status === "analyzed")
        toast.success("Analysis complete!");
      else toast.error("The AI is still busy. Try again in a minute.");
    } catch (error) {
      toast.error(error.response?.data?.message || "Retry failed.");
    } finally {
      setRetrying(false);
    }
  };

  if (!resume) {
    return (
      <div className="min-h-screen flex justify-center items-center text-gray-500">
        Loading...
      </div>
    );
  }

  const a = resume.analysis || {};
  const analyzed = resume.status === "analyzed";
  const sections = Object.entries(a.sectionScores || {});
  const bullets = list(a.improvedBullets);

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4">
      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-xl p-6 md:p-8">
        <div className="flex flex-wrap gap-3 justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">ATS Resume Analysis</h1>
            <p className="text-sm text-gray-500 mt-1 break-all">
              {resume.originalFileName}
            </p>
          </div>
          <button
            onClick={() => navigate("/dashboard")}
            className="inline-flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-lg cursor-pointer hover:bg-blue-700 print:hidden"
          >
            <ArrowLeft size={16} /> Back
          </button>
        </div>

        {!analyzed ? (
          <div className="text-center py-14">
            <p className="text-lg font-semibold text-gray-800">
              {resume.status === "failed"
                ? "The analysis didn't complete."
                : "This resume hasn't been analyzed yet."}
            </p>
            <p className="text-gray-500 mt-2">
              The AI service may be busy. Try again in a moment.
            </p>
            <button
              onClick={handleRetry}
              disabled={retrying}
              className="mt-6 inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg cursor-pointer hover:bg-blue-700 disabled:opacity-60 print:hidden"
            >
              <RefreshCw size={16} className={retrying ? "animate-spin" : ""} />
              {retrying ? "Analyzing..." : "Retry analysis"}
            </button>
          </div>
        ) : (
          <div className="space-y-10">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <ScoreRing score={resume.atsScore ?? a.atsScore ?? 0} />
              <div>
                <h2 className="text-xl font-semibold">Summary</h2>
                <p className="mt-2 text-gray-700">
                  {a.summary || "No summary available."}
                </p>
                {a.source && (
                  <span className="mt-3 inline-block text-xs px-2.5 py-1 rounded-full border bg-gray-50 text-gray-600">
                    {a.source === "hybrid"
                      ? "AI-enhanced analysis"
                      : a.source === "rules"
                        ? "Rule-based analysis"
                        : "AI analysis"}
                  </span>
                )}
                {a.jdMatch != null && (
                  <p className="mt-3 text-sm text-gray-700">
                    Job description match: <strong>{a.jdMatch}%</strong>
                  </p>
                )}
              </div>
            </div>

            {sections.length > 0 && (
              <section>
                <h2 className="text-xl font-semibold mb-4">Section Scores</h2>
                <SectionRadar sections={a.sectionScores} />
                <div className="space-y-3">
                  {sections.map(([name, value]) => {
                    const v = Math.max(0, Math.min(100, Number(value) || 0));
                    return (
                      <div key={name}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="capitalize text-gray-700">
                            {name}
                          </span>
                          <span className="text-gray-500">{v}%</span>
                        </div>
                        <div className="h-2.5 rounded-full bg-gray-100">
                          <div
                            className={`h-2.5 rounded-full ${v >= 75 ? "bg-emerald-500" : v >= 50 ? "bg-amber-500" : "bg-red-400"}`}
                            style={{ width: `${v}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {(list(a.matchedKeywords).length > 0 ||
              list(a.missingKeywords).length > 0) && (
              <section className="space-y-4">
                <h2 className="text-xl font-semibold">Keyword Match</h2>
                <Chips
                  title="Found in your resume"
                  items={list(a.matchedKeywords)}
                  tone="bg-emerald-50 text-emerald-700 border-emerald-200"
                />
                <Chips
                  title="Missing from your resume"
                  items={list(a.missingKeywords)}
                  tone="bg-red-50 text-red-600 border-red-200"
                />
              </section>
            )}

            <BulletList
              title="Strengths"
              items={list(a.strengths)}
              dot="bg-emerald-500"
            />
            <BulletList
              title="Weaknesses"
              items={list(a.weaknesses)}
              dot="bg-red-400"
            />
            <BulletList
              title="Missing Skills"
              items={list(a.missingSkills)}
              dot="bg-amber-500"
            />
            <BulletList
              title="Recommendations"
              items={list(a.recommendations)}
              dot="bg-blue-500"
            />

            {bullets.length > 0 && (
              <section>
                <h2 className="text-xl font-semibold mb-4">
                  Suggested Bullet Rewrites
                </h2>
                <div className="space-y-4">
                  {bullets.map((b, i) => (
                    <div
                      key={i}
                      className="rounded-lg border border-gray-200 p-4 space-y-2"
                    >
                      <p className="text-sm text-gray-500">
                        <span className="font-semibold text-red-500">
                          Before:
                        </span>{" "}
                        {b.original}
                      </p>
                      <p className="text-sm text-gray-800">
                        <span className="font-semibold text-emerald-600">
                          After:
                        </span>{" "}
                        {b.improved}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <div className="pt-2 flex justify-center gap-3 print:hidden">
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 text-sm text-white bg-blue-600 px-4 py-2 rounded-lg cursor-pointer hover:bg-blue-700"
              >
                <Download size={14} /> Download PDF
              </button>
              <button
                onClick={handleRetry}
                disabled={retrying}
                className="inline-flex items-center gap-2 text-sm text-gray-600 border border-gray-300 px-4 py-2 rounded-lg cursor-pointer hover:bg-gray-50 disabled:opacity-60"
              >
                <RefreshCw
                  size={14}
                  className={retrying ? "animate-spin" : ""}
                />
                {retrying ? "Re-analyzing..." : "Re-run analysis"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Result;
