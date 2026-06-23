import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, Subject } from 'rxjs';
import { ApprovalsListComponent } from './lista-aprovacoes.component';
import { ApprovalsService } from '../../../nucleo/servicos/aprovacoes.service';
import { TransfersService } from '../../../nucleo/servicos/transferencias.service';
import { NotificationsService } from '../../../nucleo/servicos/notificacoes.service';
import { AuthService } from '../../../nucleo/servicos/autenticacao.service';
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

class MockMessageService {
  add = jasmine.createSpy('add');
}

class MockConfirmationService {
  requireConfirmation$ = new Subject<any>();
  private acceptCb: (() => void) | null = null;

  confirm(options: any) {
    this.acceptCb = options.accept || null;
    this.requireConfirmation$.next(options);
  }

  accept() {
    if (this.acceptCb) {
      this.acceptCb();
      this.acceptCb = null;
    }
  }
}

describe('ApprovalsListComponent', () => {
  let component: ApprovalsListComponent;
  let fixture: ComponentFixture<ApprovalsListComponent>;
  let approvalsService: MockApprovalsService;
  let notificationsService: MockNotificationsService;
  let confirmationService: MockConfirmationService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApprovalsListComponent],
      providers: [
        { provide: ApprovalsService, useClass: MockApprovalsService },
        { provide: TransfersService, useClass: MockTransfersService },
        { provide: NotificationsService, useClass: MockNotificationsService },
        { provide: AuthService, useClass: MockAuthService },
      ]
    })
    .overrideComponent(ApprovalsListComponent, {
      set: { providers: [
        MessageService,
        { provide: ConfirmationService, useClass: MockConfirmationService }
      ]}
    })
    .compileComponents();

    fixture = TestBed.createComponent(ApprovalsListComponent);
    component = fixture.componentInstance;
    approvalsService = TestBed.inject(ApprovalsService) as unknown as MockApprovalsService;
    notificationsService = TestBed.inject(NotificationsService) as unknown as MockNotificationsService;
    confirmationService = fixture.componentRef.injector.get(ConfirmationService) as unknown as MockConfirmationService;
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
    component.aprovar(123);
    confirmationService.accept();

    expect(approvalsService.processarDecisao).toHaveBeenCalledWith(123, true, '');
    expect(notificationsService.atualizarContagem).toHaveBeenCalled();
  });

  it('should translate known fields', () => {
    expect(component.traduzirCampo('patrimonio')).toBe('Patrimônio');
    expect(component.traduzirValor('DELETE')).toBe('Excluir Equipamento');
  });
});
