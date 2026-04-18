# Tasks

## Task 1: Project Setup

- [ ] 1.1 Initialize Next.js project with TypeScript
- [ ] 1.2 Install dependencies (fast-check, vitest, @types/node)
- [ ] 1.3 Configure vitest in vitest.config.ts
- [ ] 1.4 Create .env.example with ANTHROPIC_API_KEY and ELEVENLABS_API_KEY placeholders

## Task 2: Core Library — CSV Parser

- [ ] 2.1 Create `lib/csvParser.ts` with `parseCSV` function that extracts ExpenseRecord[] from CSV content
- [ ] 2.2 Implement header row detection and column mapping (supports any column order)
- [ ] 2.3 Implement row validation — skip rows with missing fields or non-numeric amounts
- [ ] 2.4 Create `formatCSV` function for converting ExpenseRecord[] back to CSV string
- [ ] 2.5 Write property-based tests for CSV parser (Properties 1–4)
  - [ ] 2.5.1 ⚙️ PBT: Property 1 — CSV round-trip fidelity (formatCSV → parseCSV produces equivalent records)
  - [ ] 2.5.2 ⚙️ PBT: Property 2 — Valid CSV rows produce complete records with date, description, amount
  - [ ] 2.5.3 ⚙️ PBT: Property 3 — Invalid rows are skipped, output count equals valid input row count
  - [ ] 2.5.4 ⚙️ PBT: Property 4 — Header column order independence
- [ ] 2.6 Write unit tests for CSV parser edge cases (empty file, header-only, single row)

## Task 3: Core Library — Request Validator

- [ ] 3.1 Create `lib/validator.ts` with `validateMethod` function (returns 405 for non-POST)
- [ ] 3.2 Implement `validateAnalyzeBody` (checks for file presence and valid CSV)
- [ ] 3.3 Implement `validateSpeakBody` (checks for non-empty text field)
- [ ] 3.4 Implement `validateChatBody` (checks for question and expenseData fields)
- [ ] 3.5 Write property-based test for method validation (Property 6)
  - [ ] 3.5.1 ⚙️ PBT: Property 6 — Non-POST method rejection across all endpoints

## Task 4: Core Library — API Key Config

- [ ] 4.1 Create `lib/config.ts` with `getApiKeys` function that reads env vars
- [ ] 4.2 Implement validation — throw descriptive error if required key is missing
- [ ] 4.3 Write unit tests for config (missing keys → error, present keys → returned)

## Task 5: External Service Clients

- [ ] 5.1 Create `lib/claude.ts` with `analyzeExpenses` function (sends expense data + system prompt to Claude API)
- [ ] 5.2 Implement `chatAboutExpenses` function in `lib/claude.ts`
- [ ] 5.3 Create `lib/elevenlabs.ts` with `synthesizeSpeech` function
- [ ] 5.4 Write unit tests for service clients with mocked HTTP responses (success and failure cases)

## Task 6: API Route — Analyze Endpoint

- [ ] 6.1 Create `pages/api/analyze.ts` route handler
- [ ] 6.2 Implement request flow: validate method → check API key → parse CSV → call Claude → return CategoryResult
- [ ] 6.3 Implement error responses (400, 405, 500, 502)
- [ ] 6.4 Write property-based test for CategoryResult structure (Property 5)
  - [ ] 6.4.1 ⚙️ PBT: Property 5 — CategoryResult response contains categories array, numeric riskScore, string summary
- [ ] 6.5 Write unit tests for analyze endpoint (valid CSV → 200, no file → 400, empty CSV → 400, Claude failure → 502, missing key → 500)

## Task 7: API Route — Speak Endpoint

- [ ] 7.1 Create `pages/api/speak.ts` route handler
- [ ] 7.2 Implement request flow: validate method → check API key → call ElevenLabs → return audio
- [ ] 7.3 Implement error responses (400, 405, 500, 502)
- [ ] 7.4 Write unit tests for speak endpoint (valid text → 200 audio, missing text → 400, empty text → 400, ElevenLabs failure → 502, missing key → 500)

## Task 8: API Route — Chat Endpoint

- [ ] 8.1 Create `pages/api/chat.ts` route handler
- [ ] 8.2 Implement request flow: validate method → check API key → call Claude → return plain text
- [ ] 8.3 Implement error responses (400, 405, 500, 502)
- [ ] 8.4 Write unit tests for chat endpoint (valid request → 200 text/plain, missing question → 400, missing data → 400, Claude failure → 502, missing key → 500)

## Task 9: Integration Tests

- [ ] 9.1 Write integration tests for analyze endpoint (verify Claude called with correct args, mocked)
- [ ] 9.2 Write integration tests for speak endpoint (verify ElevenLabs called with text, correct content-type)
- [ ] 9.3 Write integration tests for chat endpoint (verify Claude called with question + data, text/plain response)
