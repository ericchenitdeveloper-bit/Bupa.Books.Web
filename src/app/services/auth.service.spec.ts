import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('POSTs credentials to /Auth/token', () => {
    const payload = { username: 'demo', password: 'demo123' };
    service.login(payload).subscribe();

    const req = httpMock.expectOne('http://localhost:5000/api/v1/Auth/token');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush({ accessToken: 'abc', tokenType: 'Bearer', expiresIn: 3600 });
  });

  it('returns the auth response', () => {
    const mockResponse = { accessToken: 'jwt-123', tokenType: 'Bearer', expiresIn: 3600 };
    let result: any;

    service.login({ username: 'demo', password: 'demo123' }).subscribe((r) => (result = r));
    httpMock.expectOne('http://localhost:5000/api/v1/Auth/token').flush(mockResponse);

    expect(result).toEqual(mockResponse);
  });
});
