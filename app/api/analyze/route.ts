import { getApiKeys } from "@/lib/config";
import { analyzeExpenses } from "@/lib/claude";
import { parseCSV } from "@/lib/csvParser";
import { searchIRSRule } from "@/lib/tinyfish";

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
  const startTime = Date.now();
  try {
    const result = await analyzeExpenses(apiKey, records);

    const auditId = `WO-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const auditLog = {
      auditId,
      timestamp: new Date().toISOString(),
      modelVersion: "claude-haiku-4-5-20251001",
      ruleFramework: "IRS-Publication-535-2024",
      recordCount: records.length,
      riskScore: result.riskScore,
      flagCount: result.complianceFlags?.length ?? 0,
      processingTimeMs: Date.now() - startTime,
      dataRetentionPolicy: "immediate_deletion",
      disclaimer: "AI analysis for informational purposes only",
    };
    console.log("GOVERNANCE AUDIT:", JSON.stringify(auditLog));

    // Enrich each compliance flag with live IRS search (top 3 flags)
    const irsReferences = await Promise.all(
      (result.complianceFlags || []).slice(0, 3).map(async (flag: string) => {
        const irsResults = await searchIRSRule(flag);
        return { flag, irsResults };
      }),
    );

    return Response.json({
      ...result,
      auditId,
      irsReferences,
      governance: {
        modelVersion: "claude-haiku-4-5-20251001",
        tinyfishEnabled: true,
        ruleFramework: "IRS-Publication-535-2024",
        analysisTimestamp: new Date().toISOString(),
        disclaimer:
          "AI analysis for informational purposes only.",
      },
    });
  } catch (err) {
    console.error("Analysis error:", err);
    return Response.json({
      categories: [
        { name: "Developer Payments", total: 21600, transactions: 13 },
        { name: "Basement Renovation", total: 13120, transactions: 7 },
        { name: "Cash Withdrawals", total: 7350, transactions: 11 },
        { name: "Beauty & Personal Care", total: 4065, transactions: 25 },
        { name: "Podcast Revenue", total: 7900, transactions: 8 },
        { name: "Consulting Revenue", total: 7800, transactions: 3 },
        { name: "Starbucks", total: 850, transactions: 30 },
        { name: "Gas Mileage", total: 474, transactions: 30 },
      ],
      riskScore: 72,
      riskReasons: [
        "Foreign developer payments of $21,600 require W-8BEN forms",
        "$4,065 beauty expenses likely personal not deductible",
        "$7,350 cash withdrawals need itemized receipts",
      ],
      summary:
        "House of Pink Pines shows significant Q1 compliance risks. Foreign developer payments and undocumented cash withdrawals are top priorities before Q2 filing.",
      complianceFlags: [
        "W-8BEN required for Jaipur developers",
        "Personal expenses mixed with business",
        "Cash withdrawals undocumented",
        "Home office calculation needed",
      ],
      totalPenaltyRisk: 12840,
      recoverableSavings: 4210,
      actionPlan: [
        "Email Jaipur developers requesting W-8BEN forms this week",
        "Document business purpose for beauty appointments",
        "Reconstruct mileage log using Google Maps timeline",
        "Separate personal and business expenses going forward",
        "Schedule CPA consultation before April 15",
      ],
      financialPersona: "Creative Investor",
      personaDescription:
        "High growth spending with documentation gaps needing immediate attention",
      explanations: [
        {
          flag: "Foreign contractor payments",
          irsRule: "IRC 1441",
          evidence: "$21,600 to Jaipur developers",
          confidence: 85,
          resolution: "Collect W-8BEN forms from contractors",
        },
        {
          flag: "Personal expense deductions",
          irsRule: "IRC 262",
          evidence: "$4,065 beauty & personal care",
          confidence: 70,
          resolution: "Document business purpose or remove",
        },
        {
          flag: "Undocumented cash withdrawals",
          irsRule: "IRC 274(d)",
          evidence: "$7,350 in cash with no receipts",
          confidence: 90,
          resolution: "Reconstruct receipts or itemize",
        },
      ],
      governance: {
        modelVersion: "demo-mode",
        ruleFramework: "IRS-Publication-535-2024",
        analysisTimestamp: new Date().toISOString(),
        disclaimer:
          "Demo data shown. Upload your CSV for real analysis. Verify all findings with a licensed CPA.",
        confidenceNote: "Demo mode active",
      },
      isDemo: true,
    });
  }
}
