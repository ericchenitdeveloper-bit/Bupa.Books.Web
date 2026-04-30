import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { BooksService } from './books.service';
import { BookCategory } from '../state/books/books.state';

const MOCK_CATEGORIES: BookCategory[] = [
  { ageCategory: 'Adults', books: [{ name: 'Great Expectations', type: 'Hardcover' }] },
];

describe('BooksService', () => {
  let service: BooksService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(BooksService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('sends GET with Authorization header', () => {
    service.getBooks('my-token').subscribe();

    const req = httpMock.expectOne((r) => r.url.includes('/Books'));
    expect(req.request.method).toBe('GET');
    expect(req.request.headers.get('Authorization')).toBe('Bearer my-token');
    req.flush(MOCK_CATEGORIES);
  });

  it('includes hardcoverOnly=false by default', () => {
    service.getBooks('token').subscribe();
    httpMock.expectOne('http://localhost:5000/api/v1/Books?hardcoverOnly=false').flush([]);
  });

  it('includes hardcoverOnly=true when specified', () => {
    service.getBooks('token', true).subscribe();
    httpMock.expectOne('http://localhost:5000/api/v1/Books?hardcoverOnly=true').flush([]);
  });

  it('returns book categories', () => {
    let result: any;
    service.getBooks('token').subscribe((r) => (result = r));
    httpMock.expectOne((r) => r.url.includes('/Books')).flush(MOCK_CATEGORIES);
    expect(result).toEqual(MOCK_CATEGORIES);
  });
});
