import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ApprovalsListComponent } from './approvals-list.component';
import { ApprovalsService } from '../../../core/services/approvals.service';
import { TransfersService } from '../../../core/services/transfers.service';
import { NotificationsService } from '../../../core/services/notifications.service';
import { AuthService } from '../../../core/services/auth.service';
import { MessageService, ConfirmationService } from 'primeng/api';

class MockApprovalsService {
  listarPendentes = jasmine.createSpy('listarPendentes').and.returnValue(of([]));
  processarDecisao = jasmine.createSpy('processarDecisao').and.returnValue(of({}));
}

class MockTransfersService {
  listarPendentes = jasmine.createSpy('listarPendentes').and.returnValue(of([]));
}

class MockNotificationsService {
  atualizarContagem = jasmine.createSpy('atualizarContagem');
}

class MockAuthService {
  getUsuario = jasmine.createSpy('getUsuario').and.returnValue({ perfil: 'ADMIN_DTEC', secaoId: 1 });
}

describe('ApprovalsListComponent', () => {
  let component: ApprovalsListComponent;
  let fixture: ComponentFixture<ApprovalsListComponent>;
  let approvalsService: MockApprovalsService;
  let notificationsService: MockNotificationsService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApprovalsListComponent],
      providers: [
        { provide: ApprovalsService, useClass: MockApprovalsService },
        { provide: TransfersService, useClass: MockTransfersService },
        { provide: NotificationsService, useClass: MockNotificationsService },
        { provide: AuthService, useClass: MockAuthService },
        MessageService,
        ConfirmationService,
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ApprovalsListComponent);
    component = fixture.componentInstance;
    approvalsService = TestBed.inject(ApprovalsService) as unknown as MockApprovalsService;
    notificationsService = TestBed.inject(NotificationsService) as unknown as MockNotificationsService;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should load pending approvals on init', () => {
    expect(approvalsService.listarPendentes).toHaveBeenCalled();
    expect(component.pendencias).toEqual([]);
  });

  it('should approve a pending item and refresh', () => {
    approvalsService.processarDecisao.and.returnValue(of({}));
    spyOn(window, 'confirm').and.returnValue(true);

    component.aprovar(123);

    expect(approvalsService.processarDecisao).toHaveBeenCalledWith(123, true, '');
    expect(notificationsService.atualizarContagem).toHaveBeenCalled();
  });

  it('should translate known fields', () => {
    expect(component.traduzirCampo('patrimonio')).toBe('Patrimônio');
    expect(component.traduzirValor('DELETE')).toBe('Excluir Equipamento');
  });
});
