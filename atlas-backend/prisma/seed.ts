import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as xlsx from 'xlsx';
import * as path from 'path';
import * as fs from 'fs';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function parseExcelDate(value: any): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === 'number') {
    return new Date(Math.round((value - 25569) * 86400 * 1000));
  }
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

async function importDiretorias() {
  const filePath = path.join(__dirname, 'data', 'diretoria.xlsx');
  if (!fs.existsSync(filePath)) return;
  console.log('Importando Diretorias...');
  const workbook = xlsx.readFile(filePath);
  const data = xlsx.utils.sheet_to_json<any>(workbook.Sheets[workbook.SheetNames[0]]);
  
  let count = 0;
  for (const row of data) {
    const id = Number(row['ID_DIRETORIA']);
    const sigla = row['SIGLA'] ? String(row['SIGLA']).trim() : null;
    if (!id || !sigla) continue;

    try {
      await prisma.diretoria.upsert({
        where: { id: id },
        update: { sigla, nome: sigla },
        create: { id, sigla, nome: sigla }
      });
      count++;
    } catch (e) {
      console.log(`⚠️ Erro na Diretoria ID ${id}: ${(e as any).message}`);
    }
  }
  await prisma.$executeRawUnsafe(`SELECT setval('diretorias_id_seq', (SELECT MAX(id) FROM diretorias));`);
  console.log(`✅ ${count} Diretorias importadas!`);
}

async function importBatalhoes() {
  const filePath = path.join(__dirname, 'data', 'batalhao.xlsx');
  if (!fs.existsSync(filePath)) return;
  console.log('Importando Batalhões...');
  const workbook = xlsx.readFile(filePath);
  const data = xlsx.utils.sheet_to_json<any>(workbook.Sheets[workbook.SheetNames[0]]);

  let count = 0;
  for (const row of data) {
    const id = Number(row['ID_BATALHAO']);
    const sigla = row['SIGLA'] ? String(row['SIGLA']).trim() : null;
    let nome = row['NOME_BATALHAO'] ? String(row['NOME_BATALHAO']).trim() : null;
    const diretoriaId = row['ID_DIRETORIA'] ? Number(row['ID_DIRETORIA']) : null;
    const cidade = row['CIDADE'] ? String(row['CIDADE']).trim() : null;
    const endereco = row['ENDERECO'] ? String(row['ENDERECO']).trim() : null;

    if (!id || !sigla) continue;
    if (!nome) nome = sigla;

    if (diretoriaId) {
      await prisma.diretoria.upsert({
        where: { id: diretoriaId },
        update: {},
        create: { id: diretoriaId, sigla: `DIR-${diretoriaId}`, nome: `Pendente` }
      });
    }

    try {
      await prisma.batalhao.upsert({
        where: { id: id },
        update: { sigla, nome, diretoriaId, cidade, endereco },
        create: { id, sigla, nome, diretoriaId, cidade, endereco }
      });
      count++;
    } catch (e) {
      console.log(`⚠️ Pulando Batalhão duplicado/inválido: ID ${id}, Sigla ${sigla}`);
    }
  }
  await prisma.$executeRawUnsafe(`SELECT setval('batalhoes_id_seq', (SELECT MAX(id) FROM batalhoes));`);
  console.log(`✅ ${count} Batalhões importados!`);
}

async function importSecoes() {
  const filePath = path.join(__dirname, 'data', 'secao.xlsx');
  if (!fs.existsSync(filePath)) return;
  console.log('Importando Seções...');
  const workbook = xlsx.readFile(filePath);
  const data = xlsx.utils.sheet_to_json<any>(workbook.Sheets[workbook.SheetNames[0]]);
  
  let count = 0;
  for (const row of data) {
    const id = Number(row['ID_SECAO']);
    const sigla = row['SIGLA'] ? String(row['SIGLA']).trim() : null;
    let nome = row['NOME'] ? String(row['NOME']).trim() : null;
    const batalhaoId = row['ID_BATALHAO'] ? Number(row['ID_BATALHAO']) : null;
    const diretoriaId = row['ID_DIRETORIA'] ? Number(row['ID_DIRETORIA']) : null;

    if (!id || !sigla) continue;
    if (!nome) nome = sigla;

    try {
      await prisma.secao.upsert({
        where: { id: id },
        update: { sigla, nome, batalhaoId, diretoriaId },
        create: { id, sigla, nome, batalhaoId, diretoriaId }
      });
      count++;
    } catch (e) {
      console.log(`⚠️ Erro na Seção ID ${id}: ${(e as any).message}`);
    }
  }
  await prisma.$executeRawUnsafe(`SELECT setval('secoes_id_seq', (SELECT MAX(id) FROM secoes));`);
  console.log(`✅ ${count} Seções importadas!`);
}

