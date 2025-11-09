# Profile URL Implementation Guide

## Overview
The profile routing now uses a **slug-uid format** for human-readable and SEO-friendly URLs.

**Format**: `/discover/:slug-:uid`  
**Example**: `/discover/rajkumar-rao-xK9mP2nQ7R`

---

## How It Works

### URL Structure
- **Slug**: Human-readable name (e.g., `rajkumar-rao`)
- **UID**: Last 12 characters of Firebase UID (e.g., `xK9mP2nQ7R`)
- **Separator**: Single dash (`-`)

### Benefits
✅ Human-readable URLs  
✅ SEO-friendly  
✅ No schema changes required  
✅ Fast direct lookups (no queries)  
✅ Handles name changes gracefully  
✅ Guaranteed unique  

---

## Usage Examples

### 1. Generating Profile URLs

```typescript
import { ProfileUrlService } from '../services/profile-url.service';

export class MyComponent {
  private profileUrlService = inject(ProfileUrlService);

  navigateToProfile(userName: string, uid: string) {
    // Generate profile URL
    const profileUrl = this.profileUrlService.generateProfileUrl(userName, uid);
    // Result: "/discover/rajkumar-rao-xK9mP2nQ7R"
    
    this.router.navigate([profileUrl]);
  }
}
```

### 2. In Search Results

```typescript
// search.component.ts
export class SearchComponent {
  private profileUrlService = inject(ProfileUrlService);
  private router = inject(Router);

  searchResults = signal<SearchResult[]>([]);

  // Navigate to profile (from within /discover route)
  viewProfile(result: SearchResult): void {
    const slugUid = this.profileUrlService.generateSlugUid(result.name, result.uid);
    this.router.navigate(['/discover', slugUid]);
  }
  
  // OR for routerLink in template
  getProfileLink(result: SearchResult): string[] {
    const slugUid = this.profileUrlService.generateSlugUid(result.name, result.uid);
    return ['/discover', slugUid];
  }
}
```

```html
<!-- search.component.html -->
@for (result of searchResults(); track result.uid) {
  <a [routerLink]="getProfileLink(result)" class="profile-card">
    <img [src]="result.profileImage" [alt]="result.name">
    <h3>{{ result.name }}</h3>
  </a>
}
```

### 3. In Chat Component

```typescript
// chat.component.ts
export class ChatComponent {
  private profileUrlService = inject(ProfileUrlService);
  private router = inject(Router);

  viewProfile(participant: ChatParticipant) {
    const slugUid = this.profileUrlService.generateSlugUid(
      participant.name,
      participant.uid
    );
    this.router.navigate(['/discover', slugUid]);
  }
}
```

### 4. Sharing Profile URLs

```typescript
// profile.component.ts
export class ProfileComponent {
  private profileUrlService = inject(ProfileUrlService);

  async shareProfile() {
    const profile = this.profileData();
    const name = profile.actorProfile?.stageName || profile.producerProfile?.name;
    const profileUrl = this.profileUrlService.generateProfileUrl(name, profile.uid);
    const fullUrl = `${window.location.origin}${profileUrl}`;
    
    // Copy to clipboard
    await navigator.clipboard.writeText(fullUrl);
    
    // Or use Web Share API
    if (navigator.share) {
      await navigator.share({
        title: `${name}'s Profile`,
        url: fullUrl
      });
    }
  }
}
```

### 5. In Feed Component (Actor Cards)

```typescript
// feed.component.ts
export class FeedComponent {
  private profileUrlService = inject(ProfileUrlService);

  actors = signal<Actor[]>([]);

  getActorProfileLink(actor: Actor): string[] {
    const slugUid = this.profileUrlService.generateSlugUid(
      actor.stageName,
      actor.uid
    );
    return ['/discover', slugUid];
  }
}
```

```html
<!-- feed.component.html -->
@for (actor of actors(); track actor.uid) {
  <div class="actor-card">
    <a [routerLink]="getActorProfileLink(actor)">
      <img [src]="actor.profileImage" [alt]="actor.stageName">
      <h3>{{ actor.stageName }}</h3>
    </a>
  </div>
}
```

### 6. Extracting UID from URL (Guards/Resolvers)

```typescript
// profile.guard.ts
export const profileVisibilityGuard: CanActivateFn = (route) => {
  const profileUrlService = inject(ProfileUrlService);
  const slugUid = route.paramMap.get('slugUid');
  
  if (!slugUid) {
    return true; // Own profile
  }
  
  // Extract UID from slug-uid
  const uid = profileUrlService.extractUid(slugUid);
  
  if (!uid) {
    // Invalid format, redirect
    inject(Router).navigate(['/discover']);
    return false;
  }
  
  // Check visibility permissions using UID
  // ... your logic here
  
  return true;
};
```

---

## ProfileUrlService API

### Methods

#### `generateProfileUrl(name: string, uid: string): string`
Generate a full profile URL path. **Use this for sharing/external URLs**.
```typescript
generateProfileUrl("Rajkumar Rao", "abc123xyz789")
// Returns: "/discover/rajkumar-rao-xyz789"

