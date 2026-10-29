// One-off, idempotent DDL for the kitchen timer: adds orders.kitchen_received_at
// and backfills it from kitchen_printed_at for tickets already printed.
// Targeted DDL instead of drizzle-kit migrate (see docs/ARCHITECTURE.md §5).
//
//   npx tsx --env-file=.env.local scripts/add-kitchen-received-at.ts   # dev
//   npx tsx --env-file=.env.prod  scripts/add-kitchen-received-at.ts   # prod
//
// Apply to a DB BEFORE deploying code that reads the column: the orders board
// selects every column, so it errors against a DB without it.
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL!, { prepare: false, max: 1 });

async function main() {
  await sql`alter table orders add column if not exists kitchen_received_at timestamptz`;
  const filled = await sql`
    update orders set kitchen_received_at = kitchen_printed_at
    where kitchen_received_at is null and kitchen_printed_at is not null`;
  const [col] = await sql`
    select data_type from information_schema.columns
    where table_name = 'orders' and column_name = 'kitchen_received_at'`;
  console.log(`kitchen_received_at: ${col?.data_type ?? "MISSING"}; backfilled ${filled.count} row(s)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => sql.end());
