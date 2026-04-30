import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BookCategory } from '../state/books/books.state';
import { API_BASE_PATH } from '../config/api.config';

@Injectable({ providedIn: 'root' })
export class BooksService {
  private readonly apiBase = API_BASE_PATH;

  constructor(private http: HttpClient) {}

  getBooks(token: string, hardcoverOnly = false): Observable<BookCategory[]> {
    return this.http.get<BookCategory[]>(`${this.apiBase}/Books`, {
      headers: new HttpHeaders({ Authorization: `Bearer ${token}` }),
      params: new HttpParams().set('hardcoverOnly', String(hardcoverOnly)),
    });
  }
}