async function importMarcas() {
  const filePath = path.join(__dirname, 'data', 'marca.xlsx');
  if (!fs.existsSync(filePath)) return;
  console.log('Importando Marcas...');
  const workbook = xlsx.readFile(filePath);
  const data = xlsx.utils.sheet_to_json<any>(workbook.Sheets[workbook.SheetNames[0]]);
  let count = 0;
  for (const row of data) {
    const id = Number(row['ID_MARCA']);
    const nome = row['NOME'] ? String(row['NOME']).trim() : null;
    if (!id || !nome) continue;
    try {
      await prisma.marca.upsert({
        where: { id: id },
        update: { nome },
        create: { id, nome }
      });
      count++;
    } catch (e) {
      console.log(`⚠️ Erro na Marca ID ${id}: ${(e as any).message}`);
    }
  }
  await prisma.$executeRawUnsafe(`SELECT setval('marcas_id_seq', (SELECT MAX(id) FROM marcas));`);
  console.log(`✅ ${count} Marcas importadas!`);
}

async function importModelos() {
  const filePath = path.join(__dirname, 'data', 'modelo.xlsx');
  if (!fs.existsSync(filePath)) return;
  console.log('Importando Modelos...');
  const workbook = xlsx.readFile(filePath);
  const data = xlsx.utils.sheet_to_json<any>(workbook.Sheets[workbook.SheetNames[0]]);
  let count = 0;
  for (const row of data) {
    const id = Number(row['ID_MODELO']);
    const nome = row['NOME'] ? String(row['NOME']).trim() : null;
    const marcaId = row['ID_MARCA'] ? Number(row['ID_MARCA']) : null;
    if (!id || !nome) continue;
    
    if (marcaId) {
      await prisma.marca.upsert({
        where: { id: marcaId },
        update: {},
        create: { id: marcaId, nome: `Marca Pendente ${marcaId}` }
      });
    }

    try {
      await prisma.modelo.upsert({
        where: { id: id },
        update: { nome, marcaId },
        create: { id, nome, marcaId }
      });
      count++;
    } catch (e) {
      console.log(`⚠️ Erro no Modelo ID ${id}: ${(e as any).message}`);
    }
  }
  await prisma.$executeRawUnsafe(`SELECT setval('modelos_id_seq', (SELECT MAX(id) FROM modelos));`);
  console.log(`✅ ${count} Modelos importados!`);
}

async function importTiposEquipamento() {
  const filePath = path.join(__dirname, 'data', 'tipo_equipamento.xlsx');
  if (!fs.existsSync(filePath)) return;
  console.log('Importando Tipos de Equipamento...');
  const workbook = xlsx.readFile(filePath);
  const data = xlsx.utils.sheet_to_json<any>(workbook.Sheets[workbook.SheetNames[0]]);
  let count = 0;
  for (const row of data) {
    const id = Number(row['ID_TIPO']);
    const nome = row['DESCRICAO'] ? String(row['DESCRICAO']).trim() : null;
    if (!id || !nome) continue;
    try {
      await prisma.tipoEquipamento.upsert({
        where: { id: id },
        update: { nome },
        create: { id, nome }
      });
      count++;
    } catch (e) {
      console.log(`⚠️ Erro no Tipo Equipamento ID ${id}: ${(e as any).message}`);
    }
  }
  await prisma.$executeRawUnsafe(`SELECT setval('tipos_equipamento_id_seq', (SELECT MAX(id) FROM tipos_equipamento));`);
  console.log(`✅ ${count} Tipos de Equipamento importados!`);
}

