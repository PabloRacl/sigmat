import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';

import { DashboardComponent } from './dashboard.component';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationsService } from '../../../core/services/notifications.service';

class MockAuthService {
  usuario$ = of({ id: 1, perfil: 'ADMIN_DTEC', secaoId: 1, nome: 'Teste User' });
  getUsuario() {
    return { id: 1, perfil: 'ADMIN_DTEC', secaoId: 1, nome: 'Teste User' };
  }
  logout() {}
}

class MockNotificationsService {
  pendentes$ = of(0);
  atualizarContagem = jasmine.createSpy('atualizarContagem');
}

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardComponent, RouterTestingModule],
      providers: [
        { provide: AuthService, useClass: MockAuthService },
        { provide: NotificationsService, useClass: MockNotificationsService }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

