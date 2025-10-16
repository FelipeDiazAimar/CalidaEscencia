const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with service role key for admin operations
const supabaseUrl = 'https://jhnbtplhecbpfryszdju.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpobmJ0cGxoZWNicGZyeXN6ZGp1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTQxODI1MywiZXhwIjoyMDc0OTk0MjUzfQ.YdmMcvagQCS5TV8X77E0ZiB--Bxuu4AtofWIAHHXi0E';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixCategoriesRLS() {
  try {
    console.log('Fixing RLS policies for categories table...');

    // SQL to fix RLS policies for categories
    const sql = `
      -- Enable RLS on categories table
      ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

      -- Drop existing policies that depend on users table
      DROP POLICY IF EXISTS "Admins can manage categories" ON public.categories;

      -- Create separate policies for each operation
      -- SELECT policy (public read access)
      CREATE POLICY "Anyone can view categories" ON public.categories
      FOR SELECT USING (true);

      -- INSERT policy (authenticated users can create)
      CREATE POLICY "Authenticated users can insert categories" ON public.categories
      FOR INSERT WITH CHECK (auth.jwt() IS NOT NULL);

      -- UPDATE policy (authenticated users can update)
      CREATE POLICY "Authenticated users can update categories" ON public.categories
      FOR UPDATE USING (auth.jwt() IS NOT NULL);

      -- DELETE policy (authenticated users can delete)
      CREATE POLICY "Authenticated users can delete categories" ON public.categories
      FOR DELETE USING (auth.jwt() IS NOT NULL);
    `;

    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql });

    if (error) {
      console.error('Error executing SQL:', error);
      return;
    }

    console.log('✅ Categories RLS policies fixed successfully!');
    console.log('Now using separate policies for SELECT, INSERT, UPDATE, DELETE operations.');

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

fixCategoriesRLS();