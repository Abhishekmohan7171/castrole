import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideClientHydration } from '@angular/platform-browser';

import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { provideStorage, getStorage } from '@angular/fire/storage';

export const appConfig: ApplicationConfig = {
  providers: [provideRouter(routes), provideClientHydration(),
    provideFirebaseApp(() => initializeApp({
      apiKey: "AIzaSyDBkKWzCv-8DRbizBG3YBkmaUncRIAPsL0",
      authDomain: "yberhood-castrole.firebaseapp.com",
      projectId: "yberhood-castrole",
      storageBucket: "yberhood-castrole.firebasestorage.app",
      messagingSenderId: "1033810945165",
      appId: "1:1033810945165:web:ae5d8707a74a637ce02ec4",
      measurementId: "G-84BB4QMRES"
    })),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),
    provideStorage(() => getStorage()),
  ]
};
