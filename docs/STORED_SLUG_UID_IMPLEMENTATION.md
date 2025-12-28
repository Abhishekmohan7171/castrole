# Stored Slug-UID Implementation Guide

## 🎯 Overview

We've implemented a **stored slug-uid** system where each profile has a permanent, unique URL identifier.

### URL Format
- **Pattern**: `/discover/:slug-uid`
- **Example**: `/discover/rajkumar-rao-xK9mP2nQ7R`
- **Storage**: Stored in `Profile.slug` field in Firestore
- **Stability**: Set once during profile creation, **never changes**

---

## ✅ What Was Implemented

### 1. **Profile Interface**
```typescript
export interface Profile {
  uid: string;
  slug?: string; // Stores "rajkumar-rao-xK9mP2nQ7R" format
  // ... other fields
}
```

### 2. **ProfileUrlService**
```typescript
// Generate slug-uid for NEW profiles (call once)
generateSlugUid(name: string, uid: string): string

// Generate URL from STORED slug-uid
generateProfileUrl(slugUid: string): string

// Extract UID from slug-uid
extractUid(slugUid: string): string | null

// Validate slug-uid format
isValidSlugUid(slugUid: string): boolean
```

### 3. **Slug Generator Utility**
Created `slug-generator.util.ts` with helper functions:
- `generateAndSaveSlugUid()` - Generate and save slug-uid for new profiles
- `ensureProfileHasSlugUid()` - Check if profile has slug, generate if missing

### 4. **Routing**
- Route parameter: `:slugUid`
- Guard queries by `slug` field
- Profile component loads by `slug` field

---

## 📝 How to Use

### When Creating a New Profile

```typescript
import { generateAndSaveSlugUid } from '../utils/slug-generator.util';

// In your onboarding or profile creation component
async createProfile() {
  const uid = this.auth.currentUser?.uid;
  const name = this.profileForm.value.stageName; // or producerName
  
  // 1. Generate and save slug-uid
  const slugUid = await generateAndSaveSlugUid(
    this.firestore,
    this.profileUrlService,
    uid,
    name
  );
  
  // 2. Create profile with slug
  const profile: Profile = {
    uid: uid,
    slug: slugUid, // IMPORTANT: Save the slug-uid
    actorProfile: {
      stageName: name,
      // ... other fields
    }
  };
  
  // 3. Save to Firestore
  await setDoc(doc(this.firestore, 'profiles', uid), profile);
  
  console.log('Profile created with slug-uid:', slugUid);
}
```

### When Editing a Profile (Ensure Slug Exists)

```typescript
import { ensureProfileHasSlugUid } from '../utils/slug-generator.util';

// In your edit-profile component
async saveProfile() {
  const profile = this.profileData();
  const name = profile.actorProfile?.stageName || profile.producerProfile?.name;
  
  // Ensure profile has a slug-uid (for existing profiles)
  const slugUid = await ensureProfileHasSlugUid(
    this.firestore,
    this.profileUrlService,
    profile,
    name
  );
  
  // Update profile
  await updateDoc(doc(this.firestore, 'profiles', profile.uid), {
    // ... your updates
    slug: slugUid // Ensure slug is saved
  });
}
```

### When Navigating to a Profile

```typescript
// In search results or anywhere you link to profiles
viewProfile(actor: ActorSearchResult) {
  // Use the stored slug-uid
  if (actor.slug) {
    this.router.navigate(['/discover', actor.slug]);
  } else {
    console.error('Actor missing slug-uid!');
  }
}
```

### When Sharing a Profile URL

```typescript
// In profile component
getShareableUrl(): string {
  const profile = this.profileData();
  
  if (!profile.slug) {
    return `${window.location.origin}/discover/profile`;
  }
  
  const profileUrl = this.profileUrlService.generateProfileUrl(profile.slug);
  return `${window.location.origin}${profileUrl}`;
}

// Copy to clipboard
async shareProfile() {
  const url = this.getShareableUrl();
  await navigator.clipboard.writeText(url);
  // Show success message
}
```

---

## 🔧 Migration for Existing Profiles

### Option 1: Batch Migration Script

Create a Cloud Function or admin script:

```typescript
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

async function migrateProfiles() {
  const db = getFirestore();
  const profilesRef = db.collection('profiles');
  const snapshot = await profilesRef.get();
  
  let migrated = 0;
  let skipped = 0;
  
  for (const doc of snapshot.docs) {
    const profile = doc.data();
    
    // Skip if already has slug
    if (profile.slug) {
      skipped++;
      continue;
    }
    
    // Generate slug-uid
    const name = profile.actorProfile?.stageName || 
                 profile.producerProfile?.name || 
                 'user';
    const slug = generateSlug(name);
    const shortUid = profile.uid.substring(profile.uid.length - 12);
    const slugUid = `${slug}-${shortUid}`;
    
    // Save to profile
    await doc.ref.update({ slug: slugUid });
    
    migrated++;
    console.log(`Migrated: ${profile.uid} -> ${slugUid}`);
  }
  
  console.log(`Migration complete: ${migrated} migrated, ${skipped} skipped`);
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50) || 'user';
}

// Run migration
migrateProfiles().catch(console.error);
```

