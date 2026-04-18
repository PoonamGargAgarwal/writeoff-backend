import { getApiKeys } from "@/lib/config";
import { analyzeExpenses } from "@/lib/claude";
import { parseCSV } from "@/lib/csvParser";

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

  // Parse the form data to get the CSV file
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return Response.json(
      { error: "A CSV file is required" },
      { status: 400 },
    );
  }

  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    return Response.json(
      { error: "A CSV file is required" },
      { status: 400 },
    );
  }

  const csvContent = await file.text();

  // Parse CSV
  let records;
  try {
    records = parseCSV(csvContent);
  } catch {
    return Response.json(
      { error: "Invalid CSV format" },
      { status: 400 },
    );
  }

  if (records.length === 0) {
    return Response.json(
      { error: "CSV file contains no data" },
      { status: 400 },
    );
  }

  // Call Claude for analysis
  try {
    const result = await analyzeExpenses(apiKey, records);
    return Response.json(result);
  } catch {
    return Response.json(
      { error: "Upstream service failure: unable to analyze expenses" },
      { status: 502 },
    );
  }
}
