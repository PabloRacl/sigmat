import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';

import { EquipmentListComponent } from './lista-equipamentos.component';
import { EquipmentService } from '../../../nucleo/servicos/equipamentos.service';
import { SettingsService } from '../../../nucleo/servicos/configuracoes.service';
import { DashboardService } from '../../../nucleo/servicos/painel.service';
import { AuthService } from '../../../nucleo/servicos/autenticacao.service';
import { TransfersService } from '../../../nucleo/servicos/transferencias.service';
import { MaintenanceService } from '../../../nucleo/servicos/manutencao.service';
import { ReportsService } from '../../../nucleo/servicos/relatorios.service';
import { UploadService } from '../../../nucleo/servicos/carregamento.service';
import { PdfService } from '../../../nucleo/servicos/pdf.service';

class MockSettingsService {
  listarTipos = jasmine.createSpy('listarTipos').and.returnValue(of([]));
  listarStatus = jasmine.createSpy('listarStatus').and.returnValue(of([]));
  listarDisponibilidades = jasmine.createSpy('listarDisponibilidades').and.returnValue(of([]));
  listarTiposAquisicao = jasmine.createSpy('listarTiposAquisicao').and.returnValue(of([]));
  listarSecoes = jasmine.createSpy('listarSecoes').and.returnValue(of([]));
  listarMarcas = jasmine.createSpy('listarMarcas').and.returnValue(of([]));
  listarModelos = jasmine.createSpy('listarModelos').and.returnValue(of([]));
  criarTipo = jasmine.createSpy('criarTipo').and.returnValue(of({ id: 1 }));
  criarMarca = jasmine.createSpy('criarMarca').and.returnValue(of({ id: 1 }));
  criarModelo = jasmine.createSpy('criarModelo').and.returnValue(of({ id: 1 }));
}

class MockDashboardService {
  obterEstatisticas = jasmine.createSpy('obterEstatisticas').and.returnValue(of({ resumo: { total: 0, ativos: 0, manutencao: 0, emprestados: 0 } }));
}

class MockAuthService {
  getUsuario = jasmine.createSpy('getUsuario').and.returnValue({ id: 1, perfil: 'ADMIN_DTEC', secaoId: 1, nome: 'Teste User' });
}

class MockEquipmentService {
  listarTodos = jasmine.createSpy('listarTodos').and.returnValue(of({ itens: [], total: 0 }));
}
class MockTransfersService {}
class MockMaintenanceService {}
class MockReportsService {}
class MockUploadService {}
class MockPdfService {}

describe('EquipmentListComponent', () => {
  let component: EquipmentListComponent;
  let fixture: ComponentFixture<EquipmentListComponent>;
  let equipmentService: MockEquipmentService;
  let authService: MockAuthService;
  let settingsService: MockSettingsService;
  let dashboardService: MockDashboardService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EquipmentListComponent, RouterTestingModule],
      providers: [
        { provide: EquipmentService, useClass: MockEquipmentService },
        { provide: SettingsService, useClass: MockSettingsService },
        { provide: DashboardService, useClass: MockDashboardService },
        { provide: AuthService, useClass: MockAuthService },
        { provide: TransfersService, useClass: MockTransfersService },
        { provide: MaintenanceService, useClass: MockMaintenanceService },
        { provide: ReportsService, useClass: MockReportsService },
        { provide: UploadService, useClass: MockUploadService },
        { provide: PdfService, useClass: MockPdfService }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EquipmentListComponent);
    component = fixture.componentInstance;
    equipmentService = TestBed.inject(EquipmentService) as unknown as MockEquipmentService;
    authService = TestBed.inject(AuthService) as unknown as MockAuthService;
    settingsService = TestBed.inject(SettingsService) as unknown as MockSettingsService;
    dashboardService = TestBed.inject(DashboardService) as unknown as MockDashboardService;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load configuration and dashboard data on init', () => {
    expect(settingsService.listarTipos).toHaveBeenCalled();
    expect(settingsService.listarStatus).toHaveBeenCalled();
    expect(settingsService.listarDisponibilidades).toHaveBeenCalled();
    expect(settingsService.listarTiposAquisicao).toHaveBeenCalled();
    expect(settingsService.listarSecoes).toHaveBeenCalled();
    expect(settingsService.listarMarcas).toHaveBeenCalled();
    expect(settingsService.listarModelos).toHaveBeenCalled();
    expect(dashboardService.obterEstatisticas).toHaveBeenCalled();
  });

  it('should mark admin users as admin', () => {
    expect(component.ehAdmin).toBe(true);
  });

  it('should load equipment when lazy loading', () => {
    component.loadEquipamentosLazy({ first: 0, rows: 20, sortField: null, sortOrder: null, filters: {} });
    expect(equipmentService.listarTodos).toHaveBeenCalledWith(1, 20, '', {});
  });
});

