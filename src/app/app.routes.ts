import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { SignupComponent } from './auth/signup/signup.component';

export const routes: Routes = [
  // Default -> onboarding
  { path: '', pathMatch: 'full', redirectTo: 'onboarding' },

  // Auth
  { path: 'login', component: LoginComponent },
  { path: 'register', component: SignupComponent },

  // Onboarding flow
  {
    path: 'onboarding',
    children: [
      { path: '', loadComponent: () => import('./onboarding/role.component').then(m => m.RoleComponent) },
      { path: 'actor', loadComponent: () => import('./onboarding/actor-onboard.component').then(m => m.ActorOnboardComponent) },
      // { path: 'actor/otp', loadComponent: () => import('./onboarding/otp-actor.component').then(m => m.OtpActorComponent) },
      { path: 'producer', loadComponent: () => import('./onboarding/producer-onboard.component').then(m => m.ProducerOnboardComponent ) },
      // { path: 'producer/otp', loadComponent: () => import('./onboarding/otp-producer.component').then(m => m.OtpProducerComponent) },
    ]
  },

  // Fallback
  { path: '**', redirectTo: 'onboarding' }
];
