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
  let body: Record<string, any>;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "A question is required" },
      { status: 400 },
    );
  }

  console.log("Chat request body:", JSON.stringify(body));

  const question = body.question || body.message || body.query;
  let expenseData: ExpenseRecord[] =
    body.expenseData || body.records || body.data || [];

  // If no expense data provided, give Claude general context
  if (expenseData.length === 0) {
    expenseData = [
      {
        date: "context",
        description:
          "The user has uploaded a bank statement with multiple transactions including cash withdrawals, contractor payments, and mixed personal and business expenses.",
        amount: 0,
      },
    ];
  }

  if (!question) {
    return Response.json(
      { error: "Question is required" },
      { status: 400 },
    );
  }

  // Call Claude
  try {
    const answer = await chatAboutExpenses(apiKey, question, expenseData);
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
