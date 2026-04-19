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

// Date pattern: MM/DD/YYYY, M/D/YYYY, MM-DD-YYYY, YYYY-MM-DD
const DATE_PATTERN = /^(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})$/;

/**
 * Parses bank statement CSVs where there's no usable header row.
 * Identifies data rows by checking if column 1 matches a date pattern.
 * Column mapping: col1=date, col3=description, col4=debit, col5=credit.
 * Amount = credit - debit (positive for credits, negative for debits).
 */
function parseBankStatement(lines: string[]): ExpenseRecord[] {
  const records: ExpenseRecord[] = [];

  for (const line of lines) {
    const cols = line.split(",").map((c) => c.trim());
    if (cols.length < 5) continue;

    const dateCandidate = cols[0];
    if (!DATE_PATTERN.test(dateCandidate)) continue;

    const date = dateCandidate;
    const description = cols[2] || "";
    if (!description) continue;

    const rawDebit = cols[3] || "";
    const rawCredit = cols[4] || "";

    const debit = rawDebit ? Number(rawDebit) : 0;
    const credit = rawCredit ? Number(rawCredit) : 0;

    if (rawDebit && !Number.isFinite(debit)) continue;
    if (rawCredit && !Number.isFinite(credit)) continue;
    if (!rawDebit && !rawCredit) continue;

    // Positive for credits (income), negative for debits (expenses)
    const amount = credit - debit;

    records.push({ date, description, amount });
  }

  return records;
}

/**
 * Parses CSV content into expense records.
 * First tries header-based parsing with flexible column name detection.
 * Falls back to bank statement format (date-pattern detection, fixed columns).
 * Skips rows with missing fields or non-numeric amounts.
 */
export function parseCSV(csvContent: string): ExpenseRecord[] {
  const lines = csvContent.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  // Try header-based parsing first
  const headerRecords = parseWithHeaders(lines);
  if (headerRecords.length > 0) return headerRecords;

  // Fall back to bank statement format
  return parseBankStatement(lines);
}

function parseWithHeaders(lines: string[]): ExpenseRecord[] {
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
