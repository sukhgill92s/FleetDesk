-- 0005: Expense approval workflow for owners.
--
-- approved = TRUE   → owner approved, counts toward pay
-- approved = FALSE  → owner rejected, does NOT count toward pay
-- approved = NULL   → pending (old rows stay NULL; the app treats NULL as approved
--                     so existing data keeps working)
--
-- Existing RLS policies ("for all") cover the new column automatically.

alter table public.expenses
  add column if not exists approved boolean;
