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

async function executeSQL(sql) {
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseServiceKey}`,
      'apikey': supabaseServiceKey
    },
    body: JSON.stringify({ sql })
  });

  return response;
}

async function createTables() {
  try {
    console.log('Creating orders tables...');

    // First, create the exec_sql function
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

    console.log('Creating exec_sql function...');
    const funcResponse = await executeSQL(createFunctionSQL);

    if (!funcResponse.ok) {
      console.log('exec_sql function creation failed, trying direct SQL execution...');
    } else {
      console.log('✅ exec_sql function created');
    }

    // Read the SQL file
    const sqlFile = path.join(__dirname, 'create_orders_table.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');

    // Split SQL into statements and execute them
    const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);

    console.log(`Executing ${statements.length} SQL statements...`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();
      if (statement && !statement.startsWith('--')) {
        console.log(`Executing statement ${i + 1}/${statements.length}...`);

        const response = await executeSQL(statement + ';');

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Failed to execute statement ${i + 1}:`, errorText);
          console.error('Statement:', statement);
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
        }
      }
    }

    console.log('\n🎉 Migration completed!');
    console.log('Orders tables should now be created.');

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

createTables();