const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://atlas_p:1V%3ETn%7BO%2FUbR%24@10.3.0.217:5432/atlas?schema=public' });
pool.query('SELECT id, nome FROM status_equipamento').then(res => {
  console.log(res.rows);
  pool.end();
});
