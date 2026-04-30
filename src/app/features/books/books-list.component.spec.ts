import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideStore, Store } from '@ngxs/store';
import { EMPTY } from 'rxjs';
import { BooksListComponent } from './books-list.component';
import { AuthState } from '../../state/auth/auth.state';
import { BooksState, BookCategory } from '../../state/books/books.state';
import { FetchBooks } from '../../state/books/books.actions';
import { Logout } from '../../state/auth/auth.actions';

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

describe('BooksListComponent', () => {
  let fixture: ComponentFixture<BooksListComponent>;
  let component: BooksListComponent;
  let store: Store;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    // Seed token before store init — ngxsOnInit picks it up without dispatching Login
    // (which would trigger router.navigate(['/books']) and cause unhandled rejections)
    localStorage.setItem('jwt_token', 'test-token');

    await TestBed.configureTestingModule({
      imports: [BooksListComponent],
      providers: [
        provideStore([AuthState, BooksState]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideNoopAnimations(),
      ],
    }).compileComponents();

    store = TestBed.inject(Store);
    httpMock = TestBed.inject(HttpTestingController);

    fixture = TestBed.createComponent(BooksListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('creates the component', () => {
    expect(component).toBeTruthy();
  });

  it('shows toolbar with Bupa Books title', () => {
    const toolbar: HTMLElement = fixture.nativeElement.querySelector('mat-toolbar');
    expect(toolbar?.textContent).toContain('Bupa Books');
  });

  it('shows no category cards before Load Books is clicked', () => {
    const cards = fixture.nativeElement.querySelectorAll('mat-card.category-card');
    expect(cards.length).toBe(0);
  });

  describe('Load Books button', () => {
    it('dispatches FetchBooks with hardcoverOnly=false by default', () => {
      vi.spyOn(store, 'dispatch').mockReturnValue(EMPTY as any);
      component.loadBooks();
      const [[action]] = (store.dispatch as ReturnType<typeof vi.spyOn>).mock.calls;
      expect(action).toBeInstanceOf(FetchBooks);
      expect((action as FetchBooks).hardcoverOnly).toBe(false);
    });

    it('dispatches FetchBooks with hardcoverOnly=true when toggle is on', () => {
      vi.spyOn(store, 'dispatch').mockReturnValue(EMPTY as any);
      component.hardcoverOnly = true;
      component.loadBooks();
      const [[action]] = (store.dispatch as ReturnType<typeof vi.spyOn>).mock.calls;
      expect((action as FetchBooks).hardcoverOnly).toBe(true);
    });
  });

  describe('Logout button', () => {
    it('dispatches Logout action', () => {
      vi.spyOn(store, 'dispatch').mockReturnValue(EMPTY as any);
      component.logout();
      expect(store.dispatch).toHaveBeenCalledWith(expect.any(Logout));
    });
  });

  describe('after books are loaded', () => {
    beforeEach(() => {
      store.dispatch(new FetchBooks(false));
      httpMock.expectOne((r) => r.url.includes('/Books')).flush(MOCK_CATEGORIES);
      fixture.detectChanges();
    });

    it('renders one card per age category', () => {
      const cards = fixture.nativeElement.querySelectorAll('mat-card.category-card');
      expect(cards.length).toBe(2);
    });

    it('displays Adults and Children category titles', () => {
      const titles = Array.from<HTMLElement>(
        fixture.nativeElement.querySelectorAll('mat-card-title')
      ).map((el) => el.textContent?.trim() ?? '');
      expect(titles.some((t) => t.includes('Adults'))).toBe(true);
      expect(titles.some((t) => t.includes('Children'))).toBe(true);
    });

    it('displays correct book count in subtitle', () => {
      const subtitles = Array.from<HTMLElement>(
        fixture.nativeElement.querySelectorAll('mat-card-subtitle')
      ).map((el) => el.textContent?.trim() ?? '');
      expect(subtitles).toContain('2 book(s)');
      expect(subtitles).toContain('1 book(s)');
    });
  });

  describe('error state', () => {
    it('shows error banner on fetch failure', () => {
      store.dispatch(new FetchBooks(false));
      httpMock.expectOne((r) => r.url.includes('/Books'))
        .flush('Error', { status: 500, statusText: 'Server Error' });
      fixture.detectChanges();

      const banner: HTMLElement = fixture.nativeElement.querySelector('.error-banner');
      expect(banner?.textContent).toContain('Failed to fetch books');
    });
  });

  describe('getTypeClass', () => {
    it('lowercases the type', () => {
      expect(component.getTypeClass('Hardcover')).toBe('hardcover');
      expect(component.getTypeClass('Paperback')).toBe('paperback');
      expect(component.getTypeClass('Ebook')).toBe('ebook');
    });

    it('replaces spaces with hyphens', () => {
      expect(component.getTypeClass('Large Print')).toBe('large-print');
    });
  });
});
