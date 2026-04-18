export interface ExpenseRecord {
  date: string;
  description: string;
  amount: number;
}

const DATE_NAMES = ["date", "transaction date", "trans date", "posting date"];
const DESC_NAMES = ["description", "desc", "memo", "narrative", "details", "transaction description"];
const AMOUNT_NAMES = ["amount", "transaction amount", "total", "value"];
const DEBIT_NAMES = ["debit", "debit amount", "withdrawal"];
const CREDIT_NAMES = ["credit", "credit amount", "deposit"];

function findColumn(headers: string[], candidates: string[]): number {
  return headers.findIndex((h) => candidates.includes(h));
}

/**
 * Parses CSV content into expense records.
 * Uses the first row as a header to map columns.
 * Recognizes common column name variations for date, description, and amount.
 * Supports separate debit/credit columns — debits become positive, credits negative.
 * Skips rows with missing fields or non-numeric amounts.
 */
export function parseCSV(csvContent: string): ExpenseRecord[] {
  const lines = csvContent.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());

  const dateIdx = findColumn(headers, DATE_NAMES);
  const descIdx = findColumn(headers, DESC_NAMES);
  const amountIdx = findColumn(headers, AMOUNT_NAMES);
  const debitIdx = findColumn(headers, DEBIT_NAMES);
  const creditIdx = findColumn(headers, CREDIT_NAMES);

  const hasAmount = amountIdx !== -1;
  const hasDebitCredit = debitIdx !== -1 || creditIdx !== -1;

  if (dateIdx === -1 || descIdx === -1 || (!hasAmount && !hasDebitCredit)) {
    return [];
  }

  const records: ExpenseRecord[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",").map((c) => c.trim());
    const date = cols[dateIdx] ?? "";
    const description = cols[descIdx] ?? "";

    if (!date || !description) continue;

    let amount: number;

    if (hasAmount) {
      const raw = cols[amountIdx] ?? "";
      if (!raw) continue;
      amount = Number(raw);
      if (!Number.isFinite(amount)) continue;
    } else {
      // Separate debit/credit columns
      const rawDebit = debitIdx !== -1 ? (cols[debitIdx] ?? "").trim() : "";
      const rawCredit = creditIdx !== -1 ? (cols[creditIdx] ?? "").trim() : "";

      const debit = rawDebit ? Number(rawDebit) : 0;
      const credit = rawCredit ? Number(rawCredit) : 0;

      if (rawDebit && !Number.isFinite(debit)) continue;
      if (rawCredit && !Number.isFinite(credit)) continue;
      if (!rawDebit && !rawCredit) continue;

      // Debits are positive expenses, credits are negative (refunds/income)
      amount = debit - credit;
    }

    records.push({ date, description, amount });
  }

  return records;
}

/**
 * Formats expense records back to CSV string.
 */
export function formatCSV(records: ExpenseRecord[]): string {
  const header = "date,description,amount";
  const rows = records.map(
    (r) => `${r.date},${r.description},${r.amount}`,
  );
  return [header, ...rows].join("\n");
}
