import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { provideStore, Store } from '@ngxs/store';
import { AuthState } from '../auth/auth.state';
import { BooksState, BookCategory } from './books.state';
import { FetchBooks } from './books.actions';
import { Login } from '../auth/auth.actions';

const BOOKS_URL = 'http://localhost:5000/api/v1/Books';
const TOKEN_URL = 'http://localhost:5000/api/v1/Auth/token';

const MOCK_CATEGORIES: BookCategory[] = [
  {
    ageCategory: 'Adults',
    books: [
      { name: 'Great Expectations', type: 'Hardcover' },
      { name: 'Jane Eyre', type: 'Paperback' },
    ],
  },
  {
    ageCategory: 'Children',
    books: [{ name: 'The Hobbit', type: 'Ebook' }],
  },
];

describe('BooksState', () => {
  let store: Store;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        provideStore([AuthState, BooksState]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Router, useValue: { navigate: vi.fn().mockResolvedValue(true) } },
      ],
    });

    store = TestBed.inject(Store);
    httpMock = TestBed.inject(HttpTestingController);

    // Authenticate so the state has a token to pass to /Books
    store.dispatch(new Login({ username: 'demo', password: 'demo123' }));
    httpMock.expectOne(TOKEN_URL)
      .flush({ accessToken: 'test-token', tokenType: 'Bearer', expiresIn: 3600 });
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  describe('defaults', () => {
    it('has empty categories', () => {
      expect(store.selectSnapshot(BooksState.categories)).toEqual([]);
    });

    it('loading is false', () => {
      expect(store.selectSnapshot(BooksState.loading)).toBe(false);
    });

    it('error is null', () => {
      expect(store.selectSnapshot(BooksState.error)).toBeNull();
    });
  });

  describe('FetchBooks action', () => {
    it('sends GET with Authorization header', () => {
      store.dispatch(new FetchBooks(false));

      const req = httpMock.expectOne((r) => r.url === BOOKS_URL);
      expect(req.request.method).toBe('GET');
      expect(req.request.headers.get('Authorization')).toBe('Bearer test-token');
      req.flush(MOCK_CATEGORIES);
    });

    it('includes hardcoverOnly=false by default', () => {
      store.dispatch(new FetchBooks(false));
      httpMock.expectOne(`${BOOKS_URL}?hardcoverOnly=false`).flush([]);
    });

    it('includes hardcoverOnly=true when requested', () => {
      store.dispatch(new FetchBooks(true));
      httpMock.expectOne(`${BOOKS_URL}?hardcoverOnly=true`).flush([]);
    });

    it('stores categories on success', () => {
      store.dispatch(new FetchBooks(false));
      httpMock.expectOne((r) => r.url === BOOKS_URL).flush(MOCK_CATEGORIES);

      expect(store.selectSnapshot(BooksState.categories)).toEqual(MOCK_CATEGORIES);
      expect(store.selectSnapshot(BooksState.loading)).toBe(false);
      expect(store.selectSnapshot(BooksState.error)).toBeNull();
    });

    it('sets error on failure', () => {
      store.dispatch(new FetchBooks(false));
      httpMock.expectOne((r) => r.url === BOOKS_URL)
        .flush('Server Error', { status: 500, statusText: 'Internal Server Error' });

      expect(store.selectSnapshot(BooksState.categories)).toEqual([]);
      expect(store.selectSnapshot(BooksState.error)).toBe('Failed to fetch books. Please try again.');
    });

    it('clears previous error on new fetch', () => {
      // First fetch fails
      store.dispatch(new FetchBooks(false));
      httpMock.expectOne((r) => r.url === BOOKS_URL)
        .flush('Error', { status: 500, statusText: 'Error' });
      expect(store.selectSnapshot(BooksState.error)).not.toBeNull();

      // Second fetch succeeds
      store.dispatch(new FetchBooks(false));
      httpMock.expectOne((r) => r.url === BOOKS_URL).flush(MOCK_CATEGORIES);

      expect(store.selectSnapshot(BooksState.error)).toBeNull();
    });
  });
});
