const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with service role key for admin operations
const supabaseUrl = 'https://jhnbtplhecbpfryszdju.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpobmJ0cGxoZWNicGZyeXN6ZGp1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTQxODI1MywiZXhwIjoyMDc0OTk0MjUzfQ.YdmMcvagQCS5TV8X77E0ZiB--Bxuu4AtofWIAHHXi0E';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixSubcategoriesRLSSpecific() {
  try {
    console.log('Creating specific RLS policies for subcategories table...');

    // SQL to create specific policies for each operation
    const sql = `
      -- Enable RLS on subcategories table
      ALTER TABLE subcategories ENABLE ROW LEVEL SECURITY;

      -- Drop ALL existing policies (including the new ones we might have created)
      DROP POLICY IF EXISTS "Admins can manage subcategories" ON public.subcategories;
      DROP POLICY IF EXISTS "Authenticated users can manage subcategories" ON public.subcategories;
      DROP POLICY IF EXISTS "Public can view subcategories" ON public.subcategories;
      DROP POLICY IF EXISTS "Public can view active subcategories" ON public.subcategories;
      DROP POLICY IF EXISTS "Anyone can view subcategories" ON public.subcategories;
      DROP POLICY IF EXISTS "Authenticated users can insert subcategories" ON public.subcategories;
      DROP POLICY IF EXISTS "Authenticated users can update subcategories" ON public.subcategories;
      DROP POLICY IF EXISTS "Authenticated users can delete subcategories" ON public.subcategories;

      -- Create separate policies for each operation
      -- SELECT policy (public read access)
      CREATE POLICY "Anyone can view subcategories" ON public.subcategories
      FOR SELECT USING (true);

      -- INSERT policy (authenticated users can create)
      CREATE POLICY "Authenticated users can insert subcategories" ON public.subcategories
      FOR INSERT WITH CHECK (auth.jwt() IS NOT NULL);

      -- UPDATE policy (authenticated users can update)
      CREATE POLICY "Authenticated users can update subcategories" ON public.subcategories
      FOR UPDATE USING (auth.jwt() IS NOT NULL);

      -- DELETE policy (authenticated users can delete)
      CREATE POLICY "Authenticated users can delete subcategories" ON public.subcategories
      FOR DELETE USING (auth.jwt() IS NOT NULL);
    `;

    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql });

    if (error) {
      console.error('Error executing SQL:', error);
      return;
    }

    console.log('✅ Specific RLS policies created successfully!');
    console.log('Now using separate policies for SELECT, INSERT, UPDATE, DELETE operations.');

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

fixSubcategoriesRLSSpecific();