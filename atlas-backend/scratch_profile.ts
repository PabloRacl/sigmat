import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function diagnosticarBanco() {
  console.log('=== INICIANDO VARREDURA PROFUNDA DE INTEGRIDADE (EQUIPAMENTOS) ===');
  
  const equipamentos = await prisma.equipamento.findMany();
  
  let duplicadosPatrimonio: Record<string, number> = {};
  let duplicadosSerie: Record<string, number> = {};
  
  let semSerie = 0;
  let semPatrimonio = 0;
  let maiusculasIncorretas = 0;
  let espacosOcultos = 0;
  let chavesEstrangeirasQuebradas = 0;
  
  for (const eq of equipamentos) {
    if (!eq.patrimonio) {
      semPatrimonio++;
    } else {
      duplicadosPatrimonio[eq.patrimonio] = (duplicadosPatrimonio[eq.patrimonio] || 0) + 1;
      
      if (eq.patrimonio !== eq.patrimonio.toUpperCase()) maiusculasIncorretas++;
      if (eq.patrimonio !== eq.patrimonio.trim()) espacosOcultos++;
    }
    
    if (!eq.numeroSerie || eq.numeroSerie.trim() === '') {
      semSerie++;
    } else {
      const serie = eq.numeroSerie.trim();
      duplicadosSerie[serie] = (duplicadosSerie[serie] || 0) + 1;
      if (eq.numeroSerie !== serie) espacosOcultos++;
    }

    if (!eq.tipoEquipamentoId || !eq.statusId || !eq.secaoId || !eq.disponibilidadeId) {
      chavesEstrangeirasQuebradas++;
    }
  }

  const dupPat = Object.keys(duplicadosPatrimonio).filter(k => duplicadosPatrimonio[k] > 1);
  const dupSer = Object.keys(duplicadosSerie).filter(k => duplicadosSerie[k] > 1);

  console.log('Total de Registros Analisados:', equipamentos.length);
  console.log('Patrimônios Duplicados:', dupPat.length > 0 ? dupPat.join(', ') : 'Nenhum');
  console.log('Séries Duplicadas:', dupSer.length > 0 ? dupSer.join(', ') : 'Nenhuma');
  console.log('Equipamentos SEM Número de Série:', semSerie);
  console.log('Equipamentos com Patrimônios em Minúsculo:', maiusculasIncorretas);
  console.log('Equipamentos com Espaços em Branco Ocultos:', espacosOcultos);
  console.log('Registros Corrompidos (Faltando ID Essencial):', chavesEstrangeirasQuebradas);
  
  console.log('=== VARREDURA CONCLUÍDA ===');
}

diagnosticarBanco()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
