import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { LoginComponent } from './login.component';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Auth } from '@angular/fire/auth';
import { AuthService } from '../../services/auth.service';
import { LoaderComponent } from '../../common-components/loader/loader.component';
import { By } from '@angular/platform-browser';
import { User } from '@angular/fire/auth';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;
  let authMock: jasmine.SpyObj<Auth>;
  let mockUser: jasmine.SpyObj<User>;

  beforeEach(async () => {
    // Create spies
    authServiceSpy = jasmine.createSpyObj('AuthService', [
      'signInWithEmail', 
      'signInWithGoogle', 
      'signInWithApple'
    ]);
    
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    
    mockUser = jasmine.createSpyObj('User', [], {
      uid: 'test-uid',
      displayName: 'Test User',
      email: 'test@example.com'
    });
    
    authMock = jasmine.createSpyObj('Auth', [], {
      currentUser: mockUser
    });

    await TestBed.configureTestingModule({
      imports: [
        CommonModule,
        ReactiveFormsModule,
        RouterLink,
        LoginComponent,
        LoaderComponent
      ],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: Auth, useValue: authMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize the form with email and password controls', () => {
    expect(component.form.get('email')).toBeTruthy();
    expect(component.form.get('password')).toBeTruthy();
  });

  it('should mark form as invalid when empty', () => {
    expect(component.form.valid).toBeFalsy();
  });

  it('should mark form as valid when properly filled', () => {
    component.form.patchValue({
      email: 'test@example.com',
      password: 'password123'
    });
    expect(component.form.valid).toBeTruthy();
  });

  it('should show validation errors for invalid email', () => {
    const emailControl = component.form.get('email');
    emailControl?.setValue('invalid-email');
    emailControl?.markAsTouched();
    fixture.detectChanges();
    
    expect(emailControl?.valid).toBeFalsy();
    expect(emailControl?.hasError('email')).toBeTruthy();
  });

  it('should disable submit button when form is invalid', () => {
    const submitButton = fixture.debugElement.query(By.css('button[type="submit"]'));
    expect(submitButton.nativeElement.disabled).toBeTruthy();
  });

  it('should enable submit button when form is valid', () => {
    component.form.patchValue({
      email: 'test@example.com',
      password: 'password123'
    });
    fixture.detectChanges();
    
    const submitButton = fixture.debugElement.query(By.css('button[type="submit"]'));
    expect(submitButton.nativeElement.disabled).toBeFalsy();
  });

  it('should call signInWithEmail when form is submitted', fakeAsync(() => {
    // Arrange
    const email = 'test@example.com';
    const password = 'password123';
    component.form.patchValue({ email, password });
    authServiceSpy.signInWithEmail.and.resolveTo(mockUser);
    
    // Act
    component.onSubmit();
    tick();
    
    // Assert
    expect(authServiceSpy.signInWithEmail).toHaveBeenCalledWith(email, password);
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/dashboard']);
  }));

  it('should set error message when login fails', fakeAsync(() => {
    // Arrange
    component.form.patchValue({
      email: 'test@example.com',
      password: 'wrongpassword'
    });
    const errorMessage = 'Invalid email or password';
    authServiceSpy.signInWithEmail.and.rejectWith(new Error(errorMessage));
    
    // Act
    component.onSubmit();
    tick();
    
    // Assert
    expect(component.error).toContain(errorMessage);
    expect(component.loading).toBeFalse();
  }));

  it('should show loader during authentication', () => {
    // Arrange
    component.loading = true;
    fixture.detectChanges();
    
    // Act
    const loader = fixture.debugElement.query(By.directive(LoaderComponent));
    
    // Assert
    expect(loader).toBeTruthy();
    expect(loader.componentInstance.show).toBeTrue();
  });

  it('should call signInWithGoogle when Google sign-in is clicked', fakeAsync(() => {
    // Arrange
    authServiceSpy.signInWithGoogle.and.resolveTo({ user: mockUser, exists: true });
    
    // Act
    component.signInWithGoogle();
    tick();
    
    // Assert
    expect(authServiceSpy.signInWithGoogle).toHaveBeenCalled();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/dashboard']);
  }));

  it('should redirect to onboarding when Google user doesn't exist', fakeAsync(() => {
    // Arrange
    authServiceSpy.signInWithGoogle.and.resolveTo({ user: mockUser, exists: false });
    
    // Act
    component.signInWithGoogle();
    tick();
    
    // Assert
    expect(authServiceSpy.signInWithGoogle).toHaveBeenCalled();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/onboarding']);
  }));

  it('should call signInWithApple when Apple sign-in is clicked', fakeAsync(() => {
    // Arrange
    authServiceSpy.signInWithApple.and.resolveTo({ user: mockUser, exists: true });
    
    // Act
    component.signInWithApple();
    tick();
    
    // Assert
    expect(authServiceSpy.signInWithApple).toHaveBeenCalled();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/dashboard']);
  }));

  it('should redirect to onboarding when Apple user doesn't exist', fakeAsync(() => {
    // Arrange
    authServiceSpy.signInWithApple.and.resolveTo({ user: mockUser, exists: false });
    
    // Act
    component.signInWithApple();
    tick();
    
    // Assert
    expect(authServiceSpy.signInWithApple).toHaveBeenCalled();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/onboarding']);
  }));
});