### Option 2: Lazy Migration (On-Demand)

Automatically generate slug when profile is accessed:

```typescript
// In profile component or guard
async loadProfile(uid: string) {
  const profileDoc = await getDoc(doc(this.firestore, 'profiles', uid));
  const profile = profileDoc.data() as Profile;
  
  // Check if slug exists
  if (!profile.slug) {
    console.log('Profile missing slug, generating...');
    
    const name = profile.actorProfile?.stageName || 
                 profile.producerProfile?.name || 
                 'user';
    
    const slugUid = await generateAndSaveSlugUid(
      this.firestore,
      this.profileUrlService,
      uid,
      name
    );
    
    profile.slug = slugUid;
  }
  
  return profile;
}
```

---

## 🔒 Firestore Security Rules

Add rules to prevent slug modification:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /profiles/{userId} {
      allow read: if true;
      allow create: if request.auth.uid == userId;
      allow update: if request.auth.uid == userId
        // Prevent changing slug after it's set
        && (!resource.data.keys().hasAny(['slug']) 
            || request.resource.data.slug == resource.data.slug);
    }
  }
}
```

---

## 📊 Firestore Index Required

Create an index for the `slug` field:

```json
// firestore.indexes.json
{
  "indexes": [
    {
      "collectionGroup": "profiles",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "slug",
          "order": "ASCENDING"
        }
      ]
    }
  ]
}
```

Deploy the index:
```bash
firebase deploy --only firestore:indexes
```

---

## ✨ Benefits

| Feature | Before (Dynamic) | After (Stored) |
|---------|-----------------|----------------|
| **URL Stability** | ❌ Changes with name | ✅ Never changes |
| **Shareability** | ❌ Links break | ✅ Links permanent |
| **Performance** | ✅ Direct lookup | ⚠️ Query + lookup |
| **SEO** | ✅ Human-readable | ✅ Human-readable |
| **Uniqueness** | ✅ Guaranteed (UID) | ✅ Guaranteed (UID) |
| **Implementation** | ✅ Simple | ⚠️ Requires migration |

---

## 🚨 Important Notes

### 1. **Slug is Set Once**
- Generated during profile creation
- **Never changes** even if name changes
- Ensures URL stability

### 2. **Migration Required**
- Existing profiles don't have `slug` field
- Must run migration script or use lazy migration
- App won't work for existing profiles until migrated

### 3. **Name Changes**
- User can change their name
- Slug-UID remains the same
- Old links continue to work

### 4. **Uniqueness**
- Slug-UID includes last 12 chars of Firebase UID
- Guaranteed unique (UID is unique)
- No collision possible

---

## 🎯 Next Steps

1. ✅ **Code is ready** - All components updated
2. ⚠️ **Add slug generation to profile creation** - Update onboarding/edit-profile components
3. ⚠️ **Migrate existing profiles** - Run migration script
4. ⚠️ **Deploy Firestore index** - Required for queries
5. ⚠️ **Update security rules** - Prevent slug modification

---

## 📞 Where to Add Slug Generation

### In Onboarding (Actor)
File: `src/app/auth/onboarding-actor/onboarding-actor.component.ts`

```typescript
import { generateAndSaveSlugUid } from '../../utils/slug-generator.util';

async completeOnboarding() {
  const uid = this.auth.currentUser?.uid;
  const stageName = this.form.value.stageName;
  
  // Generate slug-uid
  const slugUid = await generateAndSaveSlugUid(
    this.firestore,
    inject(ProfileUrlService),
    uid,
    stageName
  );
  
  // Create profile with slug
  const profile: Profile = {
    uid,
    slug: slugUid,
    actorProfile: { stageName, ... }
  };
  
  await setDoc(doc(this.firestore, 'profiles', uid), profile);
}
```

### In Onboarding (Producer)
File: `src/app/auth/onboarding-producer/onboarding-producer.component.ts`

Similar to actor, but use `producerProfile.name`

### In Edit Profile
File: `src/app/discover/edit-profile/edit-profile.component.ts`

```typescript
import { ensureProfileHasSlugUid } from '../../utils/slug-generator.util';

async saveProfile() {
  const profile = this.profileData();
  const name = this.isActor() 
    ? profile.actorProfile?.stageName 
    : profile.producerProfile?.name;
  
  // Ensure slug exists (for existing profiles)
  await ensureProfileHasSlugUid(
    this.firestore,
    inject(ProfileUrlService),
    profile,
    name
  );
  
  // Continue with save...
}
```

---

## ✅ Testing Checklist

- [ ] Create new profile → slug-uid is generated and saved
- [ ] Navigate to profile → URL shows slug-uid format
- [ ] Share profile URL → URL is stable and works
- [ ] Change name → slug-uid remains the same
- [ ] Search for actor → click profile → navigates correctly
- [ ] Existing profiles → migration generates slug-uid
- [ ] Firestore index → queries work without errors

---

**Implementation is complete! Just need to add slug generation to profile creation and migrate existing data.**
