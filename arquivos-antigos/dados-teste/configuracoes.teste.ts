export const MOCK_TIPOS = [
  { id: 1, nome: 'CPU' },
  { id: 2, nome: 'MONITOR' },
  { id: 3, nome: 'RÁDIO' },
  { id: 4, nome: 'CELULAR' },
  { id: 5, nome: 'CHIP' },
  { id: 6, nome: 'MODEM' },
  { id: 7, nome: 'MULTICARREGADOR' },
  { id: 8, nome: 'TABLET' },
  { id: 9, nome: 'FONTE' },
  { id: 10, nome: 'TECLADO' },
  { id: 11, nome: 'MOUSE' },
  { id: 12, nome: 'ALL IN ONE' },
  { id: 13, nome: 'NOTEBOOK' },
  { id: 999, nome: 'TESTES' }
];

export const MOCK_STATUS = [
  { id: 1, nome: 'ATIVO' },
  { id: 2, nome: 'INATIVO' },
  { id: 3, nome: 'EXTRAVIADO' },
  { id: 4, nome: 'MANUTENÇÃO' },
  { id: 5, nome: 'DANO' },
  { id: 6, nome: 'DISPONÍVEL' },
  { id: 7, nome: 'RESERVA' },
  { id: 23, nome: 'PENDENTE_APROVACAO' }
];

export const MOCK_DISPONIBILIDADES = [
  { id: 1, nome: 'CARGA' },
  { id: 2, nome: 'EMPRESTIMO' }
];

export const MOCK_TIPOS_AQUISICAO = [
  { id: 1, nome: 'COMPRA' },
  { id: 2, nome: 'DOAÇÃO' },
  { id: 3, nome: 'TRANSFERÊNCIA' }
];

export const MOCK_SECOES = [
  { id: 101, sigla: 'BPTUR', nome: 'Seção BPTUR', batalhaoId: 20 },
  { id: 201, sigla: 'HQT', nome: 'Seção HQT', batalhaoId: 21 },
  { id: 202, sigla: 'CBT1', nome: 'Seção CBT1', batalhaoId: 22 },
  { id: 301, sigla: 'OUT', nome: 'Seção OUTRO', batalhaoId: 30 }
];

export const MOCK_DIRETORIAS = [
  { id: 1, sigla: 'DTEC', nome: 'Diretoria de Tecnologia' },
  { id: 2, sigla: 'DAL', nome: 'Diretoria de Apoio Logístico' }
];

export const MOCK_BATALHOES = [
  { id: 20, sigla: 'BPTUR', nome: 'Batalhão BPTUR', diretoriaId: 1 },
  { id: 21, sigla: 'HQT', nome: 'Batalhão HQT', diretoriaId: 2 },
  { id: 22, sigla: 'CBT1', nome: 'Batalhão CBT1', diretoriaId: 1 },
  { id: 30, sigla: 'OUT', nome: 'Batalhão Outros', diretoriaId: 2 }
];

export const MOCK_MARCAS = [
  { id: 1, nome: 'Dell' },
  { id: 2, nome: 'Samsung' },
  { id: 3, nome: 'Motorola' },
  { id: 4, nome: 'HP' },
  { id: 5, nome: 'Sony' }
];

export const MOCK_MODELOS = [
  { id: 1, nome: 'Inspiron', marcaId: 1 },
  { id: 2, nome: 'Galaxy Tab', marcaId: 2 },
  { id: 3, nome: 'Moto G', marcaId: 3 },
  { id: 4, nome: 'LaserJet', marcaId: 4 },
  { id: 5, nome: 'Alpha', marcaId: 5 }
];

export const MOCK_RESUMO_UNIDADES = [
  { sigla: 'BPTUR', total: 100 },
  { sigla: 'HQT', total: 60 },
  { sigla: 'CBT1', total: 40 },
  { sigla: 'OUT', total: 20 }
];
