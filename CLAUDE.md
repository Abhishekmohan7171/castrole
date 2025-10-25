# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development

- `nx serve` - Start development server on http://localhost:4200
- `nx build` - Build the project (artifacts in dist/)
- `nx test` - Run unit tests via Karma
- `nx build --watch --configuration development` - Build in watch mode

### Scripts

- `process-locations` - Process location data using ts-node script
- `serve:ssr:castrole` - Serve SSR build from dist/

## Architecture Overview

Castrole is an Angular 17 application using Nx workspace, Firebase, and Tailwind CSS. It's a platform connecting actors and producers with role-based access and chat functionality.

### Tech Stack

- **Framework**: Angular 17 with SSR support
- **Build System**: Nx workspace for monorepo management
- **Styling**: Tailwind CSS with scrollbar plugin
- **Backend**: Firebase (Auth, Firestore, Storage)
- **Testing**: Karma + Jasmine

### Application Structure

**Core Features:**

- Two user roles: Actors and Producers
- Onboarding flow with role selection
- Firebase authentication with guards
- Chat system with role-based permissions
- Location-based features

**Key Directories:**

- `src/app/auth/` - Authentication components (login, signup, reset password)
- `src/app/onboarding/` - Role selection and onboarding flows
- `src/app/discover/` - Main app features (feed, chat, profile, upload, settings)
- `src/app/services/` - Firebase services and business logic
- `src/app/guards/` - Route guards for authentication
- `src/app/models/` - TypeScript interfaces
- `src/assets/interfaces/` - Shared interface definitions

### Firebase Configuration

Firebase is configured in `app.config.ts` with:

- Authentication
- Firestore database
- Storage
- Project: yberhood-castrole

### Routing Architecture

- **Auth Loading**: Default route handles auth initialization
- **Auth Routes**: Login/reset-password (logged-out users only)
- **Onboarding**: Role selection and user type setup
- **Discover**: Protected main app area with nested routes
- **Lazy Loading**: Most components use lazy loading for performance

### User Roles & Permissions

- **Actors**: Can receive chat invitations, upload content
- **Producers**: Can initiate chats, discover actors
- **Chat System**: Role-based permissions (producers initiate, actors respond)

### Data Models

Key interfaces defined in `src/assets/interfaces/interfaces.ts`:

- UserDoc: Complete user profile with role, device info, settings
- Chat system: ChatRooms and Messages with role-based access
- Device tracking and blocking functionality

### Location Features

- Location processing script in `scripts/`
- JSON data files for countries and locations
- Processed location data for app consumption

### Development Notes

- Uses Firebase configuration directly in code (development setup)
- Tailwind configured for Angular templates (`./src/**/*.{html,ts}`)
- SSR enabled for better performance
- Route guards prevent unauthorized access
- Component-level code splitting for optimal loading
- Use Signals and Computed for state management, effects for non-business side logic and logging
- Don't use ngIf, ngFor, ngSwitch, but instead use @if, @for, @switch
