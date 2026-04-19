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

export type FinancialPersona =
  | "Creative Investor"
  | "Cautious Builder"
  | "Growth Sprinter"
  | "Compliance Risk";

export interface Governance {
  modelVersion: string;
  ruleFramework: string;
  analysisTimestamp: string;
  disclaimer: string;
  confidenceNote: string;
}

export interface Explanation {
  flag: string;
  irsRule: string;
  evidence: string;
  confidence: number;
  resolution: string;
}

export interface CategoryResult {
  categories: { name: string; total: number; transactions: number }[];
  riskScore: number;
  riskReasons: string[];
  summary: string;
  complianceFlags: string[];
  totalPenaltyRisk: number;
  recoverableSavings: number;
  actionPlan: string[];
  financialPersona: FinancialPersona;
  personaDescription: string;
  explanations: Explanation[];
  governance: Governance;
}

/**
 * Sends expense data to Claude API with a system prompt for categorization.
 *
 * NOTE: No expense data is persisted. All data is held in local variables
 * that go out of scope when the function returns. Nothing is written to
 * disk, database, or module-level state.
 */
export async function analyzeExpenses(
  apiKey: string,
  expenseData: ExpenseRecord[],
): Promise<CategoryResult> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const system =
    "You are a financial compliance assistant for US small businesses. " +
    "Analyze the expense data and return ONLY raw JSON with no markdown, no code blocks, no extra text. " +
    'Use exactly this structure: ' +
    '{"categories":[{"name":"string","total":number,"transactions":number}],' +
    '"riskScore":number,' +
    '"riskReasons":["string","string","string"],' +
    '"summary":"2 sentences max",' +
    '"complianceFlags":["string","string"],' +
    '"totalPenaltyRisk":number,' +
    '"recoverableSavings":number,' +
    '"actionPlan":["string","string","string","string","string"],' +
    '"financialPersona":"Creative Investor",' +
    '"personaDescription":"one sentence",' +
    '"explanations":[{"flag":"short issue name","irsRule":"IRC section e.g. IRC 162","evidence":"what in data triggered this","confidence":number 0-100,"resolution":"what user should do"}]} ' +
    "Keep ALL strings under 60 characters. Return raw JSON only.";

  try {
    const res = await client.messages.create({
      model: MODEL,
      max_tokens: 4096,
      system,
      messages: [{ role: "user", content: JSON.stringify(expenseData) }],
    });

    const rawText = res.content
      .filter((b: any) => b.type === "text")
      .map((b: any) => b.text)
      .join("");

    if (!rawText || rawText.trim() === "") {
      throw new Error("Claude returned empty response");
    }

    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in response");
    }

    const result = JSON.parse(jsonMatch[0]);

    return {
      ...result,
      governance: {
        modelVersion: "claude-haiku-4-5-20251001",
        ruleFramework: "IRS-Publication-535-2024",
        analysisTimestamp: new Date().toISOString(),
        disclaimer:
          "AI analysis for informational purposes only. Verify with a licensed CPA before filing.",
        confidenceNote: "Flags are risk indicators not definitive rulings",
      },
    };
  } catch (error) {
    console.error("analyzeExpenses failed:", error);
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
    console.error("chatAboutExpenses failed:", error);
    throw error;
  }
}
