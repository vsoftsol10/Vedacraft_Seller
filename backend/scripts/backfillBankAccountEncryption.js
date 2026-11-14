import "dotenv/config";
import { supabase } from "../src/config/supabase.js";
import { encryptBankAccountNumber } from "../src/services/bankCrypto.js";

const isDryRun = process.argv.includes("--dry-run");
const table = "seller_applications";
const fields = "id, account_number, account_number_encrypted, account_number_last4";

/**
 * Candidate Selection:
 * Select rows where plaintext account_number is not null and not empty, AND
 * - account_number_encrypted IS NULL (needs encryption), OR
 * - (account_number_last4 IS NULL AND account_number matches valid 9-18 digits) (needs last4 backfilled).
 * 
 * Crucially, malformed records that have already been encrypted with account_number_last4 = NULL
 * are NOT re-selected.
 */
const matchingRows = async () => {
  const { data, error } = await supabase
    .from(table)
    .select(fields)
    .not("account_number", "is", null)
    .neq("account_number", "");
  if (error) throw error;

  const candidates = (data || []).filter((row) => {
    // 1. Missing encryption -> candidate
    if (row.account_number_encrypted == null) return true;

    // 2. Already encrypted, but check if valid numeric and missing last4 -> candidate for completing last4
    const rawValue = String(row.account_number ?? "");
    const isStandardNumeric = /^\d{9,18}$/.test(rawValue);
    if (isStandardNumeric && row.account_number_last4 == null) return true;

    // 3. Otherwise (e.g. malformed string that is already encrypted with last4 = null), do NOT select again
    return false;
  });

  return candidates;
};

const processRow = async (seller) => {
  // Requirement 5: Preserve original legacy values during encryption; do not trim or modify raw value.
  const rawValue = String(seller.account_number ?? "");
  if (rawValue.length === 0) {
    return { status: "skipped", reason: "Empty legacy value" };
  }

  const isStandardNumeric = /^\d{9,18}$/.test(rawValue);
  const payload = {};

  // Encrypt raw legacy value if missing
  if (seller.account_number_encrypted == null) {
    payload.account_number_encrypted = encryptBankAccountNumber(rawValue);
  }

  // Populate last4 ONLY if the account number is a valid numeric format
  // For malformed legacy strings, last4 remains NULL to prevent UI misrepresentation
  if (isStandardNumeric && seller.account_number_last4 == null) {
    payload.account_number_last4 = rawValue.slice(-4);
  }

  // Requirement 2: Prevent empty-payload database updates
  if (Object.keys(payload).length === 0) {
    return { status: "skipped", reason: "Nothing to update (already completed)" };
  }

  if (isDryRun) {
    const actionDesc = isStandardNumeric
      ? `Valid numeric -> Encrypt & set last4: ••••${rawValue.slice(-4)}`
      : `Malformed test/legacy -> Encrypt raw string, keep last4: null (Pending Owner Update)`;
    console.log(`[DRY-RUN] Candidate ${seller.id}: ${actionDesc}`);
    return { status: "simulated", isStandardNumeric };
  }

  // Idempotent conditional query:
  // If we're setting account_number_encrypted, make sure it's currently null
  // If we're setting account_number_last4, make sure it's currently null
  let query = supabase.from(table).update(payload).eq("id", seller.id);
  if (payload.account_number_encrypted) {
    query = query.is("account_number_encrypted", null);
  }
  if (payload.account_number_last4) {
    query = query.is("account_number_last4", null);
  }

  const { data, error } = await query.select("id");
  if (error) throw error;
  if (!data?.length) {
    return { status: "skipped", reason: "Row was concurrently modified or already satisfied predicates" };
  }

  console.log(`Updated seller application ${seller.id} (Standard numeric: ${isStandardNumeric}).`);
  return { status: "updated", isStandardNumeric };
};

const main = async () => {
  console.log(`Starting bank account encryption backfill${isDryRun ? " (DRY-RUN MODE - NO DB WRITES)" : ""}...`);

  const sellers = await matchingRows();
  console.log(`Found ${sellers.length} candidate seller application(s) requiring backfill.\n`);

  let validCount = 0;
  let malformedCount = 0;
  let skippedCount = 0;
  const failures = [];

  for (const seller of sellers) {
    try {
      const result = await processRow(seller);
      if (result.status === "skipped") {
        skippedCount += 1;
      } else if (result.isStandardNumeric) {
        validCount += 1;
      } else {
        malformedCount += 1;
      }
    } catch (err) {
      failures.push({ id: seller.id, reason: err.message });
      console.error(`[ERROR] Processing failed for application ${seller.id}: ${err.message}`);
    }
  }

  console.log("\n=======================================================");
  console.log("                   BACKFILL SUMMARY                    ");
  console.log("=======================================================");
  console.log(`Mode:                      ${isDryRun ? "DRY-RUN (Simulated)" : "LIVE EXECUTION"}`);
  console.log(`Total Candidates:          ${sellers.length}`);
  console.log(`Standard Numeric Rows:     ${validCount} (Encrypted + last4 populated)`);
  console.log(`Malformed / Legacy Rows:   ${malformedCount} (Encrypted + last4 left null)`);
  console.log(`Skipped (No payload):      ${skippedCount}`);
  console.log(`Failed:                    ${failures.length}`);
  console.log("=======================================================\n");

  if (failures.length > 0) {
    process.exitCode = 1;
  }
};

main().catch((error) => {
  console.error("Fatal error:", error.message);
  process.exitCode = 1;
});
