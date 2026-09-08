const { GoogleGenerativeAI } = require("@google/generative-ai");

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY is missing");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function generateListingSummary({
  title,
  description,
  category,
  condition,
  region,
  price,
}) {
  const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });

  const prompt = `
Write a short marketplace summary for this student listing.
Rules:
- Maximum 2-3 sentences, DO NOT PUSH IT MORE THAN THAT.
- Each sentence is 10 words maximum.
- Clear and natural
- Do not invent details
- Do not mention AI
- Mention the main item, condition, and any useful context from the description

Listing:
Title: ${title || ""}
Category: ${category || ""}
Condition: ${condition || ""}
Region: ${region || ""}
Price: ${price || ""}
Description: ${description || ""}
`;

  const result = await model.generateContent(prompt);
  return result.response.text().trim();
}

module.exports = { generateListingSummary };