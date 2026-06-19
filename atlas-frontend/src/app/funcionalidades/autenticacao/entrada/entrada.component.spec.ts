import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { LoginComponent } from './entrada.component';
import { AuthService } from '../../../nucleo/servicos/autenticacao.service';

class MockAuthService {
  login = jasmine.createSpy('login').and.returnValue({ subscribe: () => {} });
  buscarUnidades = jasmine.createSpy('buscarUnidades').and.returnValue({ subscribe: () => {} });
}

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginComponent, RouterTestingModule, HttpClientTestingModule],
      providers: [
        { provide: AuthService, useClass: MockAuthService }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

