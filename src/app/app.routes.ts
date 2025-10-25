import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { DiscoverComponent } from './discover/discover.component';
import { authCanMatch, loggedOutOnlyGuard } from './guards/auth.guard';
import { AuthLoadingComponent } from './auth/auth-loading.component';
import { ResetPasswordComponent } from './auth/reset-password/reset-password.component';

export const routes: Routes = [
  // Default -> loading component while auth initializes
  { path: '', pathMatch: 'full', component: AuthLoadingComponent },

  // Auth
  { path: 'login', component: LoginComponent, canMatch: [loggedOutOnlyGuard] },
  { path: 'reset-password', component: ResetPasswordComponent, canMatch: [loggedOutOnlyGuard] },
  { path: 'register', redirectTo: 'onboarding' },

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

  {
    path: 'discover',
    component: DiscoverComponent,
    canMatch: [authCanMatch],
    children: [
      { path: '', loadComponent: () => import('./discover/feed.component').then(m => m.FeedComponent) },
      { path: 'upload', loadComponent: () => import('./discover/upload.component').then(m => m.UploadComponent) },
      { path: 'search', loadComponent: () => import('./discover/search.component').then(m => m.SearchComponent) },
      { path: 'chat', loadComponent: () => import('./discover/chat.component').then(m => m.ChatComponent) },
      { path: 'profile', loadComponent: () => import('./discover/profile.component').then(m => m.ProfileComponent) },
      { path: 'profile/edit', loadComponent: () => import('./discover/edit-profile/edit-profile.component').then(m => m.EditProfileComponent) },
      { path: 'settings', loadComponent: () => import('./discover/settings.component').then(m => m.SettingsComponent) },
    ]
  },

  // Fallback
  // { path: '**', redirectTo: 'discover' }
];
