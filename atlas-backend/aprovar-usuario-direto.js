const fs = require('fs');
const env = {};
fs.readFileSync('.env', 'utf8').split('\n').forEach(l => {
  const [k, ...v] = l.split('=');
  if (k && v.length) env[k.trim()] = v.join('=').trim().replace(/^"|"$/g, '');
});

const { Pool } = require('pg');
const pool = new Pool({ connectionString: env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function run() {
  try {
    const login = process.argv[2]; // ex: 10360892400
    const nome = process.argv[3] || 'ADMINISTRADOR TESTE';
    
    if (login) {
      const u = await pool.query(`SELECT id FROM usuarios WHERE login = $1`, [login]);
      if (u.rows.length > 0) {
        await pool.query(`UPDATE usuarios SET autorizado = true, "updated_at" = NOW() WHERE login = $1`, [login]);
        console.log('✅ Usuário atualizado e autorizado com sucesso!');
      } else {
        const novoUser = await pool.query(
          `INSERT INTO usuarios (login, matricula, nome, email, posto_graduacao, perfil, autorizado, "created_at", "updated_at") 
           VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW()) RETURNING id, login, nome, perfil`,
          [login, '000000', nome, 'email@pm.pe.gov.br', 'SD', 'ADMIN_DTEC', true]
        );
        console.log('\n🎉 NOVO USUÁRIO CRIADO E APROVADO COM SUCESSO:', novoUser.rows[0]);
      }
    } else {
      console.log('Uso: node aprovar-usuario-direto.js <cpf> ["NOME COMPLETO"]');
    }
  } catch(e) {
    console.error('Erro:', e.message);
  } finally {
    await pool.end();
  }
}
run();
