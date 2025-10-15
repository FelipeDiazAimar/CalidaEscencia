const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with service role key for admin operations
const supabaseUrl = 'https://jhnbtplhecbpfryszdju.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpobmJ0cGxoZWNicGZyeXN6ZGp1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTQxODI1MywiZXhwIjoyMDc0OTk0MjUzfQ.YdmMcvagQCS5TV8X77E0ZiB--Bxuu4AtofWIAHHXi0E';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixSubcategoriesRLSCorrected() {
  try {
    console.log('Fixing RLS policies for subcategories table (corrected version)...');

    // SQL to fix RLS policies (corrected - removed is_active reference)
    const sql = `
      -- Enable RLS on subcategories table
      ALTER TABLE subcategories ENABLE ROW LEVEL SECURITY;

      -- Drop existing policies if they exist
      DROP POLICY IF EXISTS "Admins can manage subcategories" ON public.subcategories;
      DROP POLICY IF EXISTS "Public can view subcategories" ON public.subcategories;

      -- Create policy for admins to manage subcategories
      CREATE POLICY "Admins can manage subcategories" ON public.subcategories
      FOR ALL USING (
          EXISTS (
              SELECT 1 FROM public.users
              WHERE id = auth.uid() AND role = 'admin'
          )
      );

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

    console.log('✅ RLS policies fixed successfully!');
    console.log('You should now be able to create subcategories without authorization errors.');

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

fixSubcategoriesRLSCorrected();