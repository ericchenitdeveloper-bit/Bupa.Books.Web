import { TestBed } from '@angular/core/testing';
import { Router, UrlTree, provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideStore } from '@ngxs/store';
import { authGuard } from './auth.guard';
import { AuthState } from '../state/auth/auth.state';

function setup(token?: string) {
  if (token) localStorage.setItem('jwt_token', token);

  TestBed.configureTestingModule({
    providers: [
      provideStore([AuthState]),
      provideHttpClient(),
      provideHttpClientTesting(),
      provideRouter([]),
    ],
  });
}

describe('authGuard', () => {
  afterEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
  });

  it('returns true when user has a valid token', () => {
    setup('valid-token');

    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as any, {} as any)
    );

    expect(result).toBe(true);
  });

  it('returns UrlTree to /login when not authenticated', () => {
    setup();

    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as any, {} as any)
    );

    expect(result).toBeInstanceOf(UrlTree);
    expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe('/login');
  });
});
