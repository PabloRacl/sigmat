export const MOCK_ESTATISTICAS = {
  resumo: {
    total: 30,
    ativos: 12,
    emprestados: 8,
    manutencao: 4,
    inativos: 6
  },
  graficos: {
    porStatus: {
      labels: ['ATIVO', 'MANUTENCAO', 'INATIVO', 'EXTRAVIADO', 'DANO', 'PENDENTE_APROVACAO'],
      datasets: [{ data: [12, 4, 3, 1, 1, 9], backgroundColor: ['#22c55e', '#f97316', '#6b7280', '#ef4444', '#ef4444', '#a855f7'] }]
    },
    porTipo: {
      labels: ['Fuzil', 'Pistola', 'Munição', 'Rádio', 'Colete Balístico', 'Câmera', 'Notebook', 'Smartphone', 'Veículo', 'Tablet'],
      datasets: [{ data: [4, 4, 3, 3, 3, 3, 3, 3, 2, 2], backgroundColor: ['#2563eb', '#9333ea', '#14b8a6', '#f59e0b', '#ef4444', '#06b6d4', '#84cc16', '#f97316', '#8b5cf6', '#ec4899'] }]
    },
    porDisponibilidade: {
      labels: ['CARGA', 'EMPRESTIMO', 'DISPONIVEL'],
      datasets: [{ data: [15, 8, 7], backgroundColor: ['#10b981', '#0ea5e9', '#f97316'] }]
    },
    porBatalhao: {
      labels: ['BPTUR', 'HQT', 'CBT1', 'CBT2', 'RPM'],
      datasets: [{ data: [8, 6, 6, 5, 5], backgroundColor: ['#2563eb', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4'] }]
    },
    porMarca: {
      labels: ['Taurus', 'CBC', 'Motorola', 'Dell', 'Samsung', 'Sony', 'Toyota'],
      datasets: [{ data: [6, 4, 4, 3, 3, 3, 2], backgroundColor: ['#2563eb', '#0ea5e9', '#14b8a6', '#f59e0b', '#ef4444', '#84cc16', '#8b5cf6'] }]
    }
  }
};
