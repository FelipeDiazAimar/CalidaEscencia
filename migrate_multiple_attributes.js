const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with service role key for admin operations
const supabaseUrl = 'https://jhnbtplhecbpfryszdju.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpobmJ0cGxoZWNicGZyeXN6ZGp1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTQxODI1MywiZXhwIjoyMDc0OTk0MjUzfQ.YdmMcvagQCS5TV8X77E0ZiB--Bxuu4AtofWIAHHXi0E';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function migrateMultipleAttributes() {
  try {
    console.log('🚀 Starting migration to support multiple attributes per product...');

    // Read the SQL file
    const fs = require('fs');
    const path = require('path');
    const sqlPath = path.join(__dirname, 'migrate_multiple_attributes.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('📄 SQL file loaded, executing migration...');

    // Execute the SQL using Supabase's rpc function
    const { data, error } = await supabase.rpc('exec_sql', { sql });

    if (error) {
      console.error('❌ Error executing migration:', error);
      return;
    }

    console.log('✅ Migration completed successfully!');
    console.log('🎉 Products can now have multiple attributes with stock per attribute combination.');

  } catch (error) {
    console.error('❌ Unexpected error during migration:', error);
  }
}

migrateMultipleAttributes();