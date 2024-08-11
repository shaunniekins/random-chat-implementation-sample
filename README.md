# Test Random Chat Implementation

## Supabase Setup

1. Execute the SQL scripts in Supabase to create tables, function, and trigger.
2. Execute the following command:
   ```sql
   CREATE EXTENSION IF NOT EXISTS "pgcrypto";
   ```
3. Activate "Realtime" for all tables.

## Next.js Setup

1. Create a `.env` file in the root directory with the following content:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=<supabase-url>
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<supabase-anon-key>
   NEXT_PUBLIC_DATABASE_URL=<database-url>
   ```
