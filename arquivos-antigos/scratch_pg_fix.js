const { Client } = require('pg');

async function run() {
  const client = new Client({ connectionString: 'postgresql://neondb_owner:npg_5ChjNKHrTD0i@ep-twilight-poetry-acz3eind-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require' });
  await client.connect();

  console.log('--- REVELANDO ANOMALIAS ---');
  
  // 1. Procurar os equipamentos com o serial duplicado
  const serieDuplicado = await client.query("SELECT id, patrimonio, secao_id FROM equipamentos WHERE numero_serie = '01041548050035'");
  console.log('\\n[!] Equipamentos com o Serial 01041548050035:');
  console.table(serieDuplicado.rows);

  // 2. Procurar patrimônios em minúsculo e corrigi-los
  const patMinusculo = await client.query("SELECT id, patrimonio FROM equipamentos WHERE patrimonio != UPPER(patrimonio)");
  console.log('\\n[!] Equipamentos com Patrimônio fora do padrão ANSI:');
  console.table(patMinusculo.rows);

  if(patMinusculo.rows.length > 0) {
    console.log('\\nAplicando UPDATE para uppercase...');
    await client.query("UPDATE equipamentos SET patrimonio = UPPER(patrimonio) WHERE patrimonio != UPPER(patrimonio)");
    console.log('Corrigido com sucesso!');
  }

  await client.end();
}
run();
