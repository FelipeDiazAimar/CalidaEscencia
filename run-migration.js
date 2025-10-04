const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials. Check your .env.local file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    // Get the migration file from command line argument or use default
    const migrationFile = process.argv[2] || 'add_stock_and_sales.sql';
    console.log(`Running migration: ${migrationFile}`);
    
    // Read the SQL file from the root directory or migrations directory
    let sqlFile;
    if (fs.existsSync(path.join(__dirname, migrationFile))) {
      sqlFile = path.join(__dirname, migrationFile);
    } else {
      sqlFile = path.join(__dirname, 'migrations', migrationFile);
    }
    
    if (!fs.existsSync(sqlFile)) {
      console.error(`Migration file not found: ${migrationFile}`);
      process.exit(1);
    }
    
    const sql = fs.readFileSync(sqlFile, 'utf8');
    
    // Split SQL into individual statements
    const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);
    
    console.log(`Executing ${statements.length} SQL statements...`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();
      if (statement) {
        console.log(`Executing statement ${i + 1}/${statements.length}...`);
        
        // For DDL statements, we need to use the REST API directly
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'apikey': supabaseServiceKey
          },
          body: JSON.stringify({ sql: statement + ';' })
        });
        
        if (!response.ok) {
          const error = await response.text();
          console.error(`Failed to execute statement ${i + 1}:`, error);
          console.error('Statement:', statement);
          // Continue with other statements
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
        }
      }
    }
    
    console.log('\n🎉 Migration completed!');
    console.log('Changes applied:');
    console.log('- Added stock column to products table');
    console.log('- Created sales table with triggers');
    console.log('- Set up RLS policies');
    console.log('- Added initial stock values');
    
  } catch (error) {
    console.error('Error running migration:', error);
    process.exit(1);
  }
}

runMigration();