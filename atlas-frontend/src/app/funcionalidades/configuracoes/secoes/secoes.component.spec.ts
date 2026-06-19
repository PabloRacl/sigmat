import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError, Subject } from 'rxjs';
import { SettingsSectionsComponent } from './secoes.component';
import { SettingsService } from '../../../nucleo/servicos/configuracoes.service';
import { AuthService } from '../../../nucleo/servicos/autenticacao.service';
import { EquipmentService } from '../../../nucleo/servicos/equipamentos.service';
import { TransfersService } from '../../../nucleo/servicos/transferencias.service';
import { MessageService } from 'primeng/api';
import { ConfirmationService } from 'primeng/api';
import { Router } from '@angular/router';

class MockSettingsService {
  listarSecoes = jasmine.createSpy('listarSecoes').and.returnValue(of([]));
  listarBatalhoes = jasmine.createSpy('listarBatalhoes').and.returnValue(of([]));
  listarTipos = jasmine.createSpy('listarTipos').and.returnValue(of([]));
  listarMarcas = jasmine.createSpy('listarMarcas').and.returnValue(of([]));
  listarModelos = jasmine.createSpy('listarModelos').and.returnValue(of([]));
  listarStatus = jasmine.createSpy('listarStatus').and.returnValue(of([]));
  criarSecao = jasmine.createSpy('criarSecao').and.returnValue(of({ id: 1 }));
  atualizarSecao = jasmine.createSpy('atualizarSecao').and.returnValue(of({ id: 1 }));
  criarTipo = jasmine.createSpy('criarTipo').and.returnValue(of({ id: 1 }));
  excluirTipo = jasmine.createSpy('excluirTipo').and.returnValue(of({}));
  criarMarca = jasmine.createSpy('criarMarca').and.returnValue(of({ id: 1 }));
  excluirMarca = jasmine.createSpy('excluirMarca').and.returnValue(of({}));
  criarModelo = jasmine.createSpy('criarModelo').and.returnValue(of({ id: 1 }));
  excluirModelo = jasmine.createSpy('excluirModelo').and.returnValue(of({}));
  criarStatus = jasmine.createSpy('criarStatus').and.returnValue(of({ id: 1 }));
  atualizarStatus = jasmine.createSpy('atualizarStatus').and.returnValue(of({ id: 1 }));
  excluirStatus = jasmine.createSpy('excluirStatus').and.returnValue(of({}));
}

class MockAuthService {
  getUsuario = jasmine.createSpy('getUsuario').and.returnValue({
    id: 1, perfil: 'ADMIN_DTEC', batalhaoId: 10, diretoriaId: 20, secaoId: 5, nome: 'Admin'
  });
}

class MockEquipmentService {
  listarTodos = jasmine.createSpy('listarTodos').and.returnValue(of({ itens: [], total: 0 }));
}

class MockTransfersService {
  solicitar = jasmine.createSpy('solicitar').and.returnValue(of({}));
}

class MockMessageService {
  add = jasmine.createSpy('add');
}

class MockConfirmationService {
  requireConfirmation$ = new Subject<any>();
  private acceptCb: (() => void) | null = null;
  private rejectCb: (() => void) | null = null;

  confirm(options: any) {
    this.acceptCb = options.accept || null;
    this.rejectCb = options.reject || null;
    this.requireConfirmation$.next(options);
  }

  accept() {
    if (this.acceptCb) {
      this.acceptCb();
      this.acceptCb = null;
    }
  }

  reject() {
    if (this.rejectCb) {
      this.rejectCb();
      this.rejectCb = null;
    }
  }
}

class MockRouter {
  url = '/configuracoes/secoes';
}

