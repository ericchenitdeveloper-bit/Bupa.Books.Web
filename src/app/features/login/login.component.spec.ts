import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideStore, Store } from '@ngxs/store';
import { EMPTY } from 'rxjs';
import { LoginComponent } from './login.component';
import { AuthState } from '../../state/auth/auth.state';
import { Login } from '../../state/auth/auth.actions';

describe('LoginComponent', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let component: LoginComponent;
  let store: Store;

  beforeEach(async () => {
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideStore([AuthState]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideNoopAnimations(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    store = TestBed.inject(Store);
    fixture.detectChanges();
  });

  afterEach(() => localStorage.clear());

  it('creates the component', () => {
    expect(component).toBeTruthy();
  });

  it('Sign In button is disabled when form is empty', () => {
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button[type="submit"]');
    expect(button.disabled).toBe(true);
  });

  it('Sign In button is enabled with valid credentials', () => {
    component.loginForm.setValue({ username: 'demo', password: 'demo123' });
    fixture.detectChanges();
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button[type="submit"]');
    expect(button.disabled).toBe(false);
  });

  it('Sign In button is disabled with short password', () => {
    component.loginForm.setValue({ username: 'demo', password: 'x' });
    fixture.detectChanges();
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button[type="submit"]');
    expect(button.disabled).toBe(true);
  });

  it('dispatches Login action with form values on submit', () => {
    vi.spyOn(store, 'dispatch').mockReturnValue(EMPTY as any);
    component.loginForm.setValue({ username: 'demo', password: 'demo123' });
    component.onSubmit();
    expect(store.dispatch).toHaveBeenCalledWith(expect.any(Login));
    const [[action]] = (store.dispatch as ReturnType<typeof vi.spyOn>).mock.calls;
    expect((action as Login).payload).toEqual({ username: 'demo', password: 'demo123' });
  });

  it('does not dispatch when form is invalid', () => {
    vi.spyOn(store, 'dispatch').mockReturnValue(EMPTY as any);
    component.onSubmit();
    expect(store.dispatch).not.toHaveBeenCalled();
  });

  it('shows error banner when login fails', () => {
    const httpMock = TestBed.inject(HttpTestingController);
    store.dispatch(new Login({ username: 'bad', password: 'wrong' }));
    httpMock.expectOne((r) => r.url.includes('/Auth/token'))
      .flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

    fixture.detectChanges();
    const banner: HTMLElement = fixture.nativeElement.querySelector('.error-banner');
    expect(banner?.textContent).toContain('Invalid credentials');
    httpMock.verify();
  });

  it('hides error banner when there is no error', () => {
    fixture.detectChanges();
    const banner = fixture.nativeElement.querySelector('.error-banner');
    expect(banner).toBeNull();
  });

  it('toggles password visibility', () => {
    // Initial state: hidden — icon should be visibility_off
    fixture.detectChanges();
    const iconEl: HTMLElement = fixture.nativeElement.querySelector('mat-icon[data-testid="pw-toggle"], button mat-icon');
    expect(component.hidePassword).toBe(true);

    // Simulate click on the toggle button
    const toggleBtn: HTMLButtonElement = fixture.nativeElement.querySelector('button[matSuffix], button[matsuffix]');
    toggleBtn?.click();

    expect(component.hidePassword).toBe(false);
  });
});
