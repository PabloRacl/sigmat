import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../banco-dados/prisma.service';
import * as xlsx from 'xlsx';

@Injectable()
export class ImportacaoService {
  constructor(private readonly prisma: PrismaService) {}

  async processarPlanilhaExcel(file: Express.Multer.File, usuarioId: number) {
    if (!file) {
      throw new BadRequestException('Nenhum arquivo enviado para importação.');
    }

    // 1. Decodifica o Buffer do Arquivo Excel
    const workbook = xlsx.read(file.buffer, { type: 'buffer' });
    const nomePrimeiraAba = workbook.SheetNames[0];
    const linhasBrutas = xlsx.utils.sheet_to_json(workbook.Sheets[nomePrimeiraAba], { defval: '' });

    if (!linhasBrutas || linhasBrutas.length === 0) {
      throw new BadRequestException('A planilha enviada está vazia ou ilegível.');
    }

    const relatorio = { 
      sucessos: 0, 
      erros: 0, 
      log: [] as any[] 
    };

    // 2. Padroniza os cabeçalhos para ignorar diferenças de caixa/espaço das seções
    const linhasLimpas = linhasBrutas.map((row: any) => {
      const newRow: any = {};
      Object.keys(row).forEach((key) => {
        const cleanKey = key.trim().toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '_');
        newRow[cleanKey] = row[key];
      });
      return newRow;
    });

    // 3. Processamento Linha a Linha (Partial Success / Fail-Safe)
    for (let i = 0; i < linhasLimpas.length; i++) {
      const row = linhasLimpas[i];
      const numeroDaLinha = i + 2; // +1 pelo cabeçalho, +1 porque começa em 0
      
      const patrimonioRaw = row['PATRIMONIO'];
      
      if (!patrimonioRaw || String(patrimonioRaw).trim() === '') {
        relatorio.erros++;
        relatorio.log.push({ linha: numeroDaLinha, status: 'ERRO', patrimonio: 'N/A', detalhe: 'Coluna Patrimônio em branco.' });
        continue;
      }

      const patrimonioLimpo = String(patrimonioRaw).trim().toUpperCase();
      
      try {
        await this.processarEquipamentoIndividual(row, patrimonioLimpo, usuarioId);
        relatorio.sucessos++;
        relatorio.log.push({ linha: numeroDaLinha, status: 'SUCESSO', patrimonio: patrimonioLimpo, detalhe: 'Equipamento salvo ou atualizado.' });
      } catch (error: any) {
        relatorio.erros++;
        relatorio.log.push({ linha: numeroDaLinha, status: 'ERRO', patrimonio: patrimonioLimpo, detalhe: error.message });
      }
    }

    // Grava log da operação massiva
    await this.prisma.logOperacao.create({
      data: {
        usuarioId: usuarioId,
        acao: 'BATCH_UPDATE',
        descricao: `Carga Massiva Executada via Excel. Sucessos: ${relatorio.sucessos}. Erros: ${relatorio.erros}.`,
        dadosAlterados: JSON.parse(JSON.stringify({ relatorio })),
        ip: 'SISTEMA_ETL'
      }
    });

