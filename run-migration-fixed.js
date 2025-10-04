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

async function createExecSqlFunction() {
  const createFunctionSQL = `
    CREATE OR REPLACE FUNCTION public.exec_sql(sql text)
    RETURNS json AS $$
    BEGIN
      EXECUTE sql;
      RETURN json_build_object('success', true, 'message', 'SQL executed successfully');
    EXCEPTION
      WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'error', SQLERRM, 'sql', sql);
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
  `;

  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql: createFunctionSQL });
    if (error) {
      console.log('exec_sql function may already exist or we need to create it manually');
    } else {
      console.log('✅ exec_sql function created');
    }
  } catch (err) {
    console.log('exec_sql function may already exist');
  }
}

async function runMigration() {
  try {
    await createExecSqlFunction();

    // Get the migration file from command line argument
    const migrationFile = process.argv[2] || 'create_orders_table.sql';
    console.log(`Running migration: ${migrationFile}`);

    // Read the SQL file
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

    // Split SQL into individual statements (more carefully)
    const statements = sql.split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`Executing ${statements.length} SQL statements...`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement) {
        console.log(`Executing statement ${i + 1}/${statements.length}...`);

        try {
          const { data, error } = await supabase.rpc('exec_sql', { sql: statement + ';' });

          if (error) {
            console.error(`Failed to execute statement ${i + 1}:`, error);
            console.error('Statement:', statement);
          } else {
            console.log(`✅ Statement ${i + 1} executed successfully`);
          }
        } catch (err) {
          console.error(`Error executing statement ${i + 1}:`, err.message);
          console.error('Statement:', statement);
        }
      }
    }

    console.log('\n🎉 Migration completed!');
    console.log('Orders tables should now be created.');

  } catch (error) {
    console.error('Error running migration:', error);
    process.exit(1);
  }
}

runMigration();