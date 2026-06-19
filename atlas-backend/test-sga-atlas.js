const { Pool } = require('pg');
const pool = new Pool({
  host: '10.3.0.198',
  port: 5432,
  user: 'postgres',
  password: 'qgJIpL1Y7>BLW_<P}J#xJH8E+Poe|H\")',
  database: 'ambiente',
});

async function run() {
  try {
    const res = await pool.query(`SELECT id_sistema, nome FROM mseg.sistema WHERE nome ILIKE '%ATLAS%';`);
    console.log("Sistema ATLAS:", res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}
run();