// Use case: Sharing URLs, copying to clipboard
const shareUrl = `${window.location.origin}${profileUrlService.generateProfileUrl(name, uid)}`;
```

#### `generateSlugUid(name: string, uid: string): string`
Generate just the slug-uid parameter (without `/discover/`). **Use this for navigation**.
```typescript
generateSlugUid("Rajkumar Rao", "abc123xyz789")
// Returns: "rajkumar-rao-xyz789"

// Use case: Router navigation
const slugUid = profileUrlService.generateSlugUid(name, uid);
this.router.navigate(['/discover', slugUid]);
```

#### `extractUid(slugUid: string): string | null`
Extract UID from a slug-uid parameter.
```typescript
extractUid("rajkumar-rao-xyz789")
// Returns: "xyz789"
```

#### `extractSlug(slugUid: string): string`
Extract slug from a slug-uid parameter.
```typescript
extractSlug("rajkumar-rao-xyz789")
// Returns: "rajkumar-rao"
```

#### `isValidSlugUid(slugUid: string): boolean`
Validate if a slug-uid parameter is in correct format.
```typescript
isValidSlugUid("rajkumar-rao-xyz789")
// Returns: true

isValidSlugUid("invalid")
// Returns: false
```

#### `getCanonicalUrl(currentName: string, uid: string): string`
Get canonical URL with current name (for redirects).
```typescript
getCanonicalUrl("Raj Kumar", "xyz789")
// Returns: "/discover/raj-kumar-xyz789"
```

---

## Migration Notes

### Before (Username-based)
```typescript
// Old route
path: ':username'

// Old navigation
this.router.navigate(['/discover', username]);

// Old URL
/discover/rajkumar_rao
```

### After (Slug-UID)
```typescript
// New route
path: ':slugUid'

// New navigation
const profileUrl = this.profileUrlService.generateProfileUrl(name, uid);
this.router.navigate([profileUrl]);

// New URL
/discover/rajkumar-rao-xK9mP2nQ7R
```

---

## Special Characters Handling

The slug generation automatically handles special characters:

```typescript
"A.R. Rahman" → "ar-rahman"
"Priyanka Chopra Jonas" → "priyanka-chopra-jonas"
"Rajkumar Rao" → "rajkumar-rao"
"John O'Connor" → "john-oconnor"
"José García" → "jos-garca"
```

---

## Name Change Handling

When a user changes their name:

1. **Old URLs still work** (UID remains the same)
   - `/discover/old-name-xyz789` ✅ Works
   
2. **Automatic redirect to canonical URL** (optional)
   - User visits: `/discover/old-name-xyz789`
   - Redirects to: `/discover/new-name-xyz789`
   
3. **New URLs are generated automatically**
   - Share button generates: `/discover/new-name-xyz789`

---

## Testing

### Test Cases

```typescript
// Test 1: Valid slug-uid
const url = profileUrlService.generateProfileUrl("John Doe", "abc123xyz789");
expect(url).toBe("/discover/john-doe-xyz789");

// Test 2: Extract UID
const uid = profileUrlService.extractUid("john-doe-xyz789");
expect(uid).toBe("xyz789");

// Test 3: Special characters
const url2 = profileUrlService.generateProfileUrl("A.R. Rahman", "abc123xyz789");
expect(url2).toBe("/discover/ar-rahman-xyz789");

// Test 4: Invalid format
const uid2 = profileUrlService.extractUid("invalid");
expect(uid2).toBeNull();
```

---

## Performance

- ✅ **Direct lookups**: No Firestore queries needed
- ✅ **Single read**: One document read per profile view
- ✅ **No indexes**: No additional Firestore indexes required
- ✅ **Fast routing**: Angular router handles slug-uid as single parameter

---

## SEO Benefits

```html
<!-- Before -->
<a href="/discover/xK9mP2nQ7R">View Profile</a>

<!-- After -->
<a href="/discover/rajkumar-rao-xK9mP2nQ7R">View Profile</a>
```

Search engines can now:
- Read the name from the URL
- Index profiles with meaningful URLs
- Display better search results

---

## Questions?

If you need to:
- Generate profile links in a new component → Use `ProfileUrlService.generateProfileUrl()`
- Extract UID from URL → Use `ProfileUrlService.extractUid()`
- Validate URL format → Use `ProfileUrlService.isValidSlugUid()`
- Share profile → Use `getShareableProfileUrl()` in ProfileComponent
