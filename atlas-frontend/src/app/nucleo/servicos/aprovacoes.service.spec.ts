import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ApprovalsService } from './aprovacoes.service';

describe('ApprovalsService', () => {
  let service: ApprovalsService;
  let httpMock: HttpTestingController;
  const apiUrl = 'http://localhost:3000/aprovacoes';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ApprovalsService]
    });

    service = TestBed.inject(ApprovalsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('listarPendentes should call /pendentes', () => {
    const mockPendencias = [{ id: 1 }, { id: 2 }];

    service.listarPendentes().subscribe((res) => {
      expect(res).toEqual(mockPendencias);
    });

    const req = httpMock.expectOne(`${service['apiUrl']}/pendentes`);
    expect(req.request.method).toBe('GET');
    req.flush(mockPendencias);
  });

  it('obterContagem should call /pendentes/contagem', () => {
    const mockContagem = { total: 5 };

    service.obterContagem().subscribe((res) => {
      expect(res).toEqual(mockContagem);
    });

    const req = httpMock.expectOne(`${service['apiUrl']}/pendentes/contagem`);
    expect(req.request.method).toBe('GET');
    req.flush(mockContagem);
  });

  it('processarDecisao should post decision payload', () => {
    const mockResposta = { id: 1, aprovado: true };

    service.processarDecisao(1, true, 'OK').subscribe((res) => {
      expect(res).toEqual(mockResposta);
    });

    const req = httpMock.expectOne(`${service['apiUrl']}/1/decisao`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ aprovado: true, justificativa: 'OK' });
    req.flush(mockResposta);
  });
});
