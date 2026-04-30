import { Component, inject } from '@angular/core';
import { Store } from '@ngxs/store';
import { FormsModule } from '@angular/forms';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatChipsModule } from '@angular/material/chips';
import { BooksState } from '../../state/books/books.state';
import { FetchBooks } from '../../state/books/books.actions';
import { Logout } from '../../state/auth/auth.actions';

@Component({
  selector: 'app-books-list',
  standalone: true,
  imports: [
    FormsModule,
    MatToolbarModule,
    MatButtonModule,
    MatTableModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatTooltipModule,
    MatSlideToggleModule,
    MatChipsModule,
  ],
  templateUrl: './books-list.component.html',
  styleUrl: './books-list.component.scss',
})
export class BooksListComponent {
  private store = inject(Store);

  categories = this.store.selectSignal(BooksState.categories);
  loading    = this.store.selectSignal(BooksState.loading);
  error      = this.store.selectSignal(BooksState.error);

  readonly displayedColumns = ['name', 'type'];
  hardcoverOnly = false;

  loadBooks(): void {
    this.store.dispatch(new FetchBooks(this.hardcoverOnly));
  }

  logout(): void {
    this.store.dispatch(new Logout());
  }

  getTypeClass(type: string): string {
    return type.toLowerCase().replace(/\s+/g, '-');
  }
}
