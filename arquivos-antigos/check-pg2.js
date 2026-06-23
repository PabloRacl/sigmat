const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://atlas_p:1V%3ETn%7BO%2FUbR%24@10.3.0.217:5432/atlas?schema=public' });
pool.query("SELECT id, nome FROM status_equipamento WHERE nome ILIKE 'Manutenção'").then(res => {
  console.log("ILIKE Manutenção:", res.rows);
  return pool.query("SELECT id, nome FROM status_equipamento WHERE nome ILIKE '%Manuten%'");
}).then(res => {
  console.log("ILIKE %Manuten%:", res.rows);
  return pool.query("SELECT * FROM ordem_servico ORDER BY id DESC LIMIT 1");
}).then(res => {
  console.log("Ultima OS:", res.rows);
  pool.end();
});