async function importStatusEquipamento() {
  const filePath = path.join(__dirname, 'data', 'status_equipamento.xlsx');
  if (!fs.existsSync(filePath)) return;
  console.log('Importando Status de Equipamento...');
  const workbook = xlsx.readFile(filePath);
  const data = xlsx.utils.sheet_to_json<any>(workbook.Sheets[workbook.SheetNames[0]]);
  let count = 0;
  for (const row of data) {
    const id = Number(row['ID_STATUS']);
    const nome = row['DESCRICAO'] ? String(row['DESCRICAO']).trim() : null;
    const descricaoAmigavel = row['DESCRICAO_AMIGAVEL'] ? String(row['DESCRICAO_AMIGAVEL']).trim() : null;
    const corEmoji = row['COR_EMOJI'] ? String(row['COR_EMOJI']).trim() : null;
    if (!id || !nome) continue;
    try {
      await prisma.statusEquipamento.upsert({
        where: { id: id },
        update: { nome, descricaoAmigavel, corEmoji },
        create: { id, nome, descricaoAmigavel, corEmoji }
      });
      count++;
    } catch (e) {
      console.log(`⚠️ Erro no Status ID ${id}: ${(e as any).message}`);
    }
  }
  await prisma.$executeRawUnsafe(`SELECT setval('status_equipamento_id_seq', (SELECT MAX(id) FROM status_equipamento));`);
  console.log(`✅ ${count} Status importados!`);
}

async function importDisponibilidades() {
  const filePath = path.join(__dirname, 'data', 'disponibilidade.xlsx');
  if (!fs.existsSync(filePath)) return;
  console.log('Importando Disponibilidades...');
  const workbook = xlsx.readFile(filePath);
  const data = xlsx.utils.sheet_to_json<any>(workbook.Sheets[workbook.SheetNames[0]]);
  let count = 0;
  for (const row of data) {
    const id = Number(row['ID_DISPONIBILIDADE']);
    const nome = row['CODIGO'] ? String(row['CODIGO']).trim() : null;
    const descricao = row['DESCRICAO'] ? String(row['DESCRICAO']).trim() : null;
    if (!id || !nome) continue;
    try {
      await prisma.disponibilidade.upsert({
        where: { id: id },
        update: { nome, descricao },
        create: { id, nome, descricao }
      });
      count++;
    } catch (e) {
      console.log(`⚠️ Erro na Disponibilidade ID ${id}: ${(e as any).message}`);
    }
  }
  await prisma.$executeRawUnsafe(`SELECT setval('disponibilidades_id_seq', (SELECT MAX(id) FROM disponibilidades));`);
  console.log(`✅ ${count} Disponibilidades importadas!`);
}

async function importTiposAquisicao() {
  const filePath = path.join(__dirname, 'data', 'tipo_aquisicao.xlsx');
  if (!fs.existsSync(filePath)) return;
  console.log('Importando Tipos de Aquisição...');
  const workbook = xlsx.readFile(filePath);
  const data = xlsx.utils.sheet_to_json<any>(workbook.Sheets[workbook.SheetNames[0]]);
  let count = 0;
  for (const row of data) {
    const id = Number(row['ID_TIPO_AQUISICAO']);
    const nome = row['DESCRICAO'] ? String(row['DESCRICAO']).trim() : null;
    const descricaoAmigavel = row['DESCRICAO_AMIGAVEL'] ? String(row['DESCRICAO_AMIGAVEL']).trim() : null;
    const corEmoji = row['COR_EMOJI'] ? String(row['COR_EMOJI']).trim() : null;
    if (!id || !nome) continue;
    try {
      await prisma.tipoAquisicao.upsert({
        where: { id: id },
        update: { nome, descricaoAmigavel, corEmoji },
        create: { id, nome, descricaoAmigavel, corEmoji }
      });
      count++;
    } catch (e) {
      console.log(`⚠️ Erro no Tipo de Aquisição ID ${id}: ${(e as any).message}`);
    }
  }
  await prisma.$executeRawUnsafe(`SELECT setval('tipos_aquisicao_id_seq', (SELECT MAX(id) FROM tipos_aquisicao));`);
  console.log(`✅ ${count} Tipos de Aquisição importados!`);
}

