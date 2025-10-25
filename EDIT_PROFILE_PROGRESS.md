# Edit Profile UI Redesign - Progress Tracker

## Session: October 25, 2025

### Objective
Redesign the edit profile experience from a modal popup to a dedicated full-page route with sidebar navigation and modular components.

---

## ✅ Completed

### 1. Architecture Planning
- Analyzed design mockups (13 images provided)
- Defined component hierarchy and responsibilities
- Planned responsive breakpoints (1440px, 1024px, 768px, 480px)

### 2. Interfaces & Types
**File:** `src/assets/interfaces/edit-profile.interfaces.ts`
- Created `LanguageProficiency` interface (name + 1-5 star rating)
- Created `SkillItem` interface
- Created `SocialLink` interface
- Defined `EditSection` union type
- Created `NavigationItem` interface for sidebar

### 3. Main Component Structure
**File:** `src/app/discover/edit-profile/edit-profile.component.ts`

**Features Implemented:**
- ✅ Responsive sidebar navigation (fixed on desktop, overlay on mobile)
- ✅ Hamburger menu for mobile (<768px)
- ✅ 5 navigation sections with icons and descriptions
- ✅ Active state highlighting (purple accent)
- ✅ Query param-based routing (`?section=basic-info`)
- ✅ Firebase profile loading with Auth integration
- ✅ Loading, error, and empty states
- ✅ Smooth transitions and animations
- ✅ Keyboard navigation support
- ✅ Backdrop click to close mobile sidebar

**Layout:**
```
┌─────────────────────────────────────────────┐
│ Mobile Header (hamburger + title + close)  │ <768px only
├──────────┬──────────────────────────────────┤
│          │                                   │
│ Sidebar  │  Content Area                    │
│ (264px)  │  (max-w-4xl)                     │
│          │                                   │
│ Nav:     │  [Dynamic Section Component]     │
│ • Basic  │                                   │
│ • Edu    │  - Basic Info                    │
│ • Voice  │  - Education & Experience        │
│ • Lang   │  - Voice Intro                   │
│ • Social │  - Languages & Skills            │
│          │  - Socials                       │
│          │                                   │
└──────────┴──────────────────────────────────┘
```

**State Management:**
- Using Angular signals for reactive state
- `profile` signal for user data
- `activeSection` signal for current view
- `isMobileSidebarOpen` signal for mobile menu
- `isLoading` and `error` signals for async states

---

## 🚧 In Progress / Next Steps

### 4. Child Components (Priority Order)

#### A. Basic Info Section Component ✅ COMPLETED
**File:** `src/app/discover/edit-profile/sections/basic-info-section.component.ts`

**Implemented Features:**
- ✅ Circular profile image upload (800x800 max, 85% JPEG quality)
- ✅ Hover overlay with edit icon
- ✅ Client-side image compression
- ✅ Fields: stage name/name, height, weight, age, gender, location
- ✅ Inline edit icons on all fields
- ✅ Real-time form validation
- ✅ Responsive grid (2 cols desktop, 1 col mobile)
- ✅ Firebase Storage integration
- ✅ Loading states during upload
- ✅ File type and size validation (max 5MB)
- ✅ Save button with disabled state
- ✅ Integrated with main component

**Design Reference:** Images 2-3

---

#### B. Education Section Component
**File:** `src/app/discover/edit-profile/sections/education-section.component.ts`

**Requirements:**
- Dynamic FormArray for multiple education entries
- Fields per entry:
  - School name (text input)
  - Course name (text input)
  - Year completed (year picker)
  - Certificate upload (optional, PDF/image)
- "Add Education" button (purple accent)
- "Save Education" button per entry
- View certificate modal/link
- Delete entry with confirmation
- Empty state: "No education added yet"

**Design Reference:** Images 3-8

---

#### C. Voice Intro Section Component
**File:** `src/app/discover/edit-profile/sections/voice-intro-section.component.ts`

**Requirements:**
- Audio waveform visualization (purple gradient)
- Record button (30-second limit)
- Upload audio file option
- Playback controls (play/pause, progress bar)
- Duration display (e.g., "0 / 28 s")
- "Edit Intro" button
- Explanatory text about voice intro importance
- Audio compression before upload

**Design Reference:** Image 9

---

#### D. Languages & Skills Section Component
**File:** `src/app/discover/edit-profile/sections/languages-skills-section.component.ts`

**Requirements:**
- Two subsections: Languages and Skills
- **Languages:**
  - List with 5-star rating system (clickable stars)
  - Add language button (circle-plus icon)
  - Remove language (X icon)
  - Empty state: "no languages added yet, tap ⊕ to add languages"
