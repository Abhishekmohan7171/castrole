import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { DiscoverComponent } from './discover/discover.component';
import { authCanMatch, loggedOutOnlyGuard } from './guards/auth.guard';

export const routes: Routes = [
  // Default -> onboarding
  { path: '', pathMatch: 'full', redirectTo: 'discover' },

  // Auth
  { path: 'login', component: LoginComponent, canMatch: [loggedOutOnlyGuard] },
  { path: 'register', redirectTo: 'onboarding' },

  // Onboarding flow
  {
    path: 'onboarding',
    children: [
      { path: '', loadComponent: () => import('./onboarding/role.component').then(m => m.RoleComponent) },
      { path: 'actor', loadComponent: () => import('./onboarding/actor-onboard.component').then(m => m.ActorOnboardComponent) },
      { path: 'actor/otp', loadComponent: () => import('./common-components/otp/otp.component').then(m => m.OtpComponent) },
      { path: 'producer', loadComponent: () => import('./onboarding/producer-onboard.component').then(m => m.ProducerOnboardComponent ) },
      // { path: 'producer/otp', loadComponent: () => import('./onboarding/otp-producer.component').then(m => m.OtpProducerComponent) },
    ]
  },

  {
    path: 'discover',
    component: DiscoverComponent,
    canMatch: [authCanMatch],
    children: [
      { path: '', loadComponent: () => import('./discover/feed.component').then(m => m.FeedComponent) },
      { path: 'upload', loadComponent: () => import('./discover/upload.component').then(m => m.UploadComponent) },
      { path: 'chat', loadComponent: () => import('./discover/chat.component').then(m => m.ChatComponent) },
      { path: 'profile', loadComponent: () => import('./discover/profile.component').then(m => m.ProfileComponent) },
      { path: 'settings', loadComponent: () => import('./discover/settings.component').then(m => m.SettingsComponent) },
    ]
  },

  // Fallback
  // { path: '**', redirectTo: 'discover' }
];
