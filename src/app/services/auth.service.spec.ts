import { TestBed } from '@angular/core/testing';
import { AuthService, UserRole } from './auth.service';
import { Auth, User, GoogleAuthProvider, OAuthProvider, UserCredential } from '@angular/fire/auth';
import { Firestore, DocumentReference, DocumentSnapshot } from '@angular/fire/firestore';

describe('AuthService', () => {
  let service: AuthService;
  let authMock: jasmine.SpyObj<Auth>;
  let firestoreMock: jasmine.SpyObj<Firestore>;
  let mockUser: jasmine.SpyObj<User>;
  let mockDocRef: jasmine.SpyObj<DocumentReference>;
  let mockDocSnap: jasmine.SpyObj<DocumentSnapshot>;

  beforeEach(() => {
    // Create mock objects
    mockUser = jasmine.createSpyObj('User', [], {
      uid: 'test-uid',
      displayName: 'Test User',
      email: 'test@example.com',
      phoneNumber: '+1234567890',
      emailVerified: true
    });

    mockDocRef = jasmine.createSpyObj('DocumentReference', ['set']);
    mockDocSnap = jasmine.createSpyObj('DocumentSnapshot', [], {
      exists: jasmine.createSpy('exists').and.returnValue(true),
      data: jasmine.createSpy('data').and.returnValue({ role: 'actor' })
    });

    authMock = jasmine.createSpyObj('Auth', [], {
      currentUser: mockUser
    });

    firestoreMock = jasmine.createSpyObj('Firestore', ['doc', 'getDoc', 'setDoc', 'updateDoc']);
    firestoreMock.doc.and.returnValue(mockDocRef);

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: Auth, useValue: authMock },
        { provide: Firestore, useValue: firestoreMock }
      ]
    });

    service = TestBed.inject(AuthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('saveUserProfile', () => {
    it('should save user profile data to Firestore', async () => {
      // Arrange
      const uid = 'test-uid';
      const profileData = { name: 'Test User', role: 'actor' as UserRole };
      firestoreMock.doc.and.returnValue(mockDocRef);
      mockDocRef.set = jasmine.createSpy('set').and.resolveTo();
      
      // Act
      await service.saveUserProfile(uid, profileData);
      
      // Assert
      expect(firestoreMock.doc).toHaveBeenCalledWith(firestoreMock, 'users', uid);
      expect(mockDocRef.set).toHaveBeenCalled();
    });
  });

  describe('Google Authentication', () => {
    let mockCredential: jasmine.SpyObj<UserCredential>;
    
    beforeEach(() => {
      mockCredential = jasmine.createSpyObj('UserCredential', [], {
        user: mockUser
      });
      
      // Mock signInWithPopup
      (authMock as any).signInWithPopup = jasmine.createSpy('signInWithPopup').and.resolveTo(mockCredential);
      
      // Mock getDoc
      (firestoreMock as any).getDoc = jasmine.createSpy('getDoc').and.resolveTo(mockDocSnap);
      
      // Mock linkWithPopup
      (mockUser as any).linkWithPopup = jasmine.createSpy('linkWithPopup').and.resolveTo(mockCredential);
    });
    
    it('should sign in with Google', async () => {
      // Act
      const result = await service.signInWithGoogle();
      
      // Assert
      expect(authMock.signInWithPopup).toHaveBeenCalled();
      expect(firestoreMock.doc).toHaveBeenCalledWith(firestoreMock, 'users', 'test-uid');
      expect(firestoreMock.getDoc).toHaveBeenCalledWith(mockDocRef);
      expect(result.user).toBe(mockUser);
      expect(result.exists).toBeTrue();
    });
    
    it('should link Google to current user', async () => {
      // Act
      const result = await service.linkGoogle();
      
      // Assert
      expect(mockUser.linkWithPopup).toHaveBeenCalled();
      expect(result).toBe(mockUser);
    });
    
    it('should throw error when linking Google without authenticated user', async () => {
      // Arrange
      (authMock as any).currentUser = null;
      
      // Act & Assert
      await expectAsync(service.linkGoogle()).toBeRejectedWithError('No authenticated user to link Google for');
    });
  });

  describe('Apple Authentication', () => {
    let mockCredential: jasmine.SpyObj<UserCredential>;
    
    beforeEach(() => {
      mockCredential = jasmine.createSpyObj('UserCredential', [], {
        user: mockUser
      });
      
      // Mock signInWithPopup
      (authMock as any).signInWithPopup = jasmine.createSpy('signInWithPopup').and.resolveTo(mockCredential);
      
      // Mock getDoc
      (firestoreMock as any).getDoc = jasmine.createSpy('getDoc').and.resolveTo(mockDocSnap);
      
      // Mock linkWithPopup
      (mockUser as any).linkWithPopup = jasmine.createSpy('linkWithPopup').and.resolveTo(mockCredential);
    });
    
    it('should sign in with Apple', async () => {
      // Act
      const result = await service.signInWithApple();
      
      // Assert
      expect(authMock.signInWithPopup).toHaveBeenCalled();
      expect(firestoreMock.doc).toHaveBeenCalledWith(firestoreMock, 'users', 'test-uid');
      expect(firestoreMock.getDoc).toHaveBeenCalledWith(mockDocRef);
      expect(result.user).toBe(mockUser);
      expect(result.exists).toBeTrue();
    });
    
    it('should link Apple to current user', async () => {
      // Act
      const result = await service.linkApple();
      
      // Assert
      expect(mockUser.linkWithPopup).toHaveBeenCalled();
      expect(result).toBe(mockUser);
    });
    
    it('should throw error when linking Apple without authenticated user', async () => {
      // Arrange
      (authMock as any).currentUser = null;
      
      // Act & Assert
      await expectAsync(service.linkApple()).toBeRejectedWithError('No authenticated user to link Apple for');
    });
  });

  describe('Email/Password Authentication', () => {
    let mockCredential: jasmine.SpyObj<UserCredential>;
    
    beforeEach(() => {
      mockCredential = jasmine.createSpyObj('UserCredential', [], {
        user: mockUser
      });
      
      // Mock createUserWithEmailAndPassword
      (authMock as any).createUserWithEmailAndPassword = jasmine.createSpy('createUserWithEmailAndPassword').and.resolveTo(mockCredential);
      
      // Mock signInWithEmailAndPassword
      (authMock as any).signInWithEmailAndPassword = jasmine.createSpy('signInWithEmailAndPassword').and.resolveTo(mockCredential);
      
      // Mock updateProfile
      (mockUser as any).updateProfile = jasmine.createSpy('updateProfile').and.resolveTo();
      
      // Mock setDoc
      (firestoreMock as any).setDoc = jasmine.createSpy('setDoc').and.resolveTo();
    });
    
    it('should register with email and password', async () => {
      // Arrange
      const params = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        phone: '+1234567890',
        location: 'Test Location',
        role: 'actor'
      };
      
      // Act
      const result = await service.registerWithEmail(params);
      
      // Assert
      expect(authMock.createUserWithEmailAndPassword).toHaveBeenCalledWith(authMock, params.email, params.password);
      expect(mockUser.updateProfile).toHaveBeenCalled();
      expect(firestoreMock.setDoc).toHaveBeenCalled();
      expect(result).toBe(mockUser);
    });
    
    it('should sign in with email and password', async () => {
      // Arrange
      const email = 'test@example.com';
      const password = 'password123';
      
      // Act
      const result = await service.signInWithEmail(email, password);
      
      // Assert
      expect(authMock.signInWithEmailAndPassword).toHaveBeenCalledWith(authMock, email, password);
      expect(result).toBe(mockUser);
    });
  });

  describe('signOut', () => {
    it('should sign out the user', async () => {
      // Arrange
      (authMock as any).signOut = jasmine.createSpy('signOut').and.resolveTo();
      
      // Act
      await service.signOut();
      
      // Assert
      expect(authMock.signOut).toHaveBeenCalledWith(authMock);
    });
  });
});
