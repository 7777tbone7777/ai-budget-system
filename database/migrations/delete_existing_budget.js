const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

(async () => {
  const client = await pool.connect();
  try {
    const result = await client.query(
      'DELETE FROM budget_line_items WHERE production_id = $1',
      ['ce8f64eb-fdbc-4018-a3cf-7f66920daf8a']
    );
    console.log('✅ Deleted', result.rowCount, 'existing line items');
  } finally {
    client.release();
    await pool.end();
  }
})();
