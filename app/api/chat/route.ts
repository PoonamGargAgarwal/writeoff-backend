import { getApiKeys } from "@/lib/config";
import { chatAboutExpenses } from "@/lib/claude";
import type { ExpenseRecord } from "@/lib/claude";

export async function POST(request: Request) {
  // Check API key
  let apiKey: string;
  try {
    const keys = getApiKeys(["anthropic"]);
    apiKey = keys.anthropicApiKey;
  } catch {
    return Response.json(
      { error: "Server configuration error: ANTHROPIC_API_KEY is not set" },
      { status: 500 },
    );
  }

  // Parse body
  let body: { question?: string; expenseData?: ExpenseRecord[] };
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "A question is required" },
      { status: 400 },
    );
  }

  if (!body.question || typeof body.question !== "string") {
    return Response.json(
      { error: "A question is required" },
      { status: 400 },
    );
  }

  if (!body.expenseData || !Array.isArray(body.expenseData)) {
    return Response.json(
      { error: "Expense data is required" },
      { status: 400 },
    );
  }

  // Call Claude
  try {
    const answer = await chatAboutExpenses(
      apiKey,
      body.question,
      body.expenseData,
    );
    return new Response(answer, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  } catch {
    return Response.json(
      { error: "Upstream service failure: unable to process chat request" },
      { status: 502 },
    );
  }
}