describe('SettingsSectionsComponent', () => {
  let component: SettingsSectionsComponent;
  let fixture: ComponentFixture<SettingsSectionsComponent>;
  let settingsService: MockSettingsService;
  let authService: MockAuthService;
  let equipmentService: MockEquipmentService;
  let transfersService: MockTransfersService;
  let messageService: MockMessageService;
  let confirmationService: MockConfirmationService;
  let router: MockRouter;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SettingsSectionsComponent],
      providers: [
        { provide: SettingsService, useClass: MockSettingsService },
        { provide: AuthService, useClass: MockAuthService },
        { provide: EquipmentService, useClass: MockEquipmentService },
        { provide: TransfersService, useClass: MockTransfersService },
        { provide: MessageService, useClass: MockMessageService },
        { provide: Router, useClass: MockRouter }
      ]
    })
    .overrideComponent(SettingsSectionsComponent, {
      set: { providers: [
        { provide: ConfirmationService, useClass: MockConfirmationService }
      ]}
    })
    .compileComponents();

    fixture = TestBed.createComponent(SettingsSectionsComponent);
    component = fixture.componentInstance;
    settingsService = TestBed.inject(SettingsService) as unknown as MockSettingsService;
    authService = TestBed.inject(AuthService) as unknown as MockAuthService;
    equipmentService = TestBed.inject(EquipmentService) as unknown as MockEquipmentService;
    transfersService = TestBed.inject(TransfersService) as unknown as MockTransfersService;
    messageService = TestBed.inject(MessageService) as unknown as MockMessageService;
    confirmationService = fixture.componentRef.injector.get(ConfirmationService) as unknown as MockConfirmationService;
    router = TestBed.inject(Router) as unknown as MockRouter;
    fixture.detectChanges();
  });

  it('deve criar o componente', () => {
    expect(component).toBeTruthy();
  });

  it('deve ter abaAtiva padrao como secoes', () => {
    expect(component.abaAtiva).toBe('secoes');
  });

  it('deve inicializar dialogVisivel como false', () => {
    expect(component.dialogVisivel).toBeFalse();
  });

  it('deve inicializar carregando como false', () => {
    expect(component.carregando).toBeFalse();
  });

  it('deve inicializar totalEquipamentos como 0', () => {
    expect(component.totalEquipamentos).toBe(0);
  });

  it('deve ter form com validators obrigatorios para sigla, nome e batalhaoId', () => {
    expect(component.form.get('sigla')?.hasError('required')).toBeTrue();
    expect(component.form.get('nome')?.hasError('required')).toBeTrue();
    expect(component.form.get('batalhaoId')?.hasError('required')).toBeTrue();
  });

  it('deve ter tipoForm com validator required para nome', () => {
    expect(component.tipoForm.get('nome')?.hasError('required')).toBeTrue();
  });

  it('deve ter marcaForm com validator required para nome', () => {
    expect(component.marcaForm.get('nome')?.hasError('required')).toBeTrue();
  });

  it('deve ter modeloForm com validators required para nome e marcaId', () => {
    expect(component.modeloForm.get('nome')?.hasError('required')).toBeTrue();
    expect(component.modeloForm.get('marcaId')?.hasError('required')).toBeTrue();
  });

  it('deve ter statusForm com validator required para nome', () => {
    expect(component.statusForm.get('nome')?.hasError('required')).toBeTrue();
  });

  it('deve inicializar arrays como vazios', () => {
    expect(component.secoes).toEqual([]);
    expect(component.batalhoes).toEqual([]);
    expect(component.tipos).toEqual([]);
    expect(component.marcas).toEqual([]);
    expect(component.modelos).toEqual([]);
    expect(component.statusList).toEqual([]);
  });

  it('ngOnInit deve carregar usuario do AuthService', () => {
    expect(authService.getUsuario).toHaveBeenCalled();
    expect(component.usuario).toBeTruthy();
  });

  it('ngOnInit deve definir userPerfil a partir do usuario', () => {
    expect(component.userPerfil).toBe('ADMIN_DTEC');
  });

  it('ngOnInit deve definir userBatalhaoId a partir do usuario', () => {
    expect(component.userBatalhaoId).toBe(10);
  });

  it('ngOnInit deve definir userDiretoriaId a partir do usuario', () => {
    expect(component.userDiretoriaId).toBe(20);
  });

  it('ngOnInit deve detectar rota /secoes quando URL contem /secoes', () => {
    expect(component.isSecoesRoute).toBeTrue();
  });

  it('ngOnInit nao deve detectar rota /secoes quando URL nao contem /secoes', () => {
    router.url = '/configuracoes/tipos';
    fixture = TestBed.createComponent(SettingsSectionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    expect(component.isSecoesRoute).toBeFalse();
  });

  it('ngOnInit deve chamar carregarDados', () => {
    expect(settingsService.listarSecoes).toHaveBeenCalled();
  });

  it('carregarDados deve carregar secoes', () => {
    expect(settingsService.listarSecoes).toHaveBeenCalled();
    expect(component.secoes).toEqual([]);
  });

  it('carregarDados deve carregar batalhoes', () => {
    expect(settingsService.listarBatalhoes).toHaveBeenCalled();
  });

  it('carregarDados deve carregar tipos', () => {
    expect(settingsService.listarTipos).toHaveBeenCalled();
  });

  it('carregarDados deve carregar marcas', () => {
    expect(settingsService.listarMarcas).toHaveBeenCalled();
  });

  it('carregarDados deve carregar modelos', () => {
    expect(settingsService.listarModelos).toHaveBeenCalled();
  });

  it('carregarDados deve carregar status', () => {
    expect(settingsService.listarStatus).toHaveBeenCalled();
  });

  it('carregarDados deve definir carregando como true e depois false', () => {
    expect(component.carregando).toBeFalse();
  });

  it('carregarDados deve filtrar batalhoes para USUARIO_BATALHAO', () => {
    authService.getUsuario.and.returnValue({ id: 2, perfil: 'USUARIO_BATALHAO', batalhaoId: 10 });
    settingsService.listarBatalhoes.and.returnValue(of([
      { id: 10, nome: 'Batalhao A', diretoriaId: 20 },
      { id: 20, nome: 'Batalhao B', diretoriaId: 20 }
    ]));
    fixture = TestBed.createComponent(SettingsSectionsComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService) as unknown as MockAuthService;
    settingsService = TestBed.inject(SettingsService) as unknown as MockSettingsService;
    fixture.detectChanges();
    expect(component.batalhoes.length).toBe(1);
    expect(component.batalhoes[0].id).toBe(10);
  });

  it('carregarDados deve filtrar batalhoes para COMANDANTE', () => {
    authService.getUsuario.and.returnValue({ id: 3, perfil: 'COMANDANTE', batalhaoId: 10 });
    settingsService.listarBatalhoes.and.returnValue(of([
      { id: 10, nome: 'Batalhao A' },
      { id: 20, nome: 'Batalhao B' }
    ]));
    fixture = TestBed.createComponent(SettingsSectionsComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService) as unknown as MockAuthService;
    settingsService = TestBed.inject(SettingsService) as unknown as MockSettingsService;
    fixture.detectChanges();
    expect(component.batalhoes.length).toBe(1);
  });

  it('carregarDados deve filtrar batalhoes para DIRETORIA', () => {
    authService.getUsuario.and.returnValue({ id: 4, perfil: 'DIRETORIA', diretoriaId: 20 });
    settingsService.listarBatalhoes.and.returnValue(of([
      { id: 10, nome: 'Batalhao A', diretoriaId: 20 },
      { id: 30, nome: 'Batalhao C', diretoriaId: 25 }
    ]));
    fixture = TestBed.createComponent(SettingsSectionsComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService) as unknown as MockAuthService;
    settingsService = TestBed.inject(SettingsService) as unknown as MockSettingsService;
    fixture.detectChanges();
    expect(component.batalhoes.length).toBe(1);
    expect(component.batalhoes[0].id).toBe(10);
  });

  it('carregarDados deve mostrar todos batalhoes para ADMIN_DTEC', () => {
    authService.getUsuario.and.returnValue({ id: 1, perfil: 'ADMIN_DTEC' });
    settingsService.listarBatalhoes.and.returnValue(of([
      { id: 10, nome: 'Batalhao A', diretoriaId: 20 },
      { id: 20, nome: 'Batalhao B', diretoriaId: 25 }
    ]));
    fixture = TestBed.createComponent(SettingsSectionsComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService) as unknown as MockAuthService;
    settingsService = TestBed.inject(SettingsService) as unknown as MockSettingsService;
    fixture.detectChanges();
    expect(component.batalhoes.length).toBe(2);
  });

  it('carregarDados deve tratar secoes null como array vazio', () => {
    settingsService.listarSecoes.and.returnValue(of(null));
    component.carregarDados();
    expect(component.secoes).toEqual([]);
  });

  it('carregarDados deve manter secoes anteriores em caso de erro', () => {
    const dadosAnteriores = [{ id: 1, sigla: 'SECAO' }];
    component.secoes = dadosAnteriores;
    settingsService.listarSecoes.and.returnValue(throwError(() => new Error('Erro')));
    component.carregarDados();
    expect(component.carregando).toBeFalse();
  });

  it('abaAtiva deve alternar para tipos', () => {
    component.abaAtiva = 'tipos';
    expect(component.abaAtiva).toBe('tipos');
  });

  it('abaAtiva deve alternar para marcas', () => {
    component.abaAtiva = 'marcas';
    expect(component.abaAtiva).toBe('marcas');
  });

  it('abaAtiva deve alternar para modelos', () => {
    component.abaAtiva = 'modelos';
    expect(component.abaAtiva).toBe('modelos');
  });

  it('abaAtiva deve alternar para status', () => {
    component.abaAtiva = 'status';
    expect(component.abaAtiva).toBe('status');
  });

  it('abrirDialog deve abrir dialogo em modo criacao', () => {
    component.abrirDialog();
    expect(component.dialogVisivel).toBeTrue();
    expect(component.editando).toBeFalse();
  });

  it('abrirDialog deve resetar formulario no modo criacao', () => {
    component.form.patchValue({ sigla: 'TEST', nome: 'Teste', batalhaoId: 5 });
    component.abrirDialog();
    expect(component.form.get('sigla')?.value).toBeNull();
    expect(component.form.get('id')?.value).toBeNull();
  });

  it('abrirDialog deve setar editando=true no modo edicao', () => {
    const secao = { id: 1, sigla: 'SEC', nome: 'Secao Teste', batalhaoId: 10 };
    component.abrirDialog(secao);
    expect(component.editando).toBeTrue();
  });

  it('abrirDialog deve preencher formulario com dados da secao', () => {
    const secao = { id: 1, sigla: 'SEC', nome: 'Secao Teste', batalhaoId: 10 };
    component.abrirDialog(secao);
    expect(component.form.get('id')?.value).toBe(1);
    expect(component.form.get('sigla')?.value).toBe('SEC');
    expect(component.form.get('nome')?.value).toBe('Secao Teste');
    expect(component.form.get('batalhaoId')?.value).toBe(10);
  });

  it('abrirDialog deve preencher batalhaoId para USUARIO_BATALHAO no modo criacao', () => {
    component.userPerfil = 'USUARIO_BATALHAO';
    component.userBatalhaoId = 15;
    component.abrirDialog();
    expect(component.form.get('batalhaoId')?.value).toBe(15);
  });

  it('abrirDialog deve desabilitar campo batalhaoId para USUARIO_BATALHAO', () => {
    component.userPerfil = 'USUARIO_BATALHAO';
    component.abrirDialog();
    expect(component.form.get('batalhaoId')?.disabled).toBeTrue();
  });

  it('abrirDialog deve habilitar campo batalhaoId para ADMIN_DTEC', () => {
    component.userPerfil = 'ADMIN_DTEC';
    component.abrirDialog();
    expect(component.form.get('batalhaoId')?.enabled).toBeTrue();
  });

  it('abrirDialog nao deve setar batalhaoId quando USUARIO_BATALHAO sem batalhaoId', () => {
    component.userPerfil = 'USUARIO_BATALHAO';
    component.userBatalhaoId = null;
    component.abrirDialog();
    expect(component.form.get('batalhaoId')?.value).toBeNull();
  });

  it('salvar deve exibir aviso quando formulario invalido', () => {
    component.form.get('sigla')?.setValue('');
    component.form.get('nome')?.setValue('');
    component.salvar();
    expect(messageService.add).toHaveBeenCalledWith(jasmine.objectContaining({ severity: 'warn', summary: 'Validação' }));
  });

  it('salvar nao deve chamar servico quando formulario invalido', () => {
    component.form.get('sigla')?.setValue('');
    component.form.get('nome')?.setValue('');
    component.salvar();
    expect(settingsService.criarSecao).not.toHaveBeenCalled();
    expect(settingsService.atualizarSecao).not.toHaveBeenCalled();
  });

  it('salvar deve chamar criarSecao para nova secao', () => {
    component.editando = false;
    component.form.patchValue({ sigla: 'SEC', nome: 'Secao', batalhaoId: 10 });
    component.salvar();
    expect(settingsService.criarSecao).toHaveBeenCalledWith({ sigla: 'SEC', nome: 'Secao', batalhaoId: 10, id: null });
  });

  it('salvar deve chamar atualizarSecao para edicao', () => {
    component.editando = true;
    component.form.patchValue({ id: 5, sigla: 'SEC', nome: 'Secao Edit', batalhaoId: 10 });
    component.salvar();
    expect(settingsService.atualizarSecao).toHaveBeenCalledWith(5, { id: 5, sigla: 'SEC', nome: 'Secao Edit', batalhaoId: 10 });
  });

  it('salvar deve exibir sucesso e fechar dialogo apos criar', () => {
    component.editando = false;
    component.form.patchValue({ sigla: 'SEC', nome: 'Secao', batalhaoId: 10 });
    component.salvar();
    expect(messageService.add).toHaveBeenCalledWith(jasmine.objectContaining({ severity: 'success' }));
    expect(component.dialogVisivel).toBeFalse();
  });

  it('salvar deve exibir sucesso e fechar dialogo apos atualizar', () => {
    component.editando = true;
    component.form.patchValue({ id: 5, sigla: 'SEC', nome: 'Secao', batalhaoId: 10 });
    component.salvar();
    expect(messageService.add).toHaveBeenCalledWith(jasmine.objectContaining({ severity: 'success' }));
    expect(component.dialogVisivel).toBeFalse();
  });

  it('salvar deve recarregar dados apos sucesso', () => {
    settingsService.listarSecoes.calls.reset();
    component.editando = false;
    component.form.patchValue({ sigla: 'SEC', nome: 'Secao', batalhaoId: 10 });
    component.salvar();
    expect(settingsService.listarSecoes).toHaveBeenCalled();
  });

  it('salvar deve exibir erro quando criacao falha', () => {
    settingsService.criarSecao.and.returnValue(throwError(() => ({ error: { message: 'Erro ao criar' } })));
    component.editando = false;
    component.form.patchValue({ sigla: 'SEC', nome: 'Secao', batalhaoId: 10 });
    component.salvar();
    expect(messageService.add).toHaveBeenCalledWith(jasmine.objectContaining({ severity: 'error', detail: 'Erro ao criar' }));
  });

  it('salvar deve exibir mensagem padrao quando erro nao tem mensagem', () => {
    settingsService.criarSecao.and.returnValue(throwError(() => ({})));
    component.editando = false;
    component.form.patchValue({ sigla: 'SEC', nome: 'Secao', batalhaoId: 10 });
    component.salvar();
    expect(messageService.add).toHaveBeenCalledWith(jasmine.objectContaining({ severity: 'error', detail: 'Falha ao salvar seção.' }));
  });

  it('fecharDialog deve fechar dialogo', () => {
    component.dialogVisivel = true;
    component.fecharDialog();
    expect(component.dialogVisivel).toBeFalse();
  });

  it('abrirDialogTipo deve resetar form e abrir dialogo', () => {
    component.tipoForm.patchValue({ nome: 'Teste' });
    component.abrirDialogTipo();
    expect(component.tipoForm.get('nome')?.value).toBeNull();
    expect(component.tipoDialogVisivel).toBeTrue();
  });

  it('salvarTipo deve criar tipo via SettingsService', () => {
    component.tipoForm.patchValue({ nome: 'Tipo Teste' });
    component.salvarTipo();
    expect(settingsService.criarTipo).toHaveBeenCalledWith({ nome: 'Tipo Teste' });
  });

  it('salvarTipo deve exibir sucesso e fechar dialogo', () => {
    component.tipoForm.patchValue({ nome: 'Tipo Teste' });
    component.salvarTipo();
    expect(messageService.add).toHaveBeenCalledWith(jasmine.objectContaining({ severity: 'success' }));
    expect(component.tipoDialogVisivel).toBeFalse();
  });

  it('salvarTipo nao deve chamar servico quando formulario invalido', () => {
    component.salvarTipo();
    expect(settingsService.criarTipo).not.toHaveBeenCalled();
  });

  it('salvarTipo deve recarregar dados apos sucesso', () => {
    settingsService.listarTipos.calls.reset();
    component.tipoForm.patchValue({ nome: 'Tipo Teste' });
    component.salvarTipo();
    expect(settingsService.listarTipos).toHaveBeenCalled();
  });

  it('salvarTipo deve exibir erro quando criacao falha', () => {
    settingsService.criarTipo.and.returnValue(throwError(() => ({ error: { message: 'Erro tipo' } })));
    component.tipoForm.patchValue({ nome: 'Tipo Teste' });
    component.salvarTipo();
    expect(messageService.add).toHaveBeenCalledWith(jasmine.objectContaining({ severity: 'error', detail: 'Erro tipo' }));
  });

  it('excluirTipo deve chamar confirmacao', () => {
    spyOn(confirmationService, 'confirm').and.callThrough();
    component.excluirTipo(1, 'Tipo Teste');
    expect(confirmationService.confirm).toHaveBeenCalled();
  });

  it('excluirTipo deve excluir ao confirmar', () => {
    component.excluirTipo(1, 'Tipo Teste');
    confirmationService.accept();
    expect(settingsService.excluirTipo).toHaveBeenCalledWith(1);
  });

  it('excluirTipo deve exibir sucesso apos exclusao', () => {
    component.excluirTipo(1, 'Tipo Teste');
    confirmationService.accept();
    expect(messageService.add).toHaveBeenCalledWith(jasmine.objectContaining({ severity: 'success' }));
  });

  it('excluirTipo deve recarregar dados apos excluir', () => {
    settingsService.listarTipos.calls.reset();
    component.excluirTipo(1, 'Tipo Teste');
    confirmationService.accept();
    expect(settingsService.listarTipos).toHaveBeenCalled();
  });

  it('excluirTipo deve exibir erro quando exclusao falha', () => {
    settingsService.excluirTipo.and.returnValue(throwError(() => ({ error: { message: 'Erro excluir' } })));
    component.excluirTipo(1, 'Tipo Teste');
    confirmationService.accept();
    expect(messageService.add).toHaveBeenCalledWith(jasmine.objectContaining({ severity: 'error', detail: 'Erro excluir' }));
  });

  it('abrirDialogMarca deve resetar form e abrir dialogo', () => {
    component.marcaForm.patchValue({ nome: 'Marca' });
    component.abrirDialogMarca();
    expect(component.marcaForm.get('nome')?.value).toBeNull();
    expect(component.marcaDialogVisivel).toBeTrue();
  });

  it('salvarMarca deve criar marca via SettingsService', () => {
    component.marcaForm.patchValue({ nome: 'Marca Teste' });
    component.salvarMarca();
    expect(settingsService.criarMarca).toHaveBeenCalledWith({ nome: 'Marca Teste' });
  });

  it('salvarMarca deve exibir sucesso e fechar dialogo', () => {
    component.marcaForm.patchValue({ nome: 'Marca Teste' });
    component.salvarMarca();
    expect(messageService.add).toHaveBeenCalledWith(jasmine.objectContaining({ severity: 'success' }));
    expect(component.marcaDialogVisivel).toBeFalse();
  });

  it('salvarMarca nao deve chamar servico quando invalido', () => {
    component.salvarMarca();
    expect(settingsService.criarMarca).not.toHaveBeenCalled();
  });

  it('salvarMarca deve exibir erro quando falha', () => {
    settingsService.criarMarca.and.returnValue(throwError(() => ({ error: { message: 'Erro' } })));
    component.marcaForm.patchValue({ nome: 'Marca' });
    component.salvarMarca();
    expect(messageService.add).toHaveBeenCalledWith(jasmine.objectContaining({ severity: 'error' }));
  });

  it('excluirMarca deve excluir ao confirmar', () => {
    component.excluirMarca(1, 'Marca Teste');
    confirmationService.accept();
    expect(settingsService.excluirMarca).toHaveBeenCalledWith(1);
  });

  it('excluirMarca deve exibir sucesso apos exclusao', () => {
    component.excluirMarca(1, 'Marca Teste');
    confirmationService.accept();
    expect(messageService.add).toHaveBeenCalledWith(jasmine.objectContaining({ severity: 'success' }));
  });

  it('excluirMarca deve exibir erro quando exclusao falha', () => {
    settingsService.excluirMarca.and.returnValue(throwError(() => ({ error: { message: 'Falha' } })));
    component.excluirMarca(1, 'Marca Teste');
    confirmationService.accept();
    expect(messageService.add).toHaveBeenCalledWith(jasmine.objectContaining({ severity: 'error', detail: 'Falha' }));
  });

  it('abrirDialogModelo deve resetar form e abrir dialogo', () => {
    component.modeloForm.patchValue({ nome: 'Modelo', marcaId: 1 });
    component.abrirDialogModelo();
    expect(component.modeloForm.get('nome')?.value).toBeNull();
    expect(component.modeloForm.get('marcaId')?.value).toBeNull();
    expect(component.modeloDialogVisivel).toBeTrue();
  });

  it('salvarModelo deve criar modelo via SettingsService', () => {
    component.modeloForm.patchValue({ nome: 'Modelo Teste', marcaId: 5 });
    component.salvarModelo();
    expect(settingsService.criarModelo).toHaveBeenCalledWith({ nome: 'Modelo Teste', marcaId: 5 });
  });

  it('salvarModelo deve exibir sucesso e fechar dialogo', () => {
    component.modeloForm.patchValue({ nome: 'Modelo Teste', marcaId: 5 });
    component.salvarModelo();
    expect(messageService.add).toHaveBeenCalledWith(jasmine.objectContaining({ severity: 'success' }));
    expect(component.modeloDialogVisivel).toBeFalse();
  });

  it('salvarModelo nao deve chamar servico quando invalido', () => {
    component.salvarModelo();
    expect(settingsService.criarModelo).not.toHaveBeenCalled();
  });

  it('salvarModelo deve exibir erro quando falha', () => {
    settingsService.criarModelo.and.returnValue(throwError(() => ({ error: { message: 'Erro modelo' } })));
    component.modeloForm.patchValue({ nome: 'Modelo', marcaId: 5 });
    component.salvarModelo();
    expect(messageService.add).toHaveBeenCalledWith(jasmine.objectContaining({ severity: 'error', detail: 'Erro modelo' }));
  });

  it('excluirModelo deve excluir ao confirmar', () => {
    component.excluirModelo(1, 'Modelo Teste');
    confirmationService.accept();
    expect(settingsService.excluirModelo).toHaveBeenCalledWith(1);
  });

  it('excluirModelo deve exibir sucesso apos exclusao', () => {
    component.excluirModelo(5, 'Modelo X');
    confirmationService.accept();
    expect(messageService.add).toHaveBeenCalledWith(jasmine.objectContaining({ severity: 'success' }));
  });

  it('excluirModelo deve exibir erro quando exclusao falha', () => {
    settingsService.excluirModelo.and.returnValue(throwError(() => ({ error: { message: 'Erro' } })));
    component.excluirModelo(1, 'M');
    confirmationService.accept();
    expect(messageService.add).toHaveBeenCalledWith(jasmine.objectContaining({ severity: 'error' }));
  });

  it('abrirDialogStatus deve abrir dialogo em modo criacao', () => {
    component.abrirDialogStatus();
    expect(component.editandoStatus).toBeFalse();
    expect(component.statusSelecionadoId).toBeNull();
    expect(component.statusDialogVisivel).toBeTrue();
  });

  it('abrirDialogStatus deve abrir dialogo em modo edicao com dados', () => {
    const status = { id: 3, nome: 'Ativo' };
    component.abrirDialogStatus(status);
    expect(component.editandoStatus).toBeTrue();
    expect(component.statusSelecionadoId).toBe(3);
    expect(component.statusForm.get('nome')?.value).toBe('Ativo');
    expect(component.statusDialogVisivel).toBeTrue();
  });

  it('salvarStatus deve criar novo status', () => {
    component.editandoStatus = false;
    component.statusSelecionadoId = null;
    component.statusForm.patchValue({ nome: 'Novo Status' });
    component.salvarStatus();
    expect(settingsService.criarStatus).toHaveBeenCalledWith({ nome: 'Novo Status' });
  });

  it('salvarStatus deve atualizar status existente', () => {
    component.editandoStatus = true;
    component.statusSelecionadoId = 3;
    component.statusForm.patchValue({ nome: 'Status Editado' });
    component.salvarStatus();
    expect(settingsService.atualizarStatus).toHaveBeenCalledWith(3, { nome: 'Status Editado' });
  });

  it('salvarStatus deve exibir sucesso e fechar dialogo', () => {
    component.editandoStatus = false;
    component.statusForm.patchValue({ nome: 'Novo' });
    component.salvarStatus();
    expect(messageService.add).toHaveBeenCalledWith(jasmine.objectContaining({ severity: 'success' }));
    expect(component.statusDialogVisivel).toBeFalse();
  });

  it('salvarStatus nao deve chamar servico quando invalido', () => {
    component.salvarStatus();
    expect(settingsService.criarStatus).not.toHaveBeenCalled();
  });

  it('salvarStatus deve exibir erro quando criacao falha', () => {
    settingsService.criarStatus.and.returnValue(throwError(() => ({ error: { message: 'Erro status' } })));
    component.editandoStatus = false;
    component.statusForm.patchValue({ nome: 'Novo' });
    component.salvarStatus();
    expect(messageService.add).toHaveBeenCalledWith(jasmine.objectContaining({ severity: 'error', detail: 'Erro status' }));
  });

  it('excluirStatus deve excluir ao confirmar', () => {
    component.excluirStatus(2, 'Status Teste');
    confirmationService.accept();
    expect(settingsService.excluirStatus).toHaveBeenCalledWith(2);
  });

  it('excluirStatus deve exibir sucesso apos exclusao', () => {
    component.excluirStatus(2, 'Status Teste');
    confirmationService.accept();
    expect(messageService.add).toHaveBeenCalledWith(jasmine.objectContaining({ severity: 'success' }));
  });

  it('excluirStatus deve exibir erro quando exclusao falha', () => {
    settingsService.excluirStatus.and.returnValue(throwError(() => ({ error: { message: 'Erro' } })));
    component.excluirStatus(2, 'S');
    confirmationService.accept();
    expect(messageService.add).toHaveBeenCalledWith(jasmine.objectContaining({ severity: 'error' }));
  });

  it('getBatalhaoNome deve retornar sigla quando batalhao encontrado', () => {
    component.batalhoes = [{ id: 10, sigla: 'BPM' }, { id: 20, sigla: 'CIA' }];
    expect(component.getBatalhaoNome(10)).toBe('BPM');
  });

  it('getBatalhaoNome deve retornar travessao quando batalhao nao encontrado', () => {
    component.batalhoes = [{ id: 10, sigla: 'BPM' }];
    expect(component.getBatalhaoNome(99)).toBe('—');
  });

  it('getBatalhaoNome deve retornar travessao quando lista vazia', () => {
    component.batalhoes = [];
    expect(component.getBatalhaoNome(10)).toBe('—');
  });

  it('getMarcaNome deve retornar nome quando marca encontrada', () => {
    component.marcas = [{ id: 1, nome: 'Dell' }, { id: 2, nome: 'HP' }];
    expect(component.getMarcaNome(1)).toBe('Dell');
  });

  it('getMarcaNome deve retornar travessao quando marca nao encontrada', () => {
    component.marcas = [{ id: 1, nome: 'Dell' }];
    expect(component.getMarcaNome(99)).toBe('—');
  });

  it('getMarcaNome deve retornar travessao quando lista vazia', () => {
    component.marcas = [];
    expect(component.getMarcaNome(1)).toBe('—');
  });

  it('abrirModalTransferencia deve definir origemSecaoId a partir da secao', () => {
    component.secoes = [{ id: 10, sigla: 'SEC', batalhaoId: 5 }];
    const secao = component.secoes[0];
    component.abrirModalTransferencia(secao);
    expect(component.origemSecaoId).toBe(10);
  });

  it('abrirModalTransferencia deve usar usuario.secaoId quando secao nao fornecida', () => {
    component.usuario = { secaoId: 7 };
    component.abrirModalTransferencia();
    expect(component.origemSecaoId).toBe(7);
  });

  it('abrirModalTransferencia deve definir origemSecaoId como null sem usuario e sem secao', () => {
    component.usuario = null;
    component.abrirModalTransferencia();
    expect(component.origemSecaoId).toBeNull();
  });

  it('abrirModalTransferencia deve resetar estado do dialogo', () => {
    component.destinoSecaoId = 99;
    component.equipamentoSelecionadoId = 88;
    component.observacaoTransferencia = 'teste';
    component.abrirModalTransferencia();
    expect(component.destinoSecaoId).toBeNull();
    expect(component.equipamentoSelecionadoId).toBeNull();
    expect(component.observacaoTransferencia).toBe('');
  });

  it('abrirModalTransferencia deve abrir modal e chamar filtrarDestinosPorOrigem', () => {
    spyOn(component, 'filtrarDestinosPorOrigem');
    component.abrirModalTransferencia();
    expect(component.exibirModalTransferencia).toBeTrue();
    expect(component.filtrarDestinosPorOrigem).toHaveBeenCalled();
  });

  it('filtrarDestinosPorOrigem deve filtrar secoes pelo batalhao da origem', () => {
    component.origemSecaoId = 1;
    component.secoes = [
      { id: 1, sigla: 'SEC1', batalhaoId: 10 },
      { id: 2, sigla: 'SEC2', batalhaoId: 10 },
      { id: 3, sigla: 'SEC3', batalhaoId: 20 }
    ];
    component.filtrarDestinosPorOrigem();
    expect(component.destinosDisponiveis.length).toBe(1);
    expect(component.destinosDisponiveis[0].id).toBe(2);
  });

  it('filtrarDestinosPorOrigem deve excluir a propria origem dos destinos', () => {
    component.origemSecaoId = 1;
    component.secoes = [
      { id: 1, sigla: 'SEC1', batalhaoId: 10 },
      { id: 2, sigla: 'SEC2', batalhaoId: 10 }
    ];
    component.filtrarDestinosPorOrigem();
    expect(component.destinosDisponiveis.some((s: any) => s.id === 1)).toBeFalse();
  });

  it('filtrarDestinosPorOrigem deve usar userBatalhaoId quando origem nao encontrada', () => {
    component.origemSecaoId = 99;
    component.userBatalhaoId = 10;
    component.secoes = [
      { id: 1, sigla: 'SEC1', batalhaoId: 10 },
      { id: 2, sigla: 'SEC2', batalhaoId: 20 }
    ];
    component.filtrarDestinosPorOrigem();
    expect(component.destinosDisponiveis.length).toBe(1);
    expect(component.destinosDisponiveis[0].id).toBe(1);
  });

  it('filtrarDestinosPorOrigem deve chamar carregarEquipamentosOrigem quando origem existe', () => {
    spyOn(component, 'carregarEquipamentosOrigem');
    component.origemSecaoId = 1;
    component.secoes = [{ id: 1, sigla: 'SEC1', batalhaoId: 10 }];
    component.filtrarDestinosPorOrigem();
    expect(component.carregarEquipamentosOrigem).toHaveBeenCalledWith(1);
  });

  it('filtrarDestinosPorOrigem deve limpar equipamentos quando nao ha origem', () => {
    component.equipamentosOrigem = [{ id: 1 }];
    component.origemSecaoId = null;
    component.filtrarDestinosPorOrigem();
    expect(component.equipamentosOrigem).toEqual([]);
  });

  it('carregarEquipamentosOrigem deve chamar equipmentService.listarTodos', () => {
    component.carregarEquipamentosOrigem(5);
    expect(equipmentService.listarTodos).toHaveBeenCalledWith(1, 1000, '', { secaoId: 5 });
  });

  it('carregarEquipamentosOrigem deve popular equipamentosOrigem', () => {
    const equipamentos = [{ id: 1, patrimonio: 'EQP001' }];
    equipmentService.listarTodos.and.returnValue(of({ itens: equipamentos, total: 1 }));
    component.carregarEquipamentosOrigem(5);
    expect(component.equipamentosOrigem).toEqual(equipamentos);
  });

  it('carregarEquipamentosOrigem deve limpar lista em caso de erro', () => {
    equipmentService.listarTodos.and.returnValue(throwError(() => new Error('Erro')));
    component.carregarEquipamentosOrigem(5);
    expect(component.equipamentosOrigem).toEqual([]);
  });

  it('confirmarTransferenciaInterna deve exibir aviso quando equipamento nao selecionado', () => {
    component.equipamentoSelecionadoId = null;
    component.destinoSecaoId = 2;
    component.confirmarTransferenciaInterna();
    expect(messageService.add).toHaveBeenCalledWith(jasmine.objectContaining({ severity: 'warn' }));
  });

  it('confirmarTransferenciaInterna deve exibir aviso quando destino nao selecionado', () => {
    component.equipamentoSelecionadoId = 1;
    component.destinoSecaoId = null;
    component.confirmarTransferenciaInterna();
    expect(messageService.add).toHaveBeenCalledWith(jasmine.objectContaining({ severity: 'warn' }));
  });

  it('confirmarTransferenciaInterna nao deve chamar servico quando campos ausentes', () => {
    component.equipamentoSelecionadoId = null;
    component.destinoSecaoId = null;
    component.confirmarTransferenciaInterna();
    expect(transfersService.solicitar).not.toHaveBeenCalled();
  });

  it('confirmarTransferenciaInterna deve chamar transfersService.solicitar', () => {
    component.equipamentoSelecionadoId = 10;
    component.destinoSecaoId = 20;
    component.observacaoTransferencia = 'Obs teste';
    component.confirmarTransferenciaInterna();
    expect(transfersService.solicitar).toHaveBeenCalledWith({
      equipamentoId: 10,
      destinoId: 20,
      observacao: 'Obs teste'
    });
  });

  it('confirmarTransferenciaInterna deve exibir sucesso e fechar modal', () => {
    component.equipamentoSelecionadoId = 10;
    component.destinoSecaoId = 20;
    component.confirmarTransferenciaInterna();
    expect(messageService.add).toHaveBeenCalledWith(jasmine.objectContaining({ severity: 'success' }));
    expect(component.exibirModalTransferencia).toBeFalse();
  });

  it('confirmarTransferenciaInterna deve recarregar dados apos sucesso', () => {
    settingsService.listarSecoes.calls.reset();
    component.equipamentoSelecionadoId = 10;
    component.destinoSecaoId = 20;
    component.confirmarTransferenciaInterna();
    expect(settingsService.listarSecoes).toHaveBeenCalled();
  });

  it('confirmarTransferenciaInterna deve exibir erro quando solicitacao falha', () => {
    transfersService.solicitar.and.returnValue(throwError(() => ({ error: { message: 'Erro transferencia' } })));
    component.equipamentoSelecionadoId = 10;
    component.destinoSecaoId = 20;
    component.confirmarTransferenciaInterna();
    expect(messageService.add).toHaveBeenCalledWith(jasmine.objectContaining({ severity: 'error', detail: 'Erro transferencia' }));
  });

  it('confirmarTransferenciaInterna deve exibir mensagem padrao quando erro sem mensagem', () => {
    transfersService.solicitar.and.returnValue(throwError(() => ({})));
    component.equipamentoSelecionadoId = 10;
    component.destinoSecaoId = 20;
    component.confirmarTransferenciaInterna();
    expect(messageService.add).toHaveBeenCalledWith(jasmine.objectContaining({ severity: 'error', detail: 'Falha ao criar transferência interna.' }));
  });

  it('atualizarTotalEquipamentos deve somar _count de equipamentos', () => {
    component.secoes = [
      { id: 1, _count: { equipamentos: 5 } },
      { id: 2, _count: { equipamentos: 3 } }
    ];
    component.atualizarTotalEquipamentos();
    expect(component.totalEquipamentos).toBe(8);
  });

  it('atualizarTotalEquipamentos deve tratar ausencia de _count como zero', () => {
    component.secoes = [
      { id: 1, _count: { equipamentos: 5 } },
      { id: 2, _count: null }
    ];
    component.atualizarTotalEquipamentos();
    expect(component.totalEquipamentos).toBe(5);
  });

  it('atualizarTotalEquipamentos deve retornar 0 para lista vazia', () => {
    component.secoes = [];
    component.atualizarTotalEquipamentos();
    expect(component.totalEquipamentos).toBe(0);
  });

  it('deve lidar com usuario sem batalhao', () => {
    authService.getUsuario.and.returnValue({ id: 1, perfil: 'ADMIN_DTEC', batalhaoId: null, diretoriaId: null });
    fixture = TestBed.createComponent(SettingsSectionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    expect(component.userBatalhaoId).toBeNull();
    expect(component.userDiretoriaId).toBeNull();
  });

  it('deve lidar com secoes retornando dados', () => {
    const secoesMock = [
      { id: 1, sigla: 'SECAO1', nome: 'Primeira Secao', batalhaoId: 10, _count: { equipamentos: 2 } }
    ];
    settingsService.listarSecoes.and.returnValue(of(secoesMock));
    component.carregarDados();
    expect(component.secoes.length).toBe(1);
    expect(component.secoes[0].sigla).toBe('SECAO1');
  });

  it('deve permitir usuario COMANDANTE que e tambem USUARIO_BATALHAO', () => {
    authService.getUsuario.and.returnValue({ id: 5, perfil: 'COMANDANTE', batalhaoId: 10 });
    settingsService.listarBatalhoes.and.returnValue(of([
      { id: 10, nome: 'B1' }, { id: 20, nome: 'B2' }
    ]));
    fixture = TestBed.createComponent(SettingsSectionsComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService) as unknown as MockAuthService;
    settingsService = TestBed.inject(SettingsService) as unknown as MockSettingsService;
    fixture.detectChanges();
    expect(component.batalhoes.length).toBe(1);
  });

  it('deve manter dialogVisivel false se salvar falhar', () => {
    settingsService.criarSecao.and.returnValue(throwError(() => new Error('Erro')));
    component.editando = false;
    component.form.patchValue({ sigla: 'SEC', nome: 'Secao', batalhaoId: 10 });
    component.dialogVisivel = true;
    component.salvar();
    expect(component.dialogVisivel).toBeTrue();
  });
});
