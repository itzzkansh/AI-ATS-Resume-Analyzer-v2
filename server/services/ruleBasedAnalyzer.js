const SKILLS = [
  "javascript",
  "typescript",
  "python",
  "java",
  "c++",
  "c#",
  "go",
  "rust",
  "php",
  "ruby",
  "kotlin",
  "swift",
  "sql",
  "html",
  "css",
  "react",
  "next.js",
  "redux",
  "angular",
  "vue",
  "tailwind",
  "bootstrap",
  "node.js",
  "express",
  "nestjs",
  "django",
  "flask",
  "fastapi",
  "spring boot",
  "mongodb",
  "mysql",
  "postgresql",
  "redis",
  "firebase",
  "graphql",
  "rest api",
  "docker",
  "kubernetes",
  "aws",
  "azure",
  "gcp",
  "git",
  "github",
  "ci/cd",
  "linux",
  "jenkins",
  "terraform",
  "jest",
  "cypress",
  "postman",
  "figma",
  "machine learning",
  "deep learning",
  "tensorflow",
  "pytorch",
  "pandas",
  "numpy",
  "scikit-learn",
  "nlp",
  "data structures",
  "algorithms",
  "system design",
  "oop",
  "microservices",
  "agile",
  "scrum",
  "jira",
  "power bi",
  "tableau",
  "excel",
  "jwt",
  "websocket",
];

const ACTION_VERBS = [
  "built",
  "developed",
  "designed",
  "implemented",
  "created",
  "led",
  "managed",
  "optimized",
  "improved",
  "reduced",
  "increased",
  "launched",
  "deployed",
  "automated",
  "integrated",
  "architected",
  "engineered",
  "delivered",
  "migrated",
  "analyzed",
  "achieved",
];

const STOPWORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "you",
  "our",
  "are",
  "will",
  "have",
  "this",
  "that",
  "from",
  "your",
  "able",
  "work",
  "team",
  "strong",
  "experience",
  "knowledge",
  "skills",
  "ability",
  "years",
  "role",
  "job",
  "company",
  "about",
  "including",
  "such",
  "must",
  "should",
  "preferred",
  "required",
  "requirements",
  "responsibilities",
  "looking",
  "candidate",
  "good",
  "using",
  "etc",
  "across",
  "within",
]);

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const hasTerm = (text, term) =>
  new RegExp(`(?<![a-z0-9])${escapeRegex(term)}(?![a-z0-9])`, "i").test(text);

const SECTION_KEYWORDS = {
  summary: ["summary", "objective", "profile", "about me"],
  experience: ["experience", "employment", "internship", "work history"],
  education: ["education", "academic"],
  skills: ["skills", "technologies", "tech stack"],
  projects: ["projects"],
};

// a heading is a short line (5 words or fewer) containing the keyword
const detectSections = (lines) => {
  const found = {};
  for (const [name, keywords] of Object.entries(SECTION_KEYWORDS)) {
    found[name] = lines.some((line) => {
      const lower = line.toLowerCase();
      return (
        line.split(/\s+/).length <= 5 && keywords.some((k) => lower.includes(k))
      );
    });
  }
  return found;
};

const clamp = (n) => Math.max(0, Math.min(100, Math.round(n)));

