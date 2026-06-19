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
    const res = await pool.query(`
      SELECT 
        u.cpf, 
        s.id_sistema, 
        s.nome AS sistema
      FROM mseg.usuario_perfil up
      JOIN mseg.usuario u ON up.id_usuario = u.id_usuario
      JOIN mseg.sistema s ON up.id_sistema = s.id_sistema
      LIMIT 20;
    `);
    console.log("Amostra de permissoes SGA:", res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}
run();
