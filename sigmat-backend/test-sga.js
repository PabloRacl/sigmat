const { Pool } = require('pg');

async function testSGA() {
  const pool = new Pool({
    host: '10.3.0.198',
    port: 5432,
    user: 'postgres',
    password: 'qgJIpL1Y7>BLW_<P}J#xJH8E+Poe|H")',
    database: 'ambiente',
    connectionTimeoutMillis: 5000
  });

  try {
    const res = await pool.query(`
        SELECT 
          u.nome, 
          u.cpf, 
          u.ativo, 
          p.nome AS perfil, 
          p.id_perfil, 
          s.id_sistema, 
          s.nome AS sistema
        FROM mseg.usuario_perfil up
        JOIN mseg.usuario u ON up.id_usuario = u.id_usuario
        JOIN mseg.perfil p ON up.id_perfil = p.id_perfil
        JOIN mseg.sistema s ON up.id_sistema = s.id_sistema
        LIMIT 1;
    `);
    console.log('SGA Success:', res.rows[0]);
  } catch (err) {
    console.log('SGA ERROR', err.message);
  } finally {
    await pool.end();
  }
}

testSGA();
