function diretoria(id: number, sigla: string, nome: string) {
  return { id, sigla, nome };
}

function batalhao(id: number, sigla: string, nome: string, diretoriaId: number) {
  const dir = diretorias.find(d => d.id === diretoriaId)!;
  return { id, sigla, nome, diretoria: dir };
}

function secao(id: number, sigla: string, nome: string, batalhaoId: number) {
  const bat = batalhoes.find(b => b.id === batalhaoId)!;
  return { id, sigla, nome, batalhao: bat, diretoria: bat.diretoria };
}

const diretorias = [
  diretoria(10, 'DTEC', 'Diretoria de Tecnologia'),
  diretoria(11, 'DIREX', 'Diretoria Extra'),
  diretoria(12, 'DLOG', 'Diretoria de Logística'),
];

const batalhoes = [
  batalhao(20, 'BPTUR', 'Batalhão de Polícia Turística', 10),
  batalhao(21, 'HQT', 'Batalhão de Polícia de HQ', 10),
  batalhao(22, 'CBT1', 'Comando do Batalhão 1', 11),
  batalhao(23, 'CBT2', 'Comando do Batalhão 2', 11),
  batalhao(24, 'RPM', 'Ronda de Polícia Militar', 12),
];

const secoes = [
  secao(101, 'ADM-BPTUR', 'Seção Administrativa BPTUR', 20),
  secao(102, 'OP-BPTUR', 'Seção Operacional BPTUR', 20),
  secao(201, 'ADM-HQT', 'Seção Administrativa HQT', 21),
  secao(202, 'OP-HQT', 'Seção Operacional HQT', 21),
  secao(301, 'ADM-CBT1', 'Seção Administrativa CBT1', 22),
  secao(302, 'OP-CBT1', 'Seção Operacional CBT1', 22),
  secao(401, 'ADM-CBT2', 'Seção Administrativa CBT2', 23),
  secao(501, 'ADM-RPM', 'Seção Administrativa RPM', 24),
  secao(502, 'OP-RPM', 'Seção Operacional RPM', 24),
];

const tipos = ['Fuzil', 'Pistola', 'Munição', 'Rádio', 'Colete Balístico', 'Câmera', 'Notebook', 'Smartphone', 'Veículo', 'Tablet'];
const marcas: Record<string, string[]> = {
  'Fuzil': ['Taurus', 'Colt', 'IMBEL'],
  'Pistola': ['Taurus', 'Glock', 'Beretta'],
  'Munição': ['CBC', 'Magtech'],
  'Rádio': ['Motorola', 'Icom'],
  'Colete Balístico': ['Taurus', 'Cerflaw'],
  'Câmera': ['Sony', 'Canon'],
  'Notebook': ['Dell', 'Lenovo', 'HP'],
  'Smartphone': ['Samsung', 'Motorola'],
  'Veículo': ['Toyota', 'Ford', 'Volkswagen'],
  'Tablet': ['Samsung', 'Apple'],
};

const statusOpcoes = ['ATIVO', 'MANUTENÇÃO', 'INATIVO', 'EXTRAVIADO', 'DANO', 'PENDENTE_APROVACAO'];
const disponibilidadeOpcoes = ['CARGA', 'EMPRESTIMO'];

function aleatorio(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function aleatorioArr<T>(arr: T[]): T {
  return arr[aleatorio(0, arr.length - 1)];
}

function formatarData(d: Date): string {
  return d.toISOString().split('T')[0];
}

function gerarPatrimonio(secaoSigla: string, idx: number): string {
  return `${secaoSigla}-${String(idx).padStart(4, '0')}`;
}

function gerarSEI(idx: number): string | null {
  if (idx % 3 === 0) return null;
  return `2025.${String(aleatorio(1, 9999)).padStart(4, '0')}`;
}

function gerarNumeroSerie(idx: number): string {
  const letras = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  return `SN-${letras[aleatorio(0, 25)]}${letras[aleatorio(0, 25)]}-${String(idx).padStart(4, '0')}`;
}

let contador = 0;

function gerarEquipamento(secaoIdx: number, tipoNome: string): any {
  contador++;
  const id = contador;
  const sec = secoes[secaoIdx % secoes.length];
  const statusNome = aleatorioArr(statusOpcoes);
  const dispNome = ['EXTRAVIADO', 'DANO'].includes(statusNome) ? null : aleatorioArr(disponibilidadeOpcoes);
  const dataAquisicao = new Date(2020 + aleatorio(0, 5), aleatorio(0, 11), aleatorio(1, 28));

  return {
    id,
    patrimonio: gerarPatrimonio(sec.sigla, id),
    numeroSerie: gerarNumeroSerie(id),
    sei: gerarSEI(id),
    dataAquisicao: formatarData(dataAquisicao),
    observacao: statusNome === 'MANUTENÇÃO' ? 'Equipamento em manutenção preventiva' : null,
    tipoEquipamento: { id: tipos.indexOf(tipoNome) + 1, nome: tipoNome },
    marca: { id: aleatorio(1, 10), nome: aleatorioArr(marcas[tipoNome] || ['Genérica']) },
    modelo: { id: aleatorio(1, 50), nome: `${tipoNome.substring(0, 3).toUpperCase()}-${aleatorio(100, 999)}` },
    status: { id: statusOpcoes.indexOf(statusNome) + 1, nome: statusNome },
    disponibilidade: dispNome ? { id: disponibilidadeOpcoes.indexOf(dispNome) + 1, nome: dispNome } : null,
    secao: sec,
    solicitante: aleatorioArr(['Sgt Santos', 'Ten Silva', 'Cap Oliveira', 'Cel Andrade', 'Maj Costa', null, null]),
    dataSolicitacao: dispNome === 'EMPRESTIMO' ? formatarData(new Date(2025, aleatorio(0, 5), aleatorio(1, 28))) : null,
    dataRetornoEmprestimo: dispNome === 'EMPRESTIMO' ? formatarData(new Date(2025, aleatorio(6, 11), aleatorio(1, 28))) : null,
    especificacoes: null,
    fotos: null,
    usuarioResponsavelId: aleatorio(1, 10),
    valor: aleatorio(500, 50000),
  };
}

export const MOCK_EQUIPAMENTOS: any[] = (() => {
  const lista: any[] = [];
  const totalPorTipo = [4, 4, 3, 3, 3, 3, 3, 3, 2, 2];

  tipos.forEach((tipo, idx) => {
    for (let i = 0; i < totalPorTipo[idx]; i++) {
      const secaoIdx = lista.length % secoes.length;
      lista.push(gerarEquipamento(secaoIdx, tipo));
    }
  });

  return lista;
})();
