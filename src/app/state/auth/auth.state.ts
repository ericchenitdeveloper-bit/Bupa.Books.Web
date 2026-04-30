import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { State, Action, Selector, StateContext, NgxsOnInit } from '@ngxs/store';
import { tap, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { Login, Logout } from './auth.actions';

export interface AuthStateModel {
  token: string | null;
  loading: boolean;
  error: string | null;
}

@State<AuthStateModel>({
  name: 'auth',
  defaults: {
    token: null,
    loading: false,
    error: null,
  },
})
@Injectable()
export class AuthState implements NgxsOnInit {
  constructor(
    private authService: AuthService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: object
  ) {}

  ngxsOnInit(ctx: StateContext<AuthStateModel>): void {
    if (isPlatformBrowser(this.platformId)) {
      const token = localStorage.getItem('jwt_token');
      if (token) {
        ctx.patchState({ token });
      }
    }
  }

  @Selector()
  static token(state: AuthStateModel): string | null {
    return state.token;
  }

  @Selector()
  static isAuthenticated(state: AuthStateModel): boolean {
    return !!state.token;
  }

  @Selector()
  static loading(state: AuthStateModel): boolean {
    return state.loading;
  }

  @Selector()
  static error(state: AuthStateModel): string | null {
    return state.error;
  }

  @Action(Login)
  login(ctx: StateContext<AuthStateModel>, action: Login) {
    ctx.patchState({ loading: true, error: null });
    return this.authService.login(action.payload).pipe(
      tap((response) => {
        if (isPlatformBrowser(this.platformId)) {
          localStorage.setItem('jwt_token', response.accessToken);
        }
        ctx.patchState({ token: response.accessToken, loading: false });
        this.router.navigate(['/books']);
      }),
      catchError((err) => {
        ctx.patchState({ loading: false, error: 'Invalid credentials. Please try again.' });
        return throwError(() => err);
      })
    );
  }

  @Action(Logout)
  logout(ctx: StateContext<AuthStateModel>) {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('jwt_token');
    }
    ctx.setState({ token: null, loading: false, error: null });
    this.router.navigate(['/login']);
  }
}
