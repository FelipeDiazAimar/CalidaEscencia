const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with service role key for admin operations
const supabaseUrl = 'https://jhnbtplhecbpfryszdju.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpobmJ0cGxoZWNicGZyeXN6ZGp1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTQxODI1MywiZXhwIjoyMDc0OTk0MjUzfQ.YdmMcvagQCS5TV8X77E0ZiB--Bxuu4AtofWIAHHXi0E';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixSubcategoriesRLSClean() {
  try {
    console.log('Cleaning and fixing RLS policies for subcategories table...');

    // SQL to clean and fix RLS policies
    const sql = `
      -- Enable RLS on subcategories table (if not already enabled)
      ALTER TABLE subcategories ENABLE ROW LEVEL SECURITY;

      -- Drop ALL existing policies for subcategories
      DROP POLICY IF EXISTS "Admins can manage subcategories" ON public.subcategories;
      DROP POLICY IF EXISTS "Authenticated users can manage subcategories" ON public.subcategories;
      DROP POLICY IF EXISTS "Public can view subcategories" ON public.subcategories;
      DROP POLICY IF EXISTS "Public can view active subcategories" ON public.subcategories;

      -- Create policy for authenticated users to manage subcategories
      CREATE POLICY "Authenticated users can manage subcategories" ON public.subcategories
      FOR ALL USING (auth.role() = 'authenticated');

      -- Create policy for public read access to all subcategories
      CREATE POLICY "Public can view subcategories" ON public.subcategories
      FOR SELECT USING (true);
    `;

    // Execute the SQL using Supabase's rpc function
    const { data, error } = await supabase.rpc('exec_sql', { sql });

    if (error) {
      console.error('Error executing SQL:', error);
      return;
    }

    console.log('✅ RLS policies cleaned and fixed successfully!');
    console.log('All existing policies removed and new ones created.');

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

fixSubcategoriesRLSClean();