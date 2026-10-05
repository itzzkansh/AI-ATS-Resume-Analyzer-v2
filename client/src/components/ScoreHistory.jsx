import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

function ScoreHistory({ resumes }) {
  const data = resumes
    .filter((r) => r.atsScore != null)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    .map((r, i) => ({
      label: `#${i + 1}`,
      score: r.atsScore,
      file: r.originalFileName,
      date: new Date(r.createdAt).toLocaleDateString(),
    }));

  if (data.length < 2) return null;

  return (
    <section className="relative mt-10">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        Score History
      </h2>
      <div className="h-64 w-full rounded-xl border border-gray-200 bg-white p-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 8, right: 16, bottom: 0, left: -16 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="label" tick={{ fontSize: 12 }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
            <Tooltip
              formatter={(value) => [`${value}%`, "ATS score"]}
              labelFormatter={(label, payload) =>
                payload?.[0]
                  ? `${payload[0].payload.file} (${payload[0].payload.date})`
                  : label
              }
            />
            <Line
              type="monotone"
              dataKey="score"
              stroke="#2563eb"
              strokeWidth={2.5}
              dot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

export default ScoreHistory;