async function importUsuarios() {
  const filePath = path.join(__dirname, 'data', 'usuario.xlsx');
  if (!fs.existsSync(filePath)) return;
  console.log('Importando Usuários...');
  const workbook = xlsx.readFile(filePath);
  const data = xlsx.utils.sheet_to_json<any>(workbook.Sheets[workbook.SheetNames[0]]);
  
  const mappingPerfil: any = {
    'ADMIN': 'ADMIN_DTEC',
    'DIRETORIA': 'DIRETORIA',
    'COMANDANTE': 'COMANDANTE',
    'BATALHAO': 'USUARIO_BATALHAO'
  };

  let count = 0;
  for (const row of data) {
    const login = row['USERNAME'] ? String(row['USERNAME']).trim().toLowerCase() : null;
    const nome = row['NOME_COMPLETO'] ? String(row['NOME_COMPLETO']).trim() : null;
    const matricula = row['MATRICULA'] ? String(row['MATRICULA']).trim() : '000000';
    const email = row['EMAIL'] ? String(row['EMAIL']).trim() : null;
    const telefone = row['TELEFONE'] ? String(row['TELEFONE']).trim() : null;
    const nomeGuerra = row['NOME_GUERRA'] ? String(row['NOME_GUERRA']).trim() : null;
    const statusFuncional = row['STATUS_FUNCIONAL'] ? String(row['STATUS_FUNCIONAL']).trim() : null;
    const perfilStr = row['PERFIL'] ? String(row['PERFIL']).trim().toUpperCase() : 'USUARIO_BATALHAO';
    
    if (!login || !nome) continue;

    const perfil = (mappingPerfil[perfilStr] || 'USUARIO_BATALHAO') as any;

    try {
      await prisma.usuario.upsert({
        where: { login: login },
        update: { nome, matricula, email, telefone, nomeGuerra, statusFuncional, perfil },
        create: { login, nome, matricula, email, telefone, nomeGuerra, statusFuncional, perfil }
      });
      count++;
    } catch (e) {
      console.log(`⚠️ Erro no Usuário ${login}: ${(e as any).message}`);
    }
  }
  console.log(`✅ ${count} Usuários importados!`);
}

async function importEquipamentos() {
  const filePath = path.join(__dirname, 'data', 'equipamento.xlsx');
  if (!fs.existsSync(filePath)) return;
  console.log('Importando Equipamentos (isso pode demorar um pouco)...');
  const workbook = xlsx.readFile(filePath);
  const data = xlsx.utils.sheet_to_json<any>(workbook.Sheets[workbook.SheetNames[0]]);
  
  let count = 0;
  let dups = 0;

  for (const row of data) {
    const id = Number(row['ID_EQUIPAMENTO']);
    let patrimonio = row['PATRIMONIO'] ? String(row['PATRIMONIO']).trim() : `S-PAT-${id}`;
    const numeroSerie = row['NUMERO_SERIE'] ? String(row['NUMERO_SERIE']).trim() : null;
    const sei = row['SEI'] ? String(row['SEI']).trim() : null;
    const dataAquisicao = parseExcelDate(row['DATA_AQUISICAO']);
    const observacao = row['OBSERVACAO'] ? String(row['OBSERVACAO']).trim() : null;
    const tipoEquipamentoId = Number(row['ID_TIPO']);
    const statusId = Number(row['ID_STATUS']);
    const tipoAquisicaoId = row['ID_TIPO_AQUISICAO'] ? Number(row['ID_TIPO_AQUISICAO']) : null;
    const modeloId = row['ID_MODELO'] ? Number(row['ID_MODELO']) : null;
    const disponibilidadeId = row['ID_DISPONIBILIDADE'] ? Number(row['ID_DISPONIBILIDADE']) : 1;
    const secaoId = Number(row['ID_SECAO']);
    const dataSolicitacao = parseExcelDate(row['DATA_SOLICITACAO']);
    const solicitante = row['USUARIO_SOLICITANTE'] ? String(row['USUARIO_SOLICITANTE']).trim() : null;
    const dataRetornoEmprestimo = parseExcelDate(row['DATA_RETORNO_EMPRESTIMO']);
    const dataAprovacao = parseExcelDate(row['DATA_APROVACAO']);

    if (!id || !tipoEquipamentoId || !statusId || !secaoId) continue;

    const existing = await prisma.equipamento.findUnique({ where: { patrimonio } });
    if (existing && existing.id !== id) {
      patrimonio = `${patrimonio}-DUP-${id}`;
      dups++;
    }

    try {
      await prisma.equipamento.upsert({
        where: { id: id },
        update: {
          patrimonio, numeroSerie, sei, dataAquisicao, observacao,
          tipoEquipamentoId, statusId, tipoAquisicaoId, modeloId,
          disponibilidadeId, secaoId, dataSolicitacao, solicitante,
          dataRetornoEmprestimo, dataAprovacao
        },
        create: {
          id, patrimonio, numeroSerie, sei, dataAquisicao, observacao,
          tipoEquipamentoId, statusId, tipoAquisicaoId, modeloId,
          disponibilidadeId, secaoId, dataSolicitacao, solicitante,
          dataRetornoEmprestimo, dataAprovacao
        }
      });
      count++;
    } catch (e) { }
  }
  await prisma.$executeRawUnsafe(`SELECT setval('equipamentos_id_seq', (SELECT MAX(id) FROM equipamentos));`);
  console.log(`✅ ${count} Equipamentos importados (${dups} duplicados tratados com sufixo)!`);
}

