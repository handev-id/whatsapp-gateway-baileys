const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI("AIzaSyAf-74FGo_35VENNluDYGz9xuNc1PZcf8Q");

export async function generativeAi(prompts: string) {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const result = await model.generateContent([prompts]);

  return result.response.text();
}
