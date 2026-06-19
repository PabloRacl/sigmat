import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { By } from '@angular/platform-browser';

import { EquipmentFormComponent } from './formulario-equipamento.component';
import { EquipmentService } from '../../../nucleo/servicos/equipamentos.service';
import { SettingsService } from '../../../nucleo/servicos/configuracoes.service';
import { UploadService } from '../../../nucleo/servicos/carregamento.service';
import { MessageService } from 'primeng/api';

class MockMessageService {
  add = jasmine.createSpy('add');
}

class MockEquipmentService {
  listarTodos = jasmine.createSpy('listarTodos').and.returnValue(of({ itens: [], total: 0 }));
  criar = jasmine.createSpy('criar').and.returnValue(of({ id: 1 }));
  atualizar = jasmine.createSpy('atualizar').and.returnValue(of({ id: 1 }));
  remover = jasmine.createSpy('remover').and.returnValue(of({}));
}

class MockSettingsService {
  listarTipos = jasmine.createSpy('listarTipos').and.returnValue(of([]));
  listarMarcas = jasmine.createSpy('listarMarcas').and.returnValue(of([]));
  listarModelos = jasmine.createSpy('listarModelos').and.returnValue(of([]));
  listarStatus = jasmine.createSpy('listarStatus').and.returnValue(of([]));
  listarDisponibilidades = jasmine.createSpy('listarDisponibilidades').and.returnValue(of([]));
  listarSecoes = jasmine.createSpy('listarSecoes').and.returnValue(of([]));
  criarStatus = jasmine.createSpy('criarStatus').and.returnValue(of({ id: 1 }));
  criarTipo = jasmine.createSpy('criarTipo').and.returnValue(of({ id: 10 }));
  criarMarca = jasmine.createSpy('criarMarca').and.returnValue(of({ id: 20 }));
  criarModelo = jasmine.createSpy('criarModelo').and.returnValue(of({ id: 30 }));
  excluirStatus = jasmine.createSpy('excluirStatus').and.returnValue(of({}));
}

class MockUploadService {
  uploadFotoEquipamento = jasmine.createSpy('uploadFotoEquipamento');
  getUrlCompleta = jasmine.createSpy('getUrlCompleta').and.returnValue('');
}

const mockTipos = [
  { id: 1, nome: 'CELULAR' },
  { id: 2, nome: 'SMARTPHONE' },
  { id: 3, nome: 'MOVEL' },
  { id: 4, nome: 'NOTEBOOK' },
  { id: 5, nome: 'CPU' },
  { id: 6, nome: 'MONITOR' }
];

const mockMarcas = [
  { id: 1, nome: 'Dell' },
  { id: 2, nome: 'Apple' },
  { id: 3, nome: 'Samsung' }
];

const mockModelos = [
  { id: 1, nome: 'Latitude', marcaId: 1 },
  { id: 2, nome: 'MacBook Pro', marcaId: 2 },
  { id: 3, nome: 'Galaxy S24', marcaId: 3 },
  { id: 4, nome: 'Inspiron', marcaId: 1 }
];

const mockStatus = [
  { id: 1, nome: 'Ativo' },
  { id: 2, nome: 'Inativo' }
];

const mockDisponibilidades = [
  { id: 1, nome: 'Dispon�vel' },
  { id: 2, nome: 'Indispon�vel' }
];

const mockSecoes = [
  { id: 1, sigla: 'STI', nome: 'Se��o de TI' },
  { id: 2, sigla: 'SAD', nome: 'Se��o Administrativa' }
];

const mockEquipment = {
  id: 1,
  patrimonio: 'PMPE-HT-001',
  numeroSerie: 'SN123456',
  sei: 'SEI001',
  tipoEquipamentoId: 1,
  marcaId: 1,
  modeloId: 1,
  statusId: 1,
  disponibilidadeId: 1,
  secaoId: 1,
  dataAquisicao: '2024-01-15T00:00:00.000Z',
  observacao: 'Equipamento em uso',
  especificacoes: {
    imei: '123456789012345',
    telefone: '(81) 99999-0000',
    processador: 'Intel i7',
    chip_vinculado_pat: 'CHIP-001'
  }
};

