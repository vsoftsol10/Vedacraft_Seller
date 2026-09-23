import "dotenv/config";
import { supabase } from "../src/config/supabase.js";
import { encryptBankAccountNumber } from "../src/services/bankCrypto.js";

const table = "seller_applications";
const fields = "id, account_number, account_number_encrypted, account_number_last4";

const matchingRows = async () => {
  const { data, error } = await supabase
    .from(table)
    .select(fields)
    .not("account_number", "is", null)
    .neq("account_number", "")
    .or("account_number_encrypted.is.null,account_number_last4.is.null");
  if (error) throw error;
  return data;
};

const backfillRow = async (seller) => {
  const accountNumber = String(seller.account_number ?? "").trim();
  if (!/^\d{9,18}$/.test(accountNumber)) {
    throw new Error(`Seller application ${seller.id} has an invalid legacy account number and was not updated.`);
  }

  // Only supply fields that were absent in the row read above. The matching null
  // predicates make the update a no-op if another process fills either field first.
  const payload = {};
  if (seller.account_number_encrypted == null) {
    payload.account_number_encrypted = encryptBankAccountNumber(accountNumber);
  }
  if (seller.account_number_last4 == null) {
    payload.account_number_last4 = accountNumber.slice(-4);
  }

  let query = supabase.from(table).update(payload).eq("id", seller.id);
  if (seller.account_number_encrypted == null) {
    query = query.is("account_number_encrypted", null);
  } else {
    query = query.not("account_number_encrypted", "is", null);
  }
  if (seller.account_number_last4 == null) {
    query = query.is("account_number_last4", null);
  } else {
    query = query.not("account_number_last4", "is", null);
  }

  const { data, error } = await query.select("id");
  if (error) throw error;
  if (!data?.length) return false;

  console.log(`Bank account encryption backfilled for seller application ${seller.id}.`);
  return true;
};

const main = async () => {
  const sellers = await matchingRows();
  let updated = 0;
  for (const seller of sellers) {
    if (await backfillRow(seller)) updated += 1;
  }
  console.log(`Bank account encryption backfill complete. Rows updated: ${updated}.`);
};

main().catch((error) => {
  console.error("Bank account encryption backfill failed:", error.message);
  process.exitCode = 1;
});
