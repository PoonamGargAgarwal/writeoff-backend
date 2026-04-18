import Anthropic from "@anthropic-ai/sdk";

const MODEL = "claude-haiku-4-5-20251001";

const FOREIGN_CONTRACTOR_DISCLAIMER =
  "IMPORTANT: If any expenses involve payments to foreign contractors, " +
  "you MUST include this exact text in your response: " +
  "'Payments to foreign contractors may require W-8BEN forms and Form 1042-S filing. " +
  "Thresholds and treaty exemptions vary — consult a tax professional for your specific situation.'";

export interface ExpenseRecord {
  date: string;
  description: string;
  amount: number;
}

export interface PenaltyEstimate {
  flag: string;
  estimatedPenalty: number;
  basis: string;
}

export type FinancialPersona =
  | "Creative Investor"
  | "Cautious Builder"
  | "Growth Sprinter"
  | "Compliance Risk";

export interface CategoryResult {
  categories: { name: string; total: number; transactions: number }[];
  riskScore: number;
  summary: string;
  penaltyEstimates: PenaltyEstimate[];
  totalPenaltyRisk: number;
  disclaimer: string;
  financialPersona: FinancialPersona;
  personaDescription: string;
}

/**
 * Sends expense data to Claude API with a system prompt for categorization.
 * Returns a CategoryResult with categories, riskScore, and summary.
 */
export async function analyzeExpenses(
  apiKey: string,
  expenseData: ExpenseRecord[],
): Promise<CategoryResult> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const system =
    "You are a financial analyst. Analyze the provided expense records and return " +
    "a JSON object with these keys: " +
    '"categories" (an array of objects each with "name" string, "total" number, and "transactions" number), ' +
    '"riskScore" (a number from 0 to 100), ' +
    '"summary" (a short paragraph), ' +
    '"penaltyEstimates" (an array of objects each with "flag" string describing the compliance issue, ' +
    '"estimatedPenalty" number in dollars assuming a 24% federal tax bracket, and "basis" string explaining the calculation), ' +
    '"totalPenaltyRisk" (the sum of all estimatedPenalty values), and ' +
    '"disclaimer" (always set to "These penalty estimates are rough illustrations assuming a 24% tax bracket. ' +
    'Actual penalties depend on filing status, state laws, prior history, and other factors. Consult a tax professional."). ' +
    "If no compliance issues are found, return an empty penaltyEstimates array and totalPenaltyRisk of 0. " +
    'Also include "financialPersona" (one of exactly: "Creative Investor", "Cautious Builder", "Growth Sprinter", or "Compliance Risk") ' +
    "chosen based on the spending patterns, and " +
    '"personaDescription" (a single sentence describing the user\'s financial personality based on their spending). ' +
    "Return ONLY valid JSON, no markdown fences. " +
    FOREIGN_CONTRACTOR_DISCLAIMER;

  try {
    const res = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system,
      messages: [{ role: "user", content: JSON.stringify(expenseData) }],
    });

    const rawText = res.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");

    console.log("Claude raw response:", rawText);

    if (!rawText || rawText.trim() === "") {
      throw new Error("Claude returned empty response");
    }

    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error(
        "No JSON found in Claude response: " + rawText.substring(0, 200),
      );
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error("Claude API error in analyzeExpenses:", error);
    throw error;
  }
}

/**
 * Sends a question and expense data to Claude API, returns a plain text answer.
 */
export async function chatAboutExpenses(
  apiKey: string,
  question: string,
  expenseData: ExpenseRecord[],
): Promise<string> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const system =
    "You are a helpful financial assistant. The user will provide their " +
    "expense data and ask a question about it. Answer concisely in plain text. " +
    FOREIGN_CONTRACTOR_DISCLAIMER;

  try {
    const res = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system,
      messages: [
        {
          role: "user",
          content: `Here are my expenses:\n${JSON.stringify(expenseData, null, 2)}\n\n${question}`,
        },
      ],
    });

    const block = res.content[0];
    return block.type === "text" ? block.text : "";
  } catch (error) {
    console.error("Claude API error in chatAboutExpenses:", error);
    throw error;
  }
}
