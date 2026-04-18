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
  riskReasons: string[];
  summary: string;
  complianceFlags: string[];
  financialPersona: FinancialPersona;
  personaDescription: string;
  totalPenaltyRisk: number;
  actionPlan: string[];
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
    'You are a financial compliance assistant. Analyze the expense data and return ONLY valid JSON with exactly this structure, keep all strings SHORT: ' +
    '{ "categories": [{"name": "string max 20 chars", "total": number, "transactions": number}], ' +
    '"riskScore": number between 0-100, ' +
    '"riskReasons": ["short string", "short string", "short string"], ' +
    '"summary": "max 2 sentences only", ' +
    '"complianceFlags": ["short flag 1", "short flag 2", "short flag 3"], ' +
    '"financialPersona": "one of: Creative Investor, Cautious Builder, Growth Sprinter, Compliance Risk", ' +
    '"personaDescription": "one sentence max", ' +
    '"totalPenaltyRisk": number, ' +
    '"actionPlan": ["step 1 short", "step 2 short", "step 3 short", "step 4 short", "step 5 short"] } ' +
    'Return ONLY the JSON object. No markdown. No extra text. Keep ALL strings under 100 characters.';

  try {
    const res = await client.messages.create({
      model: MODEL,
      max_tokens: 4096,
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
      max_tokens: 4096,
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
