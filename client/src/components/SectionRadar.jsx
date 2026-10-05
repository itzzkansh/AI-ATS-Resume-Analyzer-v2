import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from "recharts";

function SectionRadar({ sections }) {
  const data = Object.entries(sections || {}).map(([name, value]) => ({
    section: name.charAt(0).toUpperCase() + name.slice(1),
    score: Math.max(0, Math.min(100, Number(value) || 0)),
  }));

  if (data.length < 3) return null;

  return (
    <div className="h-72 w-full mb-6">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius="75%">
          <PolarGrid />
          <PolarAngleAxis dataKey="section" tick={{ fontSize: 12 }} />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={false}
            axisLine={false}
          />
          <Radar
            dataKey="score"
            stroke="#2563eb"
            fill="#2563eb"
            fillOpacity={0.3}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default SectionRadar;
