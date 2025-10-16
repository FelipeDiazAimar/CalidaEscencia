const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function runMigration() {
  try {
    // Load environment variables
    require('dotenv').config({ path: '.env.local' });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase environment variables');
      console.log('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
      console.log('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseKey);
      return;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Read the SQL file
    const sql = fs.readFileSync('fix_sale_items_rls.sql', 'utf8');
    console.log('Running migration...');
    console.log('SQL:', sql);

    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql });

    if (error) {
      console.error('Migration failed:', error);
      return;
    }

    console.log('Migration completed successfully:', data);

  } catch (error) {
    console.error('Error running migration:', error);
  }
}

runMigration();