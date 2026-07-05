-- Keep cash ledger amounts exact and make source-owned transactions disappear
-- with their record/expense source.
ALTER TABLE "transactions" DROP CONSTRAINT IF EXISTS "transactions_record_id_fkey";
ALTER TABLE "transactions" DROP CONSTRAINT IF EXISTS "transactions_expense_id_fkey";

ALTER TABLE "records"
  ALTER COLUMN "price" TYPE DECIMAL(12, 2) USING ROUND("price"::numeric, 2);

ALTER TABLE "expenses"
  ALTER COLUMN "amount" TYPE DECIMAL(12, 2) USING ROUND("amount"::numeric, 2);

ALTER TABLE "transactions"
  ALTER COLUMN "amount" TYPE DECIMAL(12, 2) USING ROUND("amount"::numeric, 2);

ALTER TABLE "transactions"
  ADD CONSTRAINT "transactions_record_id_fkey"
  FOREIGN KEY ("record_id") REFERENCES "records"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "transactions"
  ADD CONSTRAINT "transactions_expense_id_fkey"
  FOREIGN KEY ("expense_id") REFERENCES "expenses"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "transactions_payment_type_transaction_type_created_at_idx"
  ON "transactions"("payment_type", "transaction_type", "created_at");
