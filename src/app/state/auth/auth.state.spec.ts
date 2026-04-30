import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { provideStore, Store } from '@ngxs/store';
import { AuthState } from './auth.state';
import { Login, Logout } from './auth.actions';

const TOKEN_URL = 'http://localhost:5000/api/v1/Auth/token';
const MOCK_AUTH = { accessToken: 'jwt-abc', tokenType: 'Bearer', expiresIn: 3600 };

function setup(preloadToken?: string) {
  if (preloadToken) localStorage.setItem('jwt_token', preloadToken);

  const routerSpy = { navigate: vi.fn().mockResolvedValue(true) };

  TestBed.configureTestingModule({
    providers: [
      provideStore([AuthState]),
      provideHttpClient(),
      provideHttpClientTesting(),
      { provide: Router, useValue: routerSpy },
    ],
  });

  return {
    store: TestBed.inject(Store),
    httpMock: TestBed.inject(HttpTestingController),
    routerSpy,
  };
}

describe('AuthState', () => {
  afterEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
  });

  describe('defaults', () => {
    it('has null token', () => {
      const { store } = setup();
      expect(store.selectSnapshot(AuthState.token)).toBeNull();
    });

    it('isAuthenticated is false', () => {
      const { store } = setup();
      expect(store.selectSnapshot(AuthState.isAuthenticated)).toBe(false);
    });

    it('loading is false', () => {
      const { store } = setup();
      expect(store.selectSnapshot(AuthState.loading)).toBe(false);
    });
  });

  describe('ngxsOnInit', () => {
    it('restores token from localStorage', () => {
      const { store } = setup('stored-token');
      expect(store.selectSnapshot(AuthState.token)).toBe('stored-token');
      expect(store.selectSnapshot(AuthState.isAuthenticated)).toBe(true);
    });

    it('leaves state empty when localStorage has no token', () => {
      const { store } = setup();
      expect(store.selectSnapshot(AuthState.token)).toBeNull();
    });
  });

  describe('Login action', () => {
    it('sets token in state and localStorage on success', () => {
      const { store, httpMock } = setup();

      store.dispatch(new Login({ username: 'demo', password: 'demo123' }));
      httpMock.expectOne(TOKEN_URL).flush(MOCK_AUTH);

      expect(store.selectSnapshot(AuthState.token)).toBe('jwt-abc');
      expect(store.selectSnapshot(AuthState.isAuthenticated)).toBe(true);
      expect(localStorage.getItem('jwt_token')).toBe('jwt-abc');
      httpMock.verify();
    });

    it('navigates to /books on success', () => {
      const { store, httpMock, routerSpy } = setup();

      store.dispatch(new Login({ username: 'demo', password: 'demo123' }));
      httpMock.expectOne(TOKEN_URL).flush(MOCK_AUTH);

      expect(routerSpy.navigate).toHaveBeenCalledWith(['/books']);
      httpMock.verify();
    });

    it('POSTs the correct payload', () => {
      const { store, httpMock } = setup();

      store.dispatch(new Login({ username: 'demo', password: 'demo123' }));
      const req = httpMock.expectOne(TOKEN_URL);

      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ username: 'demo', password: 'demo123' });
      req.flush(MOCK_AUTH);
      httpMock.verify();
    });

    it('sets error message on 401', () => {
      const { store, httpMock } = setup();

      store.dispatch(new Login({ username: 'bad', password: 'wrong' }));
      httpMock.expectOne(TOKEN_URL).flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

      expect(store.selectSnapshot(AuthState.token)).toBeNull();
      expect(store.selectSnapshot(AuthState.error)).toBe('Invalid credentials. Please try again.');
      httpMock.verify();
    });

    it('loading is false after response', () => {
      const { store, httpMock } = setup();

      store.dispatch(new Login({ username: 'demo', password: 'demo123' }));
      httpMock.expectOne(TOKEN_URL).flush(MOCK_AUTH);

      expect(store.selectSnapshot(AuthState.loading)).toBe(false);
      httpMock.verify();
    });
  });

  describe('Logout action', () => {
    it('clears token from state and localStorage', () => {
      const { store, httpMock } = setup();

      store.dispatch(new Login({ username: 'demo', password: 'demo123' }));
      httpMock.expectOne(TOKEN_URL).flush(MOCK_AUTH);

      store.dispatch(new Logout());

      expect(store.selectSnapshot(AuthState.token)).toBeNull();
      expect(store.selectSnapshot(AuthState.isAuthenticated)).toBe(false);
      expect(localStorage.getItem('jwt_token')).toBeNull();
      httpMock.verify();
    });

    it('navigates to /login', () => {
      const { store, httpMock, routerSpy } = setup();

      store.dispatch(new Login({ username: 'demo', password: 'demo123' }));
      httpMock.expectOne(TOKEN_URL).flush(MOCK_AUTH);
      store.dispatch(new Logout());

      expect(routerSpy.navigate).toHaveBeenLastCalledWith(['/login']);
      httpMock.verify();
    });
  });
});