    return relatorio;
  }

  // ------------------------------------------------------------------------------------------
  // LÓGICA DE NEGÓCIO E RESOLUÇÃO DE RELACIONAMENTOS PARA UM EQUIPAMENTO
  // ------------------------------------------------------------------------------------------
  private async processarEquipamentoIndividual(row: any, patrimonio: string, usuarioId: number) {
    
    // --- STATUS ---
    const statusNome = (row['STATUS'] || 'DISPONIVEL').toString().trim().toUpperCase();
    let statusDb = await this.prisma.statusEquipamento.findFirst({ where: { nome: statusNome } });
    if (!statusDb) {
      statusDb = await this.prisma.statusEquipamento.findFirst({ where: { nome: 'DISPONÍVEL' }});
      if (!statusDb) throw new Error(`Status base 'DISPONÍVEL' não encontrado no banco.`);
    }

    // --- DISPONIBILIDADE ---
    let dispDb = await this.prisma.disponibilidade.findFirst({ where: { nome: 'ALMOXARIFADO' } });
    if (!dispDb) {
      const fallbackDisp = await this.prisma.disponibilidade.findFirst();
      if(fallbackDisp) dispDb = fallbackDisp;
      else throw new Error(`Nenhuma disponibilidade cadastrada no banco.`);
    }

    // --- TIPO DE EQUIPAMENTO ---
    const tipoNome = (row['TIPO'] || row['TIPO_EQUIPAMENTO'] || '').toString().trim().toUpperCase();
    if (!tipoNome) throw new Error('Coluna TIPO é obrigatória.');
    let tipoDb = await this.prisma.tipoEquipamento.findUnique({ where: { nome: tipoNome } });
    if (!tipoDb) {
      tipoDb = await this.prisma.tipoEquipamento.create({ data: { nome: tipoNome } });
    }

    // --- MARCA E MODELO (Auto-Cadastro) ---
    const marcaNome = (row['MARCA'] || '').toString().trim().toUpperCase();
    let marcaId = null;
    if (marcaNome) {
      let marcaDb = await this.prisma.marca.findUnique({ where: { nome: marcaNome } });
      if (!marcaDb) {
        marcaDb = await this.prisma.marca.create({ data: { nome: marcaNome } });
      }
      marcaId = marcaDb.id;
    }

    const modeloNome = (row['MODELO'] || '').toString().trim().toUpperCase();
    let modeloId = null;
    if (modeloNome && marcaId) {
      let modeloDb = await this.prisma.modelo.findFirst({ where: { nome: modeloNome, marcaId: marcaId } });
      if (!modeloDb) {
        modeloDb = await this.prisma.modelo.create({ data: { nome: modeloNome, marcaId: marcaId } });
      }
      modeloId = modeloDb.id;
    }

    // --- REGRA DO ROTEAMENTO DE Batalhão E SSCOM ---
    const siglaBatalhao = (row['BATALHAO'] || row['UNIDADE'] || '').toString().trim().toUpperCase();
    const siglaSecao = (row['SECAO'] || '').toString().trim().toUpperCase();
    
    let batalhaoId = null;
    let secaoId = null;

    if (!siglaBatalhao && !siglaSecao) {
      throw new Error('É obrigatório informar Batalhão ou Seção para o roteamento do equipamento.');
    }

    if (siglaBatalhao) {
      const batDb = await this.prisma.batalhao.findUnique({ where: { sigla: siglaBatalhao } });
      if (!batDb) throw new Error(`Batalhão '${siglaBatalhao}' não cadastrado no banco.`);
      batalhaoId = batDb.id;
    }

    if (siglaSecao) {
      const secDb = await this.prisma.secao.findUnique({ where: { sigla: siglaSecao } });
      if (!secDb) throw new Error(`Seção '${siglaSecao}' não cadastrada no banco.`);
      secaoId = secDb.id;
      if (!batalhaoId && secDb.batalhaoId) batalhaoId = secDb.batalhaoId; 
    } else {
      // REGRA: SE NÃO PASSOU SEÇÃO, PROCURAR A SSCOM DESTE BATALHÃO!
      const sscom = await this.prisma.secao.findFirst({ 
        where: { batalhaoId: batalhaoId, sigla: { contains: 'SSCOM', mode: 'insensitive' } } 
      });
      if (sscom) {
        secaoId = sscom.id;
      } else {
        // Se não tiver SSCOM, pega a primeira seção ligada ao Batalhão para evitar orfandade total
        const fallbackSecao = await this.prisma.secao.findFirst({ where: { batalhaoId: batalhaoId } });
        if(fallbackSecao) secaoId = fallbackSecao.id;
        else throw new Error(`Batalhão '${siglaBatalhao}' não possui seções (nem SSCOM) cadastradas.`);
      }
    }

    // --- UPSERT (Mecanismo de Prevenção de Colisão) ---
    const numeroSerie = (row['SERIE'] || row['NUMERO_SERIE'] || '').toString().trim() || null;
    const observacao = (row['OBSERVACAO'] || row['OBS'] || '').toString().trim() || null;

    const dadosEquipamento = {
      patrimonio: patrimonio,
      numeroSerie: numeroSerie,
      tipoEquipamentoId: tipoDb.id,
      marcaId: marcaId,
      modeloId: modeloId,
      statusId: statusDb.id,
      secaoId: secaoId,
      batalhaoId: batalhaoId,
      disponibilidadeId: dispDb.id,
      observacao: observacao,
    };

    await this.prisma.equipamento.upsert({
      where: { patrimonio: patrimonio },
      update: dadosEquipamento,
      create: dadosEquipamento,
    });
  }
}