describe('EquipmentFormComponent', () => {
  let component: EquipmentFormComponent;
  let fixture: ComponentFixture<EquipmentFormComponent>;
  let equipmentService: MockEquipmentService;
  let settingsService: MockSettingsService;
  let uploadService: MockUploadService;
  let messageService: MockMessageService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EquipmentFormComponent, NoopAnimationsModule],
      providers: [
        { provide: EquipmentService, useClass: MockEquipmentService },
        { provide: SettingsService, useClass: MockSettingsService },
        { provide: UploadService, useClass: MockUploadService },
        { provide: MessageService, useClass: MockMessageService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(EquipmentFormComponent);
    component = fixture.componentInstance;
    equipmentService = TestBed.inject(EquipmentService) as unknown as MockEquipmentService;
    settingsService = TestBed.inject(SettingsService) as unknown as MockSettingsService;
    uploadService = TestBed.inject(UploadService) as unknown as MockUploadService;
    messageService = TestBed.inject(MessageService) as unknown as MockMessageService;

    settingsService.listarTipos.and.returnValue(of(mockTipos));
    settingsService.listarMarcas.and.returnValue(of(mockMarcas));
    settingsService.listarModelos.and.returnValue(of(mockModelos));
    settingsService.listarStatus.and.returnValue(of(mockStatus));
    settingsService.listarDisponibilidades.and.returnValue(of(mockDisponibilidades));
    settingsService.listarSecoes.and.returnValue(of(mockSecoes));
    equipmentService.listarTodos.and.returnValue(of({ itens: [], total: 0 }));

    fixture.detectChanges();
  });

  describe('Configura��o b�sica', () => {
    it('deve criar o componente', () => {
      expect(component).toBeTruthy();
    });
  });

  describe('Inicializa��o do formul�rio', () => {
    it('deve inicializar o formul�rio com todos os controles', () => {
      expect(component.form.contains('id')).toBeTrue();
      expect(component.form.contains('patrimonio')).toBeTrue();
      expect(component.form.contains('numeroSerie')).toBeTrue();
      expect(component.form.contains('sei')).toBeTrue();
      expect(component.form.contains('tipoEquipamentoId')).toBeTrue();
      expect(component.form.contains('marcaId')).toBeTrue();
      expect(component.form.contains('modeloId')).toBeTrue();
      expect(component.form.contains('statusId')).toBeTrue();
      expect(component.form.contains('disponibilidadeId')).toBeTrue();
      expect(component.form.contains('secaoId')).toBeTrue();
      expect(component.form.contains('dataAquisicao')).toBeTrue();
      expect(component.form.contains('observacao')).toBeTrue();
      expect(component.form.contains('especificacoes')).toBeTrue();
    });

    it('deve ter validador required no campo patrimonio', () => {
      const control = component.form.get('patrimonio');
      control?.setValue('');
      expect(control?.valid).toBeFalse();
      control?.setValue('PMPE-001');
      expect(control?.valid).toBeTrue();
    });

    it('deve ter validador required no campo tipoEquipamentoId', () => {
      const control = component.form.get('tipoEquipamentoId');
      control?.setValue(null);
      expect(control?.valid).toBeFalse();
      control?.setValue(1);
      expect(control?.valid).toBeTrue();
    });

    it('deve ter validador required no campo statusId', () => {
      const control = component.form.get('statusId');
      control?.setValue(null);
      expect(control?.valid).toBeFalse();
      control?.setValue(1);
      expect(control?.valid).toBeTrue();
    });

    it('deve ter validador required no campo disponibilidadeId', () => {
      const control = component.form.get('disponibilidadeId');
      control?.setValue(null);
      expect(control?.valid).toBeFalse();
      control?.setValue(1);
      expect(control?.valid).toBeTrue();
    });

    it('deve ter validador required no campo secaoId', () => {
      const control = component.form.get('secaoId');
      control?.setValue(null);
      expect(control?.valid).toBeFalse();
      control?.setValue(1);
      expect(control?.valid).toBeTrue();
    });

    it('deve iniciar com valores padr�o vazios', () => {
      expect(component.form.get('patrimonio')?.value).toBe('');
      expect(component.form.get('numeroSerie')?.value).toBe('');
      expect(component.form.get('sei')?.value).toBe('');
      expect(component.form.get('observacao')?.value).toBe('');
      expect(component.form.get('id')?.value).toBeNull();
      expect(component.form.get('tipoEquipamentoId')?.value).toBeNull();
      expect(component.form.get('marcaId')?.value).toBeNull();
      expect(component.form.get('modeloId')?.value).toBeNull();
      expect(component.form.get('statusId')?.value).toBeNull();
      expect(component.form.get('disponibilidadeId')?.value).toBeNull();
      expect(component.form.get('secaoId')?.value).toBeNull();
      expect(component.form.get('dataAquisicao')?.value).toBeNull();
    });

    it('deve inicializar especificacoes como FormGroup vazio', () => {
      const especificacoes = component.form.get('especificacoes');
      expect(especificacoes).toBeDefined();
      expect(Object.keys((especificacoes as any).controls).length).toBe(0);
    });

    it('deve ter editando como false', () => {
      expect(component.editando).toBeFalse();
    });

    it('deve inicializar arrays vazios', () => {
      expect(component.tipos).toEqual(mockTipos);
      expect(component.marcas).toEqual(mockMarcas);
      expect(component.modelos).toEqual(mockModelos);
      expect(component.modelosFiltrados).toEqual(mockModelos);
      expect(component.status).toEqual(mockStatus);
      expect(component.disponibilidades).toEqual(mockDisponibilidades);
      expect(component.secoes).toEqual(mockSecoes);
    });
  });

  describe('ngOnChanges', () => {
    it('deve resetar o formul�rio quando visible=true e equipment=null', () => {
      spyOn(component, 'resetarForm').and.callThrough();
      component.visible = true;
      component.equipment = null;
      component.ngOnChanges();
      expect(component.resetarForm).toHaveBeenCalled();
      expect(component.editando).toBeFalse();
    });

    it('deve preencher o formul�rio quando visible=true e equipment definido', () => {
      spyOn(component, 'preencherForm').and.callThrough();
      component.visible = true;
      component.equipment = mockEquipment;
      component.ngOnChanges();
      expect(component.preencherForm).toHaveBeenCalledWith(mockEquipment);
    });

    it('deve ignorar quando visible=false', () => {
      spyOn(component, 'resetarForm');
      spyOn(component, 'preencherForm');
      component.visible = false;
      component.ngOnChanges();
      expect(component.resetarForm).not.toHaveBeenCalled();
      expect(component.preencherForm).not.toHaveBeenCalled();
    });
  });

  describe('carregarAuxiliares', () => {
    beforeEach(() => {
      settingsService.listarTipos.and.returnValue(of(mockTipos));
      settingsService.listarMarcas.and.returnValue(of(mockMarcas));
      settingsService.listarModelos.and.returnValue(of(mockModelos));
      settingsService.listarStatus.and.returnValue(of(mockStatus));
      settingsService.listarDisponibilidades.and.returnValue(of(mockDisponibilidades));
      settingsService.listarSecoes.and.returnValue(of(mockSecoes));
      equipmentService.listarTodos.and.returnValue(of({ itens: [{ patrimonio: 'CHIP-001' }], total: 1 }));
    });

    it('deve carregar tipos do servi�o', () => {
      component.carregarAuxiliares();
      expect(settingsService.listarTipos).toHaveBeenCalled();
      expect(component.tipos).toEqual(mockTipos);
    });

    it('deve carregar marcas do servi�o', () => {
      component.carregarAuxiliares();
      expect(settingsService.listarMarcas).toHaveBeenCalled();
      expect(component.marcas).toEqual(mockMarcas);
    });

    it('deve carregar modelos e inicializar modelosFiltrados', () => {
      component.carregarAuxiliares();
      expect(settingsService.listarModelos).toHaveBeenCalled();
      expect(component.modelos).toEqual(mockModelos);
      expect(component.modelosFiltrados).toEqual(mockModelos);
    });

    it('deve carregar status do servi�o', () => {
      component.carregarAuxiliares();
      expect(settingsService.listarStatus).toHaveBeenCalled();
      expect(component.status).toEqual(mockStatus);
    });

    it('deve carregar disponibilidades do servi�o', () => {
      component.carregarAuxiliares();
      expect(settingsService.listarDisponibilidades).toHaveBeenCalled();
      expect(component.disponibilidades).toEqual(mockDisponibilidades);
    });

    it('deve carregar secoes do servi�o', () => {
      component.carregarAuxiliares();
      expect(settingsService.listarSecoes).toHaveBeenCalled();
      expect(component.secoes).toEqual(mockSecoes);
    });

    it('deve carregar chips do servi�o', () => {
      component.carregarAuxiliares();
      expect(equipmentService.listarTodos).toHaveBeenCalledWith(1, 100, 'CHIP');
      expect(component.chipsDisponiveis).toEqual([{ patrimonio: 'CHIP-001' }]);
    });
  });

  describe('resetarForm', () => {
    beforeEach(() => {
      component.form.patchValue({
        patrimonio: 'TESTE',
        numeroSerie: 'SN001',
        tipoEquipamentoId: 1,
        statusId: 1,
        disponibilidadeId: 1,
        secaoId: 1
      });
      component.editando = true;
      component.campoIMEI = 'IMEI-TESTE';
      component.campoTelefone = 'TELEFONE-TESTE';
      component.chipSelecionado = { patrimonio: 'CHIP-001' };
      component.valoresDinamicos = { processador: 'Intel' };
      component.camposDinamicos = [{ label: 'Processador', key: 'processador', placeholder: 'Ex: Intel i7' }];
    });

    it('deve definir editando como false', () => {
      component.resetarForm();
      expect(component.editando).toBeFalse();
    });

    it('deve limpar campos IMEI, telefone e chipSelecionado', () => {
      component.resetarForm();
      expect(component.campoIMEI).toBe('');
      expect(component.campoTelefone).toBe('');
      expect(component.chipSelecionado).toBeNull();
    });

    it('deve resetar campos din�micos e valores', () => {
      component.resetarForm();
      expect(component.valoresDinamicos).toEqual({});
      expect(component.camposDinamicos).toEqual([]);
    });

    it('deve resetar todos os campos do formul�rio', () => {
      component.resetarForm();
      expect(component.form.get('patrimonio')?.value).toBeNull();
      expect(component.form.get('numeroSerie')?.value).toBeNull();
      expect(component.form.get('tipoEquipamentoId')?.value).toBeNull();
      expect(component.form.get('statusId')?.value).toBeNull();
    });
  });

  describe('preencherForm', () => {
    beforeEach(() => {
      component.tipos = mockTipos;
      component.marcas = mockMarcas;
      component.modelos = mockModelos;
      component.modelosFiltrados = [...mockModelos];
      component.preencherForm(mockEquipment);
    });

    it('deve definir editando como true', () => {
      expect(component.editando).toBeTrue();
    });

    it('deve preencher IMEI e telefone a partir das especifica��es', () => {
      expect(component.campoIMEI).toBe('123456789012345');
      expect(component.campoTelefone).toBe('(81) 99999-0000');
    });

    it('deve preencher chipSelecionado a partir das especifica��es', () => {
      expect(component.chipSelecionado).toEqual({ patrimonio: 'CHIP-001' });
    });

    it('deve preencher valoresDinamicos com as especifica��es', () => {
      expect(component.valoresDinamicos).toEqual({
        imei: '123456789012345',
        telefone: '(81) 99999-0000',
        processador: 'Intel i7',
        chip_vinculado_pat: 'CHIP-001'
      });
    });

    it('deve atualizar campos din�micos baseado no tipoEquipamentoId', () => {
      expect(component.camposDinamicos.length).toBe(0);
      const tipoCpu = mockTipos.find(t => t.nome === 'CPU');
      component.preencherForm({ ...mockEquipment, tipoEquipamentoId: tipoCpu?.id });
      expect(component.camposDinamicos.length).toBeGreaterThan(0);
    });

    it('deve chamar atualizarModelosPorMarca com marcaId', () => {
      spyOn(component, 'atualizarModelosPorMarca').and.callThrough();
      component.preencherForm(mockEquipment);
      expect(component.atualizarModelosPorMarca).toHaveBeenCalledWith(mockEquipment.marcaId);
    });

    it('deve converter dataAquisicao string para Date', () => {
      const dateValue = component.form.get('dataAquisicao')?.value;
      expect(dateValue instanceof Date).toBeTrue();
    });

    it('deve lidar com especificacoes ausentes', () => {
      component.preencherForm({ ...mockEquipment, especificacoes: null });
      expect(component.campoIMEI).toBe('');
      expect(component.campoTelefone).toBe('');
      expect(component.chipSelecionado).toBeNull();
    });

    it('deve lidar com chip_vinculado_pat nulo', () => {
      const eqSemChip = {
        ...mockEquipment,
        especificacoes: { imei: '123', telefone: '456', chip_vinculado_pat: null }
      };
      component.preencherForm(eqSemChip);
      expect(component.chipSelecionado).toBeNull();
    });
  });

  describe('Valida��o do formul�rio', () => {
    it('deve ser inv�lido quando campos obrigat�rios est�o vazios', () => {
      component.form.get('patrimonio')?.setValue('');
      component.form.get('tipoEquipamentoId')?.setValue(null);
      component.form.get('statusId')?.setValue(null);
      component.form.get('disponibilidadeId')?.setValue(null);
      component.form.get('secaoId')?.setValue(null);
      expect(component.form.valid).toBeFalse();
    });

    it('deve ser v�lido quando todos campos obrigat�rios est�o preenchidos', () => {
      component.form.get('patrimonio')?.setValue('PMPE-001');
      component.form.get('tipoEquipamentoId')?.setValue(1);
      component.form.get('statusId')?.setValue(1);
      component.form.get('disponibilidadeId')?.setValue(1);
      component.form.get('secaoId')?.setValue(1);
      expect(component.form.valid).toBeTrue();
    });

    it('deve ser inv�lido se apenas patrimonio estiver ausente', () => {
      component.form.get('patrimonio')?.setValue('');
      component.form.get('tipoEquipamentoId')?.setValue(1);
      component.form.get('statusId')?.setValue(1);
      component.form.get('disponibilidadeId')?.setValue(1);
      component.form.get('secaoId')?.setValue(1);
      expect(component.form.valid).toBeFalse();
    });
  });

  describe('salvar', () => {
    function preencherFormValido() {
      component.form.get('patrimonio')?.setValue('PMPE-001');
      component.form.get('tipoEquipamentoId')?.setValue(1);
      component.form.get('statusId')?.setValue(1);
      component.form.get('disponibilidadeId')?.setValue(1);
      component.form.get('secaoId')?.setValue(1);
    }

    it('deve chamar criar() quando n�o est� editando', () => {
      equipmentService.criar.and.returnValue(of({ id: 2 }));
      component.editando = false;
      preencherFormValido();
      component.salvar();
      expect(equipmentService.criar).toHaveBeenCalled();
    });

    it('deve emitir evento saved ao criar com sucesso', () => {
      spyOn(component.saved, 'emit');
      equipmentService.criar.and.returnValue(of({ id: 2 }));
      component.editando = false;
      preencherFormValido();
      component.salvar();
      expect(component.saved.emit).toHaveBeenCalled();
    });

    it('deve chamar atualizar() quando est� editando', () => {
      equipmentService.atualizar.and.returnValue(of({ id: 1 }));
      component.editando = true;
      preencherFormValido();
      component.form.get('id')?.setValue(1);
      component.salvar();
      expect(equipmentService.atualizar).toHaveBeenCalledWith(1, jasmine.any(Object));
    });

    it('deve emitir evento saved ao atualizar com sucesso', () => {
      spyOn(component.saved, 'emit');
      equipmentService.atualizar.and.returnValue(of({ id: 1 }));
      component.editando = true;
      preencherFormValido();
      component.form.get('id')?.setValue(1);
      component.salvar();
      expect(component.saved.emit).toHaveBeenCalled();
    });

    it('deve fechar o di�logo ap�s salvar', () => {
      spyOn(component.visibleChange, 'emit');
      equipmentService.criar.and.returnValue(of({ id: 2 }));
      preencherFormValido();
      component.salvar();
      expect(component.visibleChange.emit).toHaveBeenCalledWith(false);
    });

    it('deve mostrar mensagem de aprova��o quando resposta tem dadosNovos', () => {
      equipmentService.criar.and.returnValue(of({ id: 1, dadosNovos: { status: 'pendente' } }));
      preencherFormValido();
      component.salvar();
      expect(messageService.add).toHaveBeenCalledWith(jasmine.objectContaining({
        severity: 'info',
        summary: 'Aprovação Solicitada'
      }));
    });

    it('deve mostrar mensagem de sucesso quando resposta n�o tem dadosNovos', () => {
      equipmentService.criar.and.returnValue(of({ id: 1 }));
      preencherFormValido();
      component.salvar();
      expect(messageService.add).toHaveBeenCalledWith(jasmine.objectContaining({
        severity: 'success',
        summary: 'Sucesso'
      }));
    });

    it('n�o deve fazer nada quando formul�rio � inv�lido', () => {
      spyOn(component.saved, 'emit');
      component.form.get('patrimonio')?.setValue('');
      component.salvar();
      expect(equipmentService.criar).not.toHaveBeenCalled();
      expect(equipmentService.atualizar).not.toHaveBeenCalled();
      expect(component.saved.emit).not.toHaveBeenCalled();
    });

    it('deve mostrar mensagem de erro na falha da requisi��o', () => {
      equipmentService.criar.and.returnValue(throwError(() => new Error('Falha')));
      preencherFormValido();
      component.salvar();
      expect(messageService.add).toHaveBeenCalledWith(jasmine.objectContaining({
        severity: 'error',
        summary: 'Erro',
        detail: 'Erro ao salvar.'
      }));
    });

    it('deve incluir campos celular nas especifica��es quando exibirCamposCelular � true', () => {
      component.tipos = mockTipos;
      component.form.get('tipoEquipamentoId')?.setValue(1);
      component.campoIMEI = 'IMEI-TESTE';
      component.campoTelefone = 'TEL-TESTE';
      component.chipSelecionado = { patrimonio: 'CHIP-TESTE' };
      equipmentService.criar.and.returnValue(of({ id: 2 }));
      preencherFormValido();
      component.salvar();
      const dadosPassados = equipmentService.criar.calls.mostRecent().args[0];
      expect(dadosPassados.especificacoes.imei).toBe('IMEI-TESTE');
      expect(dadosPassados.especificacoes.telefone).toBe('TEL-TESTE');
      expect(dadosPassados.especificacoes.chip_vinculado_pat).toBe('CHIP-TESTE');
    });

    it('deve converter dataAquisicao para ISO string ao salvar', () => {
      equipmentService.criar.and.returnValue(of({ id: 2 }));
      preencherFormValido();
      const data = new Date('2024-06-15');
      component.form.get('dataAquisicao')?.setValue(data);
      component.salvar();
      const dadosPassados = equipmentService.criar.calls.mostRecent().args[0];
      expect(dadosPassados.dataAquisicao).toBe(data.toISOString());
    });

    it('deve remover o id do payload antes de criar', () => {
      equipmentService.criar.and.returnValue(of({ id: 2 }));
      preencherFormValido();
      component.form.get('id')?.setValue(99);
      component.salvar();
      const dadosPassados = equipmentService.criar.calls.mostRecent().args[0];
      expect(dadosPassados.id).toBeUndefined();
    });

    it('deve mostrar mensagem de erro quando a requisi��o falha', () => {
      equipmentService.criar.and.returnValue(of(undefined));
      spyOn(console, 'error');
      preencherFormValido();
      component.salvar();
      expect(messageService.add).toHaveBeenCalledWith(jasmine.objectContaining({
        severity: 'success'
      }));
    });
  });

  describe('fechar', () => {
    it('deve emitir false no visibleChange', () => {
      spyOn(component.visibleChange, 'emit');
      component.fechar();
      expect(component.visibleChange.emit).toHaveBeenCalledWith(false);
    });
  });

  describe('exibirCamposCelular', () => {
    beforeEach(() => {
      component.tipos = mockTipos;
    });

    it('deve retornar true quando tipo cont�m CELULAR', () => {
      component.form.get('tipoEquipamentoId')?.setValue(1);
      expect(component.exibirCamposCelular).toBeTrue();
    });

    it('deve retornar true quando tipo cont�m SMARTPHONE', () => {
      component.form.get('tipoEquipamentoId')?.setValue(2);
      expect(component.exibirCamposCelular).toBeTrue();
    });

    it('deve retornar true quando tipo cont�m MOVEL', () => {
      component.form.get('tipoEquipamentoId')?.setValue(3);
      expect(component.exibirCamposCelular).toBeTrue();
    });

    it('deve retornar false quando tipo n�o � celular', () => {
      component.form.get('tipoEquipamentoId')?.setValue(4);
      expect(component.exibirCamposCelular).toBeFalse();
    });

    it('deve retornar false quando tipo n�o encontrado', () => {
      component.form.get('tipoEquipamentoId')?.setValue(999);
      expect(component.exibirCamposCelular).toBeFalse();
    });

    it('deve retornar false quando tipoEquipamentoId � null', () => {
      component.form.get('tipoEquipamentoId')?.setValue(null);
      expect(component.exibirCamposCelular).toBeFalse();
    });
  });

  describe('atualizarCamposDinamicos', () => {
    beforeEach(() => {
      component.tipos = mockTipos;
    });

    it('deve definir camposDinamicos para tipo CPU', () => {
      component.atualizarCamposDinamicos(5);
      expect(component.camposDinamicos.length).toBe(4);
      expect(component.camposDinamicos[0].key).toBe('processador');
      expect(component.camposDinamicos[1].key).toBe('memoria_ram');
    });

    it('deve definir camposDinamicos para tipo NOTEBOOK', () => {
      component.atualizarCamposDinamicos(4);
      expect(component.camposDinamicos.length).toBe(3);
      expect(component.camposDinamicos[0].label).toBe('Processador');
    });

    it('deve limpar camposDinamicos quando tipo n�o � encontrado no mapa', () => {
      component.atualizarCamposDinamicos(1);
      expect(component.camposDinamicos.length).toBe(0);
    });

    it('deve limpar camposDinamicos quando tipoId n�o existe', () => {
      component.atualizarCamposDinamicos(999);
      expect(component.camposDinamicos).toEqual([]);
    });
  });

  describe('atualizarModelosPorMarca', () => {
    beforeEach(() => {
      component.modelos = [...mockModelos];
      component.modelosFiltrados = [...mockModelos];
    });

    it('deve filtrar modelos pela marcaId fornecida', () => {
      component.atualizarModelosPorMarca(1);
      expect(component.modelosFiltrados.length).toBe(2);
      expect(component.modelosFiltrados.every((m: any) => m.marcaId === 1)).toBeTrue();
    });

    it('deve filtrar modelos para marcaId 2', () => {
      component.atualizarModelosPorMarca(2);
      expect(component.modelosFiltrados.length).toBe(1);
      expect(component.modelosFiltrados[0].id).toBe(2);
    });

    it('deve limpar modeloId se o modelo atual n�o pertence � marca', () => {
      component.form.patchValue({ modeloId: 2 });
      component.atualizarModelosPorMarca(1);
      expect(component.form.get('modeloId')?.value).toBeNull();
    });

    it('deve manter modeloId se o modelo atual pertence � marca', () => {
      component.form.patchValue({ modeloId: 1 });
      component.atualizarModelosPorMarca(1);
      expect(component.form.get('modeloId')?.value).toBe(1);
    });

    it('deve exibir todos os modelos quando marcaId � null', () => {
      component.atualizarModelosPorMarca(null);
      expect(component.modelosFiltrados).toEqual(mockModelos);
    });

    it('deve exibir todos os modelos quando marcaId � undefined', () => {
      component.atualizarModelosPorMarca(undefined as any);
      expect(component.modelosFiltrados).toEqual(mockModelos);
    });

    it('deve exibir todos os modelos quando marcaId � 0', () => {
      component.atualizarModelosPorMarca(0);
      expect(component.modelosFiltrados).toEqual(mockModelos);
    });
  });

  describe('abrirPrompt / confirmarPrompt', () => {
    it('deve configurar valores corretamente ao abrir prompt', () => {
      const callback = () => {};
      component.abrirPrompt('Informe o nome:', callback);
      expect(component.rotuloPrompt).toBe('Informe o nome:');
      expect(component.valorPrompt).toBe('');
      expect(component.callbackPrompt).toBe(callback);
      expect(component.exibirDialogoPrompt).toBeTrue();
    });

    it('deve executar o callback com o valor trimado ao confirmar', () => {
      const resultado = jasmine.createSpy('callback');
      component.abrirPrompt('Teste', resultado);
      component.valorPrompt = '  Valor Teste  ';
      component.confirmarPrompt();
      expect(resultado).toHaveBeenCalledWith('Valor Teste');
    });

    it('n�o deve executar o callback quando valorPrompt est� vazio', () => {
      const resultado = jasmine.createSpy('callback');
      component.abrirPrompt('Teste', resultado);
      component.valorPrompt = '   ';
      component.confirmarPrompt();
      expect(resultado).not.toHaveBeenCalled();
    });

    it('n�o deve executar o callback quando callbackPrompt � null', () => {
      const resultado = jasmine.createSpy('callback');
      component.abrirPrompt('Teste', resultado);
      component.callbackPrompt = null;
      component.valorPrompt = 'Valor';
      component.confirmarPrompt();
      expect(resultado).not.toHaveBeenCalled();
    });

    it('deve resetar estado ap�s confirmar', () => {
      component.abrirPrompt('Teste', () => {});
      component.valorPrompt = 'Valor';
      component.confirmarPrompt();
      expect(component.exibirDialogoPrompt).toBeFalse();
      expect(component.callbackPrompt).toBeNull();
      expect(component.valorPrompt).toBe('');
    });
  });

  describe('solicitarNovoStatus', () => {
    it('deve chamar criarStatus ao confirmar o prompt', () => {
      settingsService.criarStatus.and.returnValue(of({ id: 5 }));
      component.solicitarNovoStatus();
      component.valorPrompt = 'Novo Status';
      component.confirmarPrompt();
      expect(settingsService.criarStatus).toHaveBeenCalledWith({ nome: 'Novo Status' });
    });

    it('deve mostrar mensagem de sucesso ap�s criar status', () => {
      settingsService.criarStatus.and.returnValue(of({ id: 5 }));
      component.solicitarNovoStatus();
      component.valorPrompt = 'Ativo';
      component.confirmarPrompt();
      expect(messageService.add).toHaveBeenCalledWith(jasmine.objectContaining({
        severity: 'success',
        summary: 'Status criado'
      }));
    });

    it('deve recarregar status ap�s criar', () => {
      spyOn(component, 'refreshStatus').and.callThrough();
      settingsService.criarStatus.and.returnValue(of({ id: 5 }));
      settingsService.listarStatus.and.returnValue(of([...mockStatus, { id: 5, nome: 'Novo' }]));
      component.solicitarNovoStatus();
      component.valorPrompt = 'Novo';
      component.confirmarPrompt();
      expect(component.refreshStatus).toHaveBeenCalled();
    });

    it('deve mostrar mensagem de erro quando criarStatus falha', () => {
      settingsService.criarStatus.and.returnValue(throwError(() => new Error('Falha')));
      component.solicitarNovoStatus();
      component.valorPrompt = 'Erro';
      component.confirmarPrompt();
      expect(messageService.add).toHaveBeenCalledWith(jasmine.objectContaining({
        severity: 'error',
        summary: 'Erro'
      }));
    });
  });

  describe('excluirStatus', () => {
    beforeEach(() => {
      settingsService.listarStatus.and.returnValue(of(mockStatus));
    });

    it('deve chamar excluirStatus do servi�o com o id fornecido', () => {
      settingsService.excluirStatus.and.returnValue(of({ success: true }));
      component.excluirStatus(5);
      expect(settingsService.excluirStatus).toHaveBeenCalledWith(5);
    });

    it('deve mostrar mensagem de sucesso ap�s excluir status', () => {
      settingsService.excluirStatus.and.returnValue(of({ success: true }));
      component.excluirStatus(5);
      expect(messageService.add).toHaveBeenCalledWith(jasmine.objectContaining({
        severity: 'success',
        summary: 'Status exclu�do'
      }));
    });

    it('deve recarregar status ap�s excluir', () => {
      spyOn(component, 'refreshStatus').and.callThrough();
      settingsService.excluirStatus.and.returnValue(of({ success: true }));
      component.excluirStatus(5);
      expect(component.refreshStatus).toHaveBeenCalled();
    });

    it('deve mostrar mensagem de erro quando a exclus�o falha', () => {
      settingsService.excluirStatus.and.returnValue(throwError(() => new Error('Falha')));
      component.excluirStatus(5);
      expect(messageService.add).toHaveBeenCalledWith(jasmine.objectContaining({
        severity: 'error',
        summary: 'Erro'
      }));
    });
  });

  describe('solicitarNovoTipo', () => {
    it('deve chamar criarTipo e atualizar tipoEquipamentoId ao confirmar', () => {
      settingsService.criarTipo.and.returnValue(of({ id: 10 }));
      spyOn(component, 'refreshTipos').and.callThrough();
      component.solicitarNovoTipo();
      component.valorPrompt = 'Tablet';
      component.confirmarPrompt();
      expect(settingsService.criarTipo).toHaveBeenCalledWith({ nome: 'Tablet' });
      expect(component.form.get('tipoEquipamentoId')?.value).toBe(10);
    });

    it('deve mostrar mensagem de sucesso ap�s criar tipo', () => {
      settingsService.criarTipo.and.returnValue(of({ id: 10 }));
      component.solicitarNovoTipo();
      component.valorPrompt = 'Tablet';
      component.confirmarPrompt();
      expect(messageService.add).toHaveBeenCalledWith(jasmine.objectContaining({
        severity: 'success',
        summary: 'Tipo criado'
      }));
    });

    it('deve mostrar mensagem de erro quando criarTipo falha', () => {
      settingsService.criarTipo.and.returnValue(throwError(() => new Error('Falha')));
      component.solicitarNovoTipo();
      component.valorPrompt = 'Erro';
      component.confirmarPrompt();
      expect(messageService.add).toHaveBeenCalledWith(jasmine.objectContaining({
        severity: 'error',
        summary: 'Erro'
      }));
    });
  });

  describe('solicitarNovaMarca', () => {
    it('deve chamar criarMarca e atualizar marcaId ao confirmar', () => {
      settingsService.criarMarca.and.returnValue(of({ id: 20 }));
      spyOn(component, 'refreshMarcas').and.callThrough();
      component.solicitarNovaMarca();
      component.valorPrompt = 'HP';
      component.confirmarPrompt();
      expect(settingsService.criarMarca).toHaveBeenCalledWith({ nome: 'HP' });
      expect(component.form.get('marcaId')?.value).toBe(20);
    });

    it('deve mostrar mensagem de sucesso ap�s criar marca', () => {
      settingsService.criarMarca.and.returnValue(of({ id: 20 }));
      component.solicitarNovaMarca();
      component.valorPrompt = 'HP';
      component.confirmarPrompt();
      expect(messageService.add).toHaveBeenCalledWith(jasmine.objectContaining({
        severity: 'success',
        summary: 'Marca criada'
      }));
    });

    it('deve mostrar mensagem de erro quando criarMarca falha', () => {
      settingsService.criarMarca.and.returnValue(throwError(() => new Error('Falha')));
      component.solicitarNovaMarca();
      component.valorPrompt = 'Erro';
      component.confirmarPrompt();
      expect(messageService.add).toHaveBeenCalledWith(jasmine.objectContaining({
        severity: 'error',
        summary: 'Erro'
      }));
    });
  });

  describe('solicitarNovoModelo', () => {
    it('deve mostrar aviso quando marcaId n�o est� selecionado', () => {
      component.form.get('marcaId')?.setValue(null);
      component.solicitarNovoModelo();
      expect(messageService.add).toHaveBeenCalledWith(jasmine.objectContaining({
        severity: 'warn',
        summary: 'Escolha a marca'
      }));
    });

    it('deve chamar criarModelo com marcaId ao confirmar', () => {
      settingsService.criarModelo.and.returnValue(of({ id: 30 }));
      component.form.get('marcaId')?.setValue(2);
      spyOn(component, 'refreshModelos').and.callThrough();
      component.solicitarNovoModelo();
      component.valorPrompt = 'Novo Modelo';
      component.confirmarPrompt();
      expect(settingsService.criarModelo).toHaveBeenCalledWith({ nome: 'Novo Modelo', marcaId: 2 });
      expect(component.form.get('modeloId')?.value).toBe(30);
    });

    it('deve mostrar mensagem de sucesso ap�s criar modelo', () => {
      settingsService.criarModelo.and.returnValue(of({ id: 30 }));
      component.form.get('marcaId')?.setValue(1);
      component.solicitarNovoModelo();
      component.valorPrompt = 'OptiPlex';
      component.confirmarPrompt();
      expect(messageService.add).toHaveBeenCalledWith(jasmine.objectContaining({
        severity: 'success',
        summary: 'Modelo criado'
      }));
    });

    it('deve mostrar mensagem de erro quando criarModelo falha', () => {
      settingsService.criarModelo.and.returnValue(throwError(() => new Error('Falha')));
      component.form.get('marcaId')?.setValue(1);
      component.solicitarNovoModelo();
      component.valorPrompt = 'Falha';
      component.confirmarPrompt();
      expect(messageService.add).toHaveBeenCalledWith(jasmine.objectContaining({
        severity: 'error',
        summary: 'Erro'
      }));
    });
  });

  describe('refreshStatus / refreshTipos / refreshMarcas / refreshModelos', () => {
    beforeEach(() => {
      settingsService.listarStatus.and.returnValue(of(mockStatus));
      settingsService.listarTipos.and.returnValue(of(mockTipos));
      settingsService.listarMarcas.and.returnValue(of(mockMarcas));
      settingsService.listarModelos.and.returnValue(of(mockModelos));
    });

    it('refreshStatus deve recarregar status do servi�o', () => {
      component.refreshStatus();
      expect(settingsService.listarStatus).toHaveBeenCalled();
      expect(component.status).toEqual(mockStatus);
    });

    it('refreshTipos deve recarregar tipos do servi�o', () => {
      component.refreshTipos();
      expect(settingsService.listarTipos).toHaveBeenCalled();
      expect(component.tipos).toEqual(mockTipos);
    });

    it('refreshMarcas deve recarregar marcas do servi�o', () => {
      component.refreshMarcas();
      expect(settingsService.listarMarcas).toHaveBeenCalled();
      expect(component.marcas).toEqual(mockMarcas);
    });

    it('refreshModelos deve recarregar modelos e filtrar por marca atual', () => {
      component.modelos = [];
      component.modelosFiltrados = [];
      component.form.patchValue({ marcaId: 1 });
      component.refreshModelos();
      expect(settingsService.listarModelos).toHaveBeenCalled();
      expect(component.modelos).toEqual(mockModelos);
      expect(component.modelosFiltrados.every((m: any) => m.marcaId === 1)).toBeTrue();
    });
  });

  describe('carregarChips', () => {
    it('deve carregar chips de equipamentos do tipo CHIP', () => {
      const chipsMock = [
        { patrimonio: 'CHIP-001', numeroSerie: '8901234567' },
        { patrimonio: 'CHIP-002', numeroSerie: '8901234568' }
      ];
      equipmentService.listarTodos.and.returnValue(of({ itens: chipsMock, total: 2 }));
      component.carregarChips();
      expect(equipmentService.listarTodos).toHaveBeenCalledWith(1, 100, 'CHIP');
      expect(component.chipsDisponiveis).toEqual(chipsMock);
    });

    it('deve lidar com resposta sem itens', () => {
      equipmentService.listarTodos.and.returnValue(of({ total: 0 }));
      component.carregarChips();
      expect(component.chipsDisponiveis).toEqual([]);
    });
  });

  describe('ngOnDestroy', () => {
    it('deve parar de responder a valueChanges ap�s ngOnDestroy', fakeAsync(() => {
      spyOn(component, 'atualizarCamposDinamicos').and.callThrough();
      spyOn(component, 'atualizarModelosPorMarca').and.callThrough();
      component.tipos = mockTipos;
      component.ngOnDestroy();
      component.form.get('tipoEquipamentoId')?.setValue(5);
      component.form.get('marcaId')?.setValue(1);
      tick();
      expect(component.atualizarCamposDinamicos).not.toHaveBeenCalled();
      expect(component.atualizarModelosPorMarca).not.toHaveBeenCalled();
    }));

    it('deve executar sem lan�ar erro', () => {
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });

  describe('Casos de borda', () => {
    it('deve inicializar chipSelecionado como null quando chip_vinculado_pat est� ausente', () => {
      const eqSemChip = {
        ...mockEquipment,
        especificacoes: { imei: '123', telefone: '456' }
      };
      component.preencherForm(eqSemChip);
      expect(component.chipSelecionado).toBeNull();
    });

    it('deve tratar chipSelecionado como null quando chip_vinculado_pat � string vazia', () => {
      const eqChipVazio = {
        ...mockEquipment,
        especificacoes: { imei: '123', telefone: '456', chip_vinculado_pat: '' }
      };
      component.preencherForm(eqChipVazio);
      expect(component.chipSelecionado).toBeNull();
    });

    it('deve cancelar prompt sem executar callback quando bot�o cancelar � clicado', () => {
      const callback = jasmine.createSpy('callback');
      component.abrirPrompt('Teste', callback);
      component.valorPrompt = 'Valor';
      component.exibirDialogoPrompt = false;
      component.valorPrompt = '';
      expect(callback).not.toHaveBeenCalled();
    });

    it('deve resetar valores do prompt ao fechar sem confirmar', () => {
      const callback = jasmine.createSpy('callback');
      component.abrirPrompt('Teste', callback);
      component.valorPrompt = 'Algum valor';
      component.exibirDialogoPrompt = false;
      component.callbackPrompt = null;
      component.valorPrompt = '';
      expect(callback).not.toHaveBeenCalled();
      expect(component.exibirDialogoPrompt).toBeFalse();
      expect(component.valorPrompt).toBe('');
    });

    it('deve lidar com dataAquisicao nula no preencherForm', () => {
      const eqSemData = { ...mockEquipment, dataAquisicao: null };
      component.preencherForm(eqSemData);
      expect(component.form.get('dataAquisicao')?.value).toBeNull();
    });

    it('deve manter chipSelecionado null em resetarForm', () => {
      component.chipSelecionado = { patrimonio: 'CHIP-TESTE' };
      component.resetarForm();
      expect(component.chipSelecionado).toBeNull();
    });

    it('deve lidar com erro ao criar tipo inline', () => {
      settingsService.criarTipo.and.returnValue(throwError(() => new Error('Falha')));
      component.solicitarNovoTipo();
      component.valorPrompt = 'Tipo Erro';
      component.confirmarPrompt();
      expect(messageService.add).toHaveBeenCalledWith(jasmine.objectContaining({
        severity: 'error',
        summary: 'Erro'
      }));
    });

    it('deve lidar com erro ao criar marca inline', () => {
      settingsService.criarMarca.and.returnValue(throwError(() => new Error('Falha')));
      component.solicitarNovaMarca();
      component.valorPrompt = 'Marca Erro';
      component.confirmarPrompt();
      expect(messageService.add).toHaveBeenCalledWith(jasmine.objectContaining({
        severity: 'error',
        summary: 'Erro'
      }));
    });
  });
});