export const analyzeWithRules = (text, jobDescription = "") => {
  const lower = text.toLowerCase();
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const words = text.split(/\s+/).filter(Boolean).length;

  // ---- contact ----
  const hasEmail = /[\w.+-]+@[\w-]+\.[\w.]+/.test(text);
  const hasPhone = /(\+?\d[\d\s().-]{8,}\d)/.test(text);
  const hasLinkedin = /linkedin/i.test(text);
  const hasGithub = /github/i.test(text);
  const contact =
    (hasEmail ? 40 : 0) +
    (hasPhone ? 30 : 0) +
    (hasLinkedin ? 15 : 0) +
    (hasGithub ? 15 : 0);

  // ---- sections ----
  const found = detectSections(lines);

  // ---- bullets, metrics, verbs ----
  const bullets = lines.filter((l) => /^[•\-*▪●◦]/.test(l) || l.length > 40);
  const metricBullets = bullets.filter((l) =>
    /\d+\s?(%|\+|x|k|m|users|ms|hours|days)|\$\s?\d+|\d{2,}/i.test(l),
  ).length;
  const verbBullets = lines.filter((l) => {
    const first = l
      .replace(/^[•\-*▪●◦\s]+/, "")
      .split(/\s+/)[0]
      ?.toLowerCase();
    return ACTION_VERBS.includes(first);
  }).length;

  // ---- skills ----
  const skillsFound = SKILLS.filter((s) => hasTerm(lower, s));

  // ---- section scores ----
  const sectionScores = {
    contact,
    summary: found.summary ? 100 : 0,
    experience: clamp(
      (found.experience ? 40 : 0) +
        Math.min(35, metricBullets * 7) +
        Math.min(25, verbBullets * 5),
    ),
    education: found.education ? 100 : 0,
    skills: clamp(
      (found.skills ? 40 : 0) + Math.min(60, skillsFound.length * 6),
    ),
    projects: found.projects ? 100 : 0,
  };

  // ---- length ----
  const lengthScore =
    words >= 300 && words <= 900
      ? 100
      : words < 300
        ? clamp((words / 300) * 100)
        : clamp(100 - (words - 900) / 10);

  const baseScore = clamp(
    sectionScores.contact * 0.15 +
      sectionScores.experience * 0.25 +
      sectionScores.skills * 0.2 +
      sectionScores.education * 0.1 +
      sectionScores.projects * 0.1 +
      sectionScores.summary * 0.05 +
      lengthScore * 0.15,
  );

  // ---- job description matching ----
  let matchedKeywords = [];
  let missingKeywords = [];
  let jdMatch = null;
  const jd = jobDescription.trim().toLowerCase();
  if (jd) {
    const jdSkills = SKILLS.filter((s) => hasTerm(jd, s));
    const freq = {};
    (jd.match(/[a-z][a-z+#.]{3,}/g) || []).forEach((w) => {
      if (!STOPWORDS.has(w)) freq[w] = (freq[w] || 0) + 1;
    });
    const topWords = Object.entries(freq)
      .filter(([, c]) => c >= 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([w]) => w);
    const keywords = [...new Set([...jdSkills, ...topWords])];
    matchedKeywords = keywords.filter((k) => hasTerm(lower, k));
    missingKeywords = keywords.filter((k) => !hasTerm(lower, k));
    jdMatch = keywords.length
      ? clamp((matchedKeywords.length / keywords.length) * 100)
      : null;
  }

  const atsScore =
    jdMatch == null ? baseScore : clamp(baseScore * 0.5 + jdMatch * 0.5);

  // ---- feedback ----
  const strengths = [];
  const weaknesses = [];
  const recommendations = [];

  if (hasEmail && hasPhone)
    strengths.push("Complete contact details (email and phone).");
  else weaknesses.push("Contact details are incomplete.");
  if (!hasEmail || !hasPhone)
    recommendations.push(
      "Add a professional email and phone number at the top.",
    );

  if (hasLinkedin || hasGithub)
    strengths.push("Includes professional profile links (LinkedIn/GitHub).");
  else recommendations.push("Add LinkedIn and GitHub links.");

  for (const [name, present] of Object.entries(found)) {
    if (!present && name !== "summary") {
      weaknesses.push(`No clear "${name}" section detected.`);
      recommendations.push(
        `Add a clearly labelled "${name[0].toUpperCase() + name.slice(1)}" section heading.`,
      );
    }
  }
  if (!found.summary)
    recommendations.push(
      "Add a 2-3 line professional summary tailored to the role.",
    );

  if (metricBullets >= 3)
    strengths.push(
      "Uses measurable results (numbers and percentages) in bullet points.",
    );
  else {
    weaknesses.push("Few quantified achievements.");
    recommendations.push(
      "Quantify impact, for example 'reduced load time by 40%' or 'served 5,000+ users'.",
    );
  }
  if (verbBullets >= 4)
    strengths.push("Bullets start with strong action verbs.");
  else
    recommendations.push(
      "Start bullet points with action verbs like Built, Optimized, Led, Implemented.",
    );

  if (skillsFound.length >= 8)
    strengths.push(
      `Good skill coverage (${skillsFound.length} recognised technologies).`,
    );
  else weaknesses.push("Limited technical skills detected.");

  if (words < 300)
    recommendations.push(
      "Resume looks short. Add more detail on projects and experience.",
    );
  if (words > 900)
    recommendations.push(
      "Resume is long. Aim for 1 page (2 at most) with only relevant content.",
    );
  if (missingKeywords.length)
    recommendations.push(
      `Add relevant job-description keywords such as: ${missingKeywords.slice(0, 6).join(", ")}.`,
    );

  return {
    atsScore,
    summary: `Rule-based check: ${found.experience ? "experience section found" : "no experience section"}, ${skillsFound.length} recognised skills, ${metricBullets} quantified bullet points${jdMatch != null ? `, ${jdMatch}% job-description keyword match` : ""}.`,
    strengths,
    weaknesses,
    missingSkills: missingKeywords.filter((k) => SKILLS.includes(k)),
    recommendations,
    sectionScores,
    improvedBullets: [],
    matchedKeywords,
    missingKeywords,
    detectedSkills: skillsFound,
    jdMatch,
  };
};
