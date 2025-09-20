import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ActorOnboardComponent } from './actor-onboard.component';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { LoaderComponent } from '../common-components/loader/loader.component';
import { By } from '@angular/platform-browser';
import { User } from '@angular/fire/auth';
import { Auth } from '@angular/fire/auth';
import { of } from 'rxjs';

describe('ActorOnboardComponent', () => {
  let component: ActorOnboardComponent;
  let fixture: ComponentFixture<ActorOnboardComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;
  let httpMock: HttpTestingController;
  let authMock: jasmine.SpyObj<Auth>;
  let mockUser: jasmine.SpyObj<User>;

  beforeEach(async () => {
    // Create spies
    authServiceSpy = jasmine.createSpyObj('AuthService', [
      'registerWithEmail',
      'saveUserProfile',
      'linkGoogle',
      'linkApple'
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
        ReactiveFormsModule,
        HttpClientTestingModule,
        ActorOnboardComponent,
        LoaderComponent
      ],
      providers: [
        FormBuilder,
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: Auth, useValue: authMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ActorOnboardComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize the form with required controls', () => {
    expect(component.form.get('stageName')).toBeTruthy();
    expect(component.form.get('location')).toBeTruthy();
    expect(component.form.get('email')).toBeTruthy();
    expect(component.form.get('mobile')).toBeTruthy();
    expect(component.form.get('password')).toBeTruthy();
    expect(component.form.get('confirmPassword')).toBeTruthy();
  });

  it('should mark form as invalid when empty', () => {
    expect(component.form.valid).toBeFalsy();
  });

  it('should mark form as valid when properly filled', () => {
    component.form.patchValue({
      stageName: 'Actor Name',
      location: 'Mumbai, Maharashtra',
      email: 'actor@example.com',
      mobile: '+919876543210',
      password: 'Password123',
      confirmPassword: 'Password123'
    });
    expect(component.form.valid).toBeTruthy();
  });

  it('should show validation error when passwords do not match', () => {
    component.form.patchValue({
      stageName: 'Actor Name',
      location: 'Mumbai, Maharashtra',
      email: 'actor@example.com',
      mobile: '+919876543210',
      password: 'Password123',
      confirmPassword: 'DifferentPassword'
    });
    
    expect(component.form.hasError('passwordMismatch')).toBeTruthy();
  });

  it('should fetch location suggestions when typing in location field', fakeAsync(() => {
    // Arrange
    const locationInput = 'Mumbai';
    const mockLocations = [
      { district: 'Mumbai', state: 'Maharashtra' },
      { district: 'Mumbai Suburban', state: 'Maharashtra' }
    ];
    
    // Act
    component.form.get('location')?.setValue(locationInput);
    tick(300); // Debounce time
    
    // Simulate HTTP response
    const req = httpMock.expectOne(request => request.url.includes('/assets/json/locations.json'));
    req.flush(mockLocations);
    tick();
    
    // Assert
    expect(component.locationSuggestions.length).toBe(2);
    expect(component.locationSuggestions[0].district).toBe('Mumbai');
  }));

  it('should select location from suggestions', () => {
    // Arrange
    const location = { district: 'Mumbai', state: 'Maharashtra' };
    component.locationSuggestions = [location];
    
    // Act
    component.onSelectLocationSuggestion(location);
    
    // Assert
    expect(component.form.get('location')?.value).toBe('Mumbai, Maharashtra');
    expect(component.locationSuggestions.length).toBe(0);
  });

  it('should register user when form is submitted', fakeAsync(() => {
    // Arrange
    component.form.patchValue({
      stageName: 'Actor Name',
      location: 'Mumbai, Maharashtra',
      email: 'actor@example.com',
      mobile: '+919876543210',
      password: 'Password123',
      confirmPassword: 'Password123'
    });
    authServiceSpy.registerWithEmail.and.resolveTo(mockUser);
    
    // Act
    component.onSubmit();
    tick();
    
    // Assert
    expect(authServiceSpy.registerWithEmail).toHaveBeenCalledWith({
      name: 'Actor Name',
      email: 'actor@example.com',
      password: 'Password123',
      phone: '+919876543210',
      location: 'Mumbai, Maharashtra',
      role: 'actor'
    });
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/dashboard']);
  }));

  it('should show error when registration fails', fakeAsync(() => {
    // Arrange
    component.form.patchValue({
      stageName: 'Actor Name',
      location: 'Mumbai, Maharashtra',
      email: 'actor@example.com',
      mobile: '+919876543210',
      password: 'Password123',
      confirmPassword: 'Password123'
    });
    const errorMessage = 'Email already in use';
    authServiceSpy.registerWithEmail.and.rejectWith(new Error(errorMessage));
    
    // Act
    component.onSubmit();
    tick();
    
    // Assert
    expect(component.error).toContain(errorMessage);
    expect(component.loading).toBeFalse();
  }));

  it('should show loader during registration', () => {
    // Arrange
    component.loading = true;
    fixture.detectChanges();
    
    // Act
    const loader = fixture.debugElement.query(By.directive(LoaderComponent));
    
    // Assert
    expect(loader).toBeTruthy();
    expect(loader.componentInstance.show).toBeTrue();
  });

  it('should link Google account when requested', fakeAsync(() => {
    // Arrange
    authServiceSpy.linkGoogle.and.resolveTo(mockUser);
    
    // Act
    component.linkWithGoogle();
    tick();
    
    // Assert
    expect(authServiceSpy.linkGoogle).toHaveBeenCalled();
    expect(component.error).toBe('');
  }));

  it('should handle errors when linking Google account', fakeAsync(() => {
    // Arrange
    const errorMessage = 'Account already linked';
    authServiceSpy.linkGoogle.and.rejectWith(new Error(errorMessage));
    
    // Act
    component.linkWithGoogle();
    tick();
    
    // Assert
    expect(component.error).toContain(errorMessage);
  }));

  it('should link Apple account when requested', fakeAsync(() => {
    // Arrange
    authServiceSpy.linkApple.and.resolveTo(mockUser);
    
    // Act
    component.linkWithApple();
    tick();
    
    // Assert
    expect(authServiceSpy.linkApple).toHaveBeenCalled();
    expect(component.error).toBe('');
  }));

  it('should handle errors when linking Apple account', fakeAsync(() => {
    // Arrange
    const errorMessage = 'Account already linked';
    authServiceSpy.linkApple.and.rejectWith(new Error(errorMessage));
    
    // Act
    component.linkWithApple();
    tick();
    
    // Assert
    expect(component.error).toContain(errorMessage);
  }));
});
