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
    const login = process.argv[2];
    
    if (login) {
      const sol = await pool.query(
        `SELECT * FROM solicitacoes_acesso WHERE login = $1 ORDER BY "created_at" DESC LIMIT 1`,
        [login]
      );
      
      if (sol.rows.length === 0) {
        console.log('\n⚠️ Nenhuma solicitação encontrada para o login:', login);
      } else {
        const s = sol.rows[0];
        console.log('\n📋 Solicitação encontrada:', s.nome, '-', s.login);
        
        const u = await pool.query(`SELECT id FROM usuarios WHERE login = $1`, [login]);
        if (u.rows.length > 0) {
          await pool.query(`UPDATE usuarios SET autorizado = true, "updated_at" = NOW() WHERE login = $1`, [login]);
          console.log('✅ Usuário atualizado e autorizado!');
        } else {
          const novoUser = await pool.query(
            `INSERT INTO usuarios (login, matricula, nome, email, posto_graduacao, perfil, autorizado, "created_at", "updated_at") 
             VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW()) RETURNING id, login, nome, perfil`,
            [s.login, s.matricula || '000000', s.nome, s.email || 'email@pm.pe.gov.br', s.posto_graduacao || 'SD', s.perfil || 'USUARIO_BATALHAO', true]
          );
          
          await pool.query(`UPDATE solicitacoes_acesso SET status = 'APROVADA', "updated_at" = NOW() WHERE id = $1`, [s.id]);
          console.log('\n🎉 NOVO USUÁRIO CRIADO E APROVADO COM SUCESSO:', novoUser.rows[0]);
        }
      }
    }
  } catch(e) {
    console.error('Erro:', e.message);
  } finally {
    await pool.end();
  }
}
run();
