import { Injectable } from '@angular/core';
import { environment } from '../../environment';

const STORAGE_KEY = 'atlas_mock_override';

type MockOverride = 'enabled' | 'disabled';

@Injectable({
  providedIn: 'root'
})
export class MockModeService {
  get useMock(): boolean {
    const override = localStorage.getItem(STORAGE_KEY) as MockOverride | null;
    if (override === 'enabled') {
      return true;
    }
    if (override === 'disabled') {
      return false;
    }
    return environment.mockAuth;
  }

  setUseMock(enabled: boolean) {
    localStorage.setItem(STORAGE_KEY, enabled ? 'enabled' : 'disabled');
  }

  clearOverride() {
    localStorage.removeItem(STORAGE_KEY);
  }

  isForcedReal(): boolean {
    return localStorage.getItem(STORAGE_KEY) === 'disabled';
  }

  isForcedMock(): boolean {
    return localStorage.getItem(STORAGE_KEY) === 'enabled';
  }

  forceRealMode() {
    this.setUseMock(false);
  }

  get storageKey(): string {
    return STORAGE_KEY;
  }

  get overrideValue(): string {
    const override = localStorage.getItem(STORAGE_KEY) as MockOverride | null;
    return override ?? 'nenhum';
  }

  get hasOverride(): boolean {
    return localStorage.getItem(STORAGE_KEY) !== null;
  }

  get mockHint(): string {
    if (this.useMock) {
      return 'Modo mock local ativo. Faça login com dados de teste ou alterne para o backend real.';
    }

    if (this.isForcedReal()) {
      return 'Modo real forçado. O backend real será usado mesmo em localhost.';
    }

    if (environment.mockAuth) {
      return 'Localhost padrão é mock. Use o checkbox acima para alternar para mock local.';
    }

    return 'Modo real ativo. Use o checkbox se precisar testar sem rede/VPN.';
  }
}