async function importEspecificacoesTecnicas() {
  const files = [
    { name: 'cpu.xlsx', idCol: 'ID_EQUIPAMENTO' },
    { name: 'radio.xlsx', idCol: 'ID_EQUIPAMENTO' },
    { name: 'celular.xlsx', idCol: 'ID_EQUIPAMENTO' },
    { name: 'chip.xlsx', idCol: 'ID_EQUIPAMENTO' },
    { name: 'tablet.xlsx', idCol: 'ID_EQUIPAMENTO' },
    { name: 'monitor.xlsx', idCol: 'ID_EQUIPAMENTO' },
    { name: 'modem.xlsx', idCol: 'ID_EQUIPAMENTO' },
    { name: 'fonte.xlsx', idCol: 'ID_EQUIPAMENTO' }
  ];

  for (const file of files) {
    const filePath = path.join(__dirname, 'data', file.name);
    if (!fs.existsSync(filePath)) continue;
    console.log(`Processando ${file.name}...`);
    const workbook = xlsx.readFile(filePath);
    const data = xlsx.utils.sheet_to_json<any>(workbook.Sheets[workbook.SheetNames[0]]);
    for (const row of data) {
      const id = Number(row[file.idCol]);
      if (!id) continue;
      const specs: any = {};
      for (const key in row) {
        if (!key.startsWith('ID_')) specs[key.toLowerCase()] = row[key];
      }
      const eq = await prisma.equipamento.findUnique({ where: { id } });
      if (eq) {
        const currentSpecs = (eq.especificacoes as any) || {};
        await prisma.equipamento.update({
          where: { id },
          data: { especificacoes: { ...currentSpecs, ...specs } }
        });
      }
    }
  }
  console.log('✅ Especificações técnicas importadas!');
}

async function importUsuarioSecoes() {
  const filePath = path.join(__dirname, 'data', 'usuario_secao.xlsx');
  if (!fs.existsSync(filePath)) return;
  console.log('Importando Permissões Multilocais (UsuarioSecao)...');
  const workbook = xlsx.readFile(filePath);
  const data = xlsx.utils.sheet_to_json<any>(workbook.Sheets[workbook.SheetNames[0]]);
  let count = 0;
  for (const row of data) {
    const login = row['USERNAME'] ? String(row['USERNAME']).trim().toLowerCase() : null;
    const secaoId = Number(row['ID_SECAO']);
    const dataAssociacao = parseExcelDate(row['DATA_ASSOCIACAO']) || new Date();
    if (!login || !secaoId) continue;
    const user = await prisma.usuario.findUnique({ where: { login } });
    if (!user) continue;
    try {
      await prisma.usuarioSecao.upsert({
        where: { usuarioId_secaoId: { usuarioId: user.id, secaoId } },
        update: { dataAssociacao },
        create: { usuarioId: user.id, secaoId, dataAssociacao }
      });
      count++;
    } catch (e) { }
  }
  console.log(`✅ ${count} Permissões de Seção importadas!`);
}

async function importUsuarioTipos() {
  const filePath = path.join(__dirname, 'data', 'usuario_tipo_equipamento.xlsx');
  if (!fs.existsSync(filePath)) return;
  console.log('Importando Permissões por Tipo (UsuarioTipoEquipamento)...');
  const workbook = xlsx.readFile(filePath);
  const data = xlsx.utils.sheet_to_json<any>(workbook.Sheets[workbook.SheetNames[0]]);
  let count = 0;
  for (const row of data) {
    const login = row['USERNAME'] ? String(row['USERNAME']).trim().toLowerCase() : null;
    const tipoId = Number(row['ID_TIPO']);
    const dataAssociacao = parseExcelDate(row['DATA_ASSOCIACAO']) || new Date();
    if (!login || !tipoId) continue;
    const user = await prisma.usuario.findUnique({ where: { login } });
    if (!user) continue;
    try {
      await prisma.usuarioTipoEquipamento.upsert({
        where: { usuarioId_tipoEquipamentoId: { usuarioId: user.id, tipoEquipamentoId: tipoId } },
        update: { dataAssociacao },
        create: { usuarioId: user.id, tipoEquipamentoId: tipoId, dataAssociacao }
      });
      count++;
    } catch (e) { }
  }
  console.log(`✅ ${count} Permissões de Tipo importadas!`);
}

