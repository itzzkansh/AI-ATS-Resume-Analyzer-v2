import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { UploadCloud, FileText, ArrowLeft } from "lucide-react";
import api from "../api/axios";

const ALLOWED = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

function Upload() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [jobDescription, setJobDescription] = useState("");
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);

  const pickFile = (f) => {
    if (!f) return;
    if (!ALLOWED.includes(f.type)) {
      toast.error("Only PDF and DOCX files are allowed.");
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      toast.error("File is too large. Max size is 5MB.");
      return;
    }
    setFile(f);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    pickFile(e.dataTransfer.files[0]);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      toast.error("Please select a resume first.");
      return;
    }

    setLoading(true);
    const toastId = toast.loading(
      "Analyzing your resume... this can take up to a minute.",
    );
    try {
      const formData = new FormData();
      formData.append("resume", file);
      if (jobDescription.trim())
        formData.append("jobDescription", jobDescription.trim());

      const { data } = await api.post("/resume/upload", formData);
      toast.dismiss(toastId);

      if (data.resume?.status === "analyzed") toast.success(data.message);
      else toast(data.message, { icon: "⚠️", duration: 6000 });

      navigate(`/result/${data.resume._id}`);
    } catch (error) {
      toast.dismiss(toastId);
      toast.error(
        error.response?.data?.message ||
          "Something went wrong while uploading.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4 py-10">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-xl">
        <button
          onClick={() => navigate("/dashboard")}
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-4 cursor-pointer"
        >
          <ArrowLeft size={14} /> Back to dashboard
        </button>

        <h1 className="text-2xl font-bold mb-6">Upload Resume</h1>

        <form onSubmit={handleUpload} className="space-y-5">
          <label
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            className={`block w-full cursor-pointer border-2 border-dashed rounded-lg p-8 text-center transition ${
              dragging
                ? "border-blue-500 bg-blue-50"
                : "border-gray-300 hover:border-blue-500"
            }`}
          >
            <input
              type="file"
              accept=".pdf,.docx"
              className="hidden"
              onChange={(e) => pickFile(e.target.files[0])}
            />
            {file ? (
              <div className="flex flex-col items-center gap-2 text-green-600">
                <FileText size={32} />
                <p className="font-medium break-all">{file.name}</p>
                <p className="text-xs text-gray-500">
                  {(file.size / 1024).toFixed(0)} KB
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-gray-600">
                <UploadCloud size={36} />
                <p className="text-lg font-medium">
                  Click or drag your resume here
                </p>
                <p className="text-gray-500 text-sm">PDF or DOCX, up to 5MB</p>
              </div>
            )}
          </label>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Job description{" "}
              <span className="text-gray-400 font-normal">
                (optional, for keyword matching)
              </span>
            </label>
            <textarea
              rows={5}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the job description here to see how well your resume matches..."
              className="w-full border rounded-lg p-3 text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? "Analyzing..." : "Upload & Analyze"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Upload;
