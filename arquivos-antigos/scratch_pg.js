const { Client } = require('pg');

async function run() {
  // Conexão direta com a NeonTech (PostgreSQL)
  const client = new Client({ 
    connectionString: 'postgresql://neondb_owner:npg_5ChjNKHrTD0i@ep-twilight-poetry-acz3eind-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require' 
  });
  
  try {
    await client.connect();
    console.log('--- CONEXÃO ESTABELECIDA. INICIANDO VARREDURA DE INTEGRIDADE ---');

    // Mapeamento de problemas na Tabela Equipamentos
    const res = await client.query(`
      SELECT id, patrimonio, numero_serie as "numeroSerie", 
             tipo_equipamento_id, status_id, secao_id, disponibilidade_id 
      FROM equipamentos
    `);
    
    const equipamentos = res.rows;
    let duplicadosPatrimonio = {};
    let duplicadosSerie = {};
    let emptySerie = 0;
    let lowerCasePatrimonio = 0;
    let whiteSpaces = 0;
    let foreignKeysIncorretas = 0;
    
    for(let e of equipamentos) {
      if(!e.patrimonio) continue;

      // Duplicados
      duplicadosPatrimonio[e.patrimonio] = (duplicadosPatrimonio[e.patrimonio] || 0) + 1;
      
      if(e.numeroSerie && e.numeroSerie.trim() !== '') {
        const serieLimpa = e.numeroSerie.trim();
        duplicadosSerie[serieLimpa] = (duplicadosSerie[serieLimpa] || 0) + 1;
      } else {
        emptySerie++;
      }
      
      // Maiúsculas
      if(e.patrimonio !== e.patrimonio.toUpperCase()) lowerCasePatrimonio++;
      
      // Espaços Ocultos
      if(e.patrimonio !== e.patrimonio.trim() || (e.numeroSerie && e.numeroSerie !== e.numeroSerie.trim())) {
        whiteSpaces++;
      }

      // Integridade de Relacionamentos (Nulls onde não deveriam existir)
      if(!e.tipo_equipamento_id || !e.status_id || !e.secao_id || !e.disponibilidade_id) {
        foreignKeysIncorretas++;
      }
    }
    
    const dupsPat = Object.keys(duplicadosPatrimonio).filter(k => duplicadosPatrimonio[k] > 1);
    const dupsSerie = Object.keys(duplicadosSerie).filter(k => duplicadosSerie[k] > 1 && k !== 'N/A' && k !== 'S/N' && k !== '-');
    
    console.log('---------------------------------------------------------');
    console.log('Total de Equipamentos Analisados:', equipamentos.length);
    console.log('Patrimônios Duplicados:', dupsPat.length > 0 ? dupsPat.join(', ') : 'Nenhum (0)');
    console.log('Números de Série Duplicados:', dupsSerie.length);
    if(dupsSerie.length > 0) console.log(' -> Exemplo de Séries Duplicadas:', dupsSerie.slice(0, 5).join(', '));
    console.log('Equipamentos Sem Número de Série (ou em branco):', emptySerie);
    console.log('Patrimônios Fora do Padrão (Minúsculo):', lowerCasePatrimonio);
    console.log('Espaços em Branco Ocultos Detectados (Patrimônio ou Série):', whiteSpaces);
    console.log('Registros com Vínculos Essenciais Nulos (FK Missing):', foreignKeysIncorretas);
    console.log('---------------------------------------------------------');

  } catch (error) {
    console.error('Erro de Diagnóstico:', error.message);
  } finally {
    await client.end();
  }
}

run();