async function importHistoricoTransferencias() {
  const filePath = path.join(__dirname, 'data', 'historico_transferencia.xlsx');
  if (!fs.existsSync(filePath)) return;
  console.log('Importando Histórico de Transferências...');
  const workbook = xlsx.readFile(filePath);
  const data = xlsx.utils.sheet_to_json<any>(workbook.Sheets[workbook.SheetNames[0]]);
  let count = 0;
  for (const row of data) {
    const equipamentoId = Number(row['ID_EQUIPAMENTO']);
    const origemId = Number(row['ID_SECAO_ORIGEM']);
    const destinoId = Number(row['ID_SECAO_DESTINO']);
    const dataEnvio = parseExcelDate(row['DATA_TRANSFERENCIA']) || new Date();
    const loginSolicitante = row['USUARIO_RESPONSAVEL'] ? String(row['USUARIO_RESPONSAVEL']).trim().toLowerCase() : null;
    const observacao = row['JUSTIFICATIVA'] ? String(row['JUSTIFICATIVA']).trim() : 'Importado do sistema legado';

    if (!equipamentoId || !origemId || !destinoId) continue;

    const user = loginSolicitante ? await prisma.usuario.findUnique({ where: { login: loginSolicitante } }) : null;
    const solicitanteId = user ? user.id : 1; // Default para o primeiro usuario se não achar

    try {
      await prisma.transferencia.create({
        data: {
          equipamentoId, origemId, destinoId, solicitanteId,
          dataEnvio, dataRecebimento: dataEnvio,
          status: 'CONCLUIDA', observacao
        }
      });
      count++;
    } catch (e) { }
  }
  console.log(`✅ ${count} Transferências históricas importadas!`);
}

async function importLogsOperacao() {
  const filePath = path.join(__dirname, 'data', 'log_operacao.xlsx');
  if (!fs.existsSync(filePath)) return;
  console.log('Importando Logs de Operação...');
  const workbook = xlsx.readFile(filePath);
  const data = xlsx.utils.sheet_to_json<any>(workbook.Sheets[workbook.SheetNames[0]]);
  let count = 0;
  for (const row of data) {
    const login = row['USUARIO'] ? String(row['USUARIO']).trim().toLowerCase() : null;
    const dataHora = parseExcelDate(row['DATA_HORA']) || new Date();
    const acao = row['TIPO_OPERACAO'] || 'OPERACAO';
    const equipamentoId = Number(row['ID_REGISTRO']);
    const ip = row['IP_CLIENTE'] || null;
    const userAgent = row['USER_AGENT'] || null;
    const descricao = `Importado do legado: Operação em ${row['TABELA_AFETADA']}`;

    if (!login) continue;
    const user = await prisma.usuario.findUnique({ where: { login } });
    if (!user) continue;

    try {
      await prisma.logOperacao.create({
        data: {
          usuarioId: user.id, equipamentoId: isNaN(equipamentoId) ? null : equipamentoId,
          acao, descricao, ip, userAgent, createdAt: dataHora,
          dadosAlterados: row
        }
      });
      count++;
    } catch (e) { }
  }
  console.log(`✅ ${count} Logs de operação importados!`);
}

async function main() {
  console.log('Iniciando importação de dados reais...');
  /*
  try {
    await prisma.logOperacao.deleteMany({});
    await prisma.transferencia.deleteMany({});
    await prisma.alteracaoPendente.deleteMany({});
    await prisma.usuarioSecao.deleteMany({});
    await prisma.usuarioTipoEquipamento.deleteMany({});
    await prisma.equipamento.deleteMany({});
    await prisma.usuario.deleteMany({});
    await prisma.secao.deleteMany({});
    await prisma.batalhao.deleteMany({});
    await prisma.diretoria.deleteMany({});
    await prisma.modelo.deleteMany({});
    await prisma.marca.deleteMany({});
    await prisma.tipoEquipamento.deleteMany({});
    await prisma.statusEquipamento.deleteMany({});
    await prisma.disponibilidade.deleteMany({});
    await prisma.tipoAquisicao.deleteMany({});
  } catch (e) { }
  */

  await importStatusEquipamento();
  await importDisponibilidades();
  await importTiposAquisicao();
  await importDiretorias();
  await importBatalhoes();
  await importSecoes();
  await importMarcas();
  await importModelos();
  await importTiposEquipamento();
  await importUsuarios();
  await importEquipamentos();
  await importEspecificacoesTecnicas();
  await importUsuarioSecoes();
  await importUsuarioTipos();
  await importHistoricoTransferencias();
  await importLogsOperacao();
  
  console.log('Importação finalizada com sucesso!');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });
