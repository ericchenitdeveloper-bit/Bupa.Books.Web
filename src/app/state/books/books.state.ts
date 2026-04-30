import { Injectable } from '@angular/core';
import { State, Action, Selector, StateContext, Store } from '@ngxs/store';
import { tap, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { BooksService } from '../../services/books.service';
import { AuthState } from '../auth/auth.state';
import { FetchBooks } from './books.actions';

export interface BookItem {
  name: string;
  type: string;
}

export interface BookCategory {
  ageCategory: string;
  books: BookItem[];
}

export interface BooksStateModel {
  categories: BookCategory[];
  hardcoverOnly: boolean;
  loading: boolean;
  error: string | null;
}

@State<BooksStateModel>({
  name: 'books',
  defaults: {
    categories: [],
    hardcoverOnly: false,
    loading: false,
    error: null,
  },
})
@Injectable()
export class BooksState {
  constructor(
    private booksService: BooksService,
    private store: Store
  ) {}

  @Selector()
  static categories(state: BooksStateModel): BookCategory[] {
    return state.categories;
  }

  @Selector()
  static hardcoverOnly(state: BooksStateModel): boolean {
    return state.hardcoverOnly;
  }

  @Selector()
  static loading(state: BooksStateModel): boolean {
    return state.loading;
  }

  @Selector()
  static error(state: BooksStateModel): string | null {
    return state.error;
  }

  @Action(FetchBooks)
  fetchBooks(ctx: StateContext<BooksStateModel>, action: FetchBooks) {
    const token = this.store.selectSnapshot(AuthState.token);
    ctx.patchState({ loading: true, error: null, hardcoverOnly: action.hardcoverOnly });
    return this.booksService.getBooks(token!, action.hardcoverOnly).pipe(
      tap((categories) => ctx.patchState({ categories, loading: false })),
      catchError((err) => {
        ctx.patchState({ loading: false, error: 'Failed to fetch books. Please try again.' });
        return throwError(() => err);
      })
    );
  }
}