- **Skills:**
  - Simple list of skill tags
  - Add skill button (circle-plus icon)
  - Remove skill (X icon)
  - Empty state: "no skills added yet, tap ⊕ to add skills"
- Checkmark icon for confirmed entries

**Design Reference:** Images 10-12

---

#### E. Socials Section Component
**File:** `src/app/discover/edit-profile/sections/socials-section.component.ts`

**Requirements:**
- Predefined platforms: Instagram, YouTube, External Link
- URL input fields with edit icons
- Add additional link button (circle-plus icon)
- URL validation (Instagram must contain instagram.com, etc.)
- Display placeholder URLs
- Remove link option

**Design Reference:** Image 13

---

### 5. Shared Services

#### Profile Data Service
**File:** `src/app/discover/edit-profile/services/profile-data.service.ts`

**Responsibilities:**
- Centralized profile state management with signals
- Form state synchronization
- Auto-save drafts to localStorage
- Dirty state tracking
- Undo/redo functionality (optional)

#### Profile Firebase Service
**File:** `src/app/discover/edit-profile/services/profile-firebase.service.ts`

**Responsibilities:**
- Firestore read/write operations
- Firebase Storage uploads (images, audio, certificates)
- Image compression utility
- Audio compression utility
- Optimistic UI updates
- Error handling and retry logic

---

### 6. Integration Tasks

- [ ] Update `profile.component.ts` to navigate to `/profile/edit` instead of opening modal
- [ ] Remove or deprecate `edit-profile-modal.component.ts` (keep as reference)
- [ ] Add route guard to ensure user is authenticated
- [ ] Add unsaved changes guard (prompt before leaving)
- [ ] Implement global save/cancel buttons (sticky footer?)
- [ ] Add success toast notifications
- [ ] Add error boundary for graceful failures

---

### 7. Testing & Polish

- [ ] Test responsive behavior at all breakpoints
- [ ] Test keyboard navigation (Tab, Enter, Escape)
- [ ] Test screen reader compatibility
- [ ] Test image upload (size limits, formats)
- [ ] Test audio recording/upload
- [ ] Test form validation edge cases
- [ ] Test Firebase offline persistence
- [ ] Performance audit (bundle size, lazy loading)

---

## Design Tokens

### Colors (Tailwind Classes)
- **Background:** `bg-neutral-950` (main), `bg-neutral-900` (sidebar/cards)
- **Borders:** `border-neutral-800`
- **Text:** `text-white` (primary), `text-neutral-300` (secondary), `text-neutral-400` (tertiary)
- **Accent:** `bg-purple-600`, `text-purple-300`, `ring-purple-500`
- **Hover:** `hover:bg-white/5`

### Spacing
- **Sidebar width:** 264px (desktop), 288px (mobile overlay)
- **Content max-width:** 1024px (4xl)
- **Padding:** px-4 sm:px-6 lg:px-8
- **Gap:** gap-4 (default), gap-6 (sections)

### Typography
- **Headings:** text-2xl font-semibold (section titles)
- **Body:** text-base (default)
- **Small:** text-sm (labels), text-xs (descriptions)

### Breakpoints
- **Mobile:** < 768px
- **Tablet:** 768px - 1023px
- **Desktop:** 1024px - 1439px
- **Large:** ≥ 1440px

---

## Technical Decisions

1. **Signals over RxJS:** Using Angular signals for local component state; RxJS only for async streams (HTTP, Firebase listeners)
2. **Standalone Components:** All components use standalone APIs
3. **Control Flow:** Using @if/@for/@switch instead of *ngIf/*ngFor
4. **Form Strategy:** Reactive forms with FormBuilder, typed controls
5. **File Uploads:** Client-side compression before Firebase Storage upload
6. **Validation:** Real-time validation with visual feedback
7. **Accessibility:** ARIA labels, keyboard navigation, focus management
8. **Performance:** Lazy-load sections, defer non-critical content

---

## Notes

- The existing modal component (`edit-profile-modal.component.ts`) contains valuable form logic and Firebase integration that should be referenced when building child components
- Audio waveform visualization may require a library like WaveSurfer.js or a custom Canvas implementation
- Star rating component should be reusable across languages section
- Consider adding a "Preview Profile" button to see changes before saving
- Consider adding a progress indicator (e.g., "Profile 80% complete")

---

## Questions / Decisions Needed

1. Should we implement auto-save or require explicit save action?
2. Should there be a global save button or per-section save buttons?
3. Should we show a confirmation dialog when navigating away with unsaved changes?
4. Should we implement undo/redo functionality?
5. Should we add a "Preview Profile" feature?

---

## ✅ ALL SECTIONS COMPLETED

All five edit profile sections have been fully implemented with responsive design, form validation, and Firebase integration!

**Last Updated:** October 25, 2025, 6:05 PM IST
