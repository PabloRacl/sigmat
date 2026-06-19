const { Pool } = require('pg');

async function listOMEs() {
  const pool = new Pool({
    host: '10.3.0.11',
    port: 5432,
    user: 'postgres',
    password: '123',
    database: 'teste',
    connectionTimeoutMillis: 5000
  });

  try {
    const res = await pool.query(`SELECT DISTINCT ome FROM "pessoa_cadastro_view" WHERE ome IS NOT NULL ORDER BY ome;`);
    console.log('Total OMEs:', res.rows.length);
    console.log(JSON.stringify(res.rows.map(r => r.ome), null, 2));
  } catch (err) {
    console.log('ERROR', err.message);
  } finally {
    await pool.end();
  }
}

listOMEs();
