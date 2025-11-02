# Search (Discover) – Developer Guide

This document explains how the Search page works in simple, practical steps.
It is written for someone new to the codebase.

Related file: `src/app/discover/search.component.ts`

---

## What the page does
- Lets a producer search for actor profiles from Firestore `profiles` collection.
- Results are shown as cards (photo, stage name, age, skills).
- Results update as the user types (debounced 300ms).
- You can also refine by filters (gender, age, height/weight, languages).

---

## High-level flow
1. On page init we background-load all actor profiles (only actors).
2. Nothing is displayed initially (until the user types or changes filters).
3. When the user types in the search bar:
   - We wait 300ms (debounce) to avoid excessive processing.
   - We parse the text (e.g., extract age/gender/skills if present).
   - We filter and rank the previously loaded actor list and render cards.
4. When filters change, the computed result list updates automatically.

---

## Data model used in the UI
We convert Firestore documents into a clean `ActorSearchResult` for rendering:
```ts
interface ActorSearchResult {
  uid: string;
  stageName: string;
  age?: string;
  gender?: string;
  location?: string;
  height?: string;
  weight?: string;
  skills?: string[];
  languages?: string[];
  profileImageUrl?: string;
  carouselImages?: string[];
  profileViewCount?: number;
  wishlistCount?: number;
  relevanceScore?: number; // computed at runtime
}
```

We read from two collections:
- `users` (to find only actor UIDs with `currentRole == 'actor'`)
- `profiles` (to fetch full profile by UID)

Batching: Firestore `in` queries are limited to 10 IDs, so we fetch profiles in chunks of 10.

---

## Important signals (state)
- `searchQuery`: text typed in the search bar.
- `searchTags`: visual chips extracted from the query.
- `filters`: gender, min/max age, height/weight, languages.
- `allActors`: all transformed actor results loaded from Firestore.
- `filteredActors`: computed list shown in the grid.
- `loading` / `error`: spinner and error UI.

---

## Updating on each keystroke
We use RxJS with a debounce for live search:
```ts
private searchSubject = new Subject<string>();

private setupSearchDebounce() {
  this.searchSubject
    .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
    .subscribe(query => {
      this.parseSearchQuery(query);   // Extract age/gender/skills if present
      this.extractSearchTags(query);  // Build visual chips
    });
}

onSearchChange() {
  this.searchSubject.next(this.searchQuery());
}
```

---

## Smart parsing (simple NLP)
`parseSearchQuery()` tries to infer structure from free text, e.g.:
- "25-year-old fair boy with boxing skills" =>
  - ageRange: 23–27
  - gender: male
  - skills: ["boxing"]
  - physicalTraits: ["fair"]

This parsed info is used to influence relevance scoring and filtering.

---

## Filtering and ranking
All UI results come from the computed signal `filteredActors`.

Steps in that computation:
1. If there is no search text and no filters changed from defaults → return `[]` (show initial empty state).
2. Start from the `allActors` array.
3. Text match across: `stageName`, `skills`, `languages`, `location`, `gender`, `age`.
   - We type-guard every string match: `typeof skill === 'string' && skill.toLowerCase()...`.
4. Relevance score (bigger = earlier in the list):
   - Exact/partial `stageName` match
   - Parsed skills match count
   - Parsed age range match
   - Gender match
   - Popularity boosts: `profileViewCount`, `wishlistCount`
5. Apply filters if changed:
   - Gender: exact match (case-insensitive)
   - Age: only if min/max changed from defaults (18–50)
   - Height: compares inches with ±2" tolerance
   - Weight: ±5kg tolerance
   - Languages: intersection with actor languages

## Filters — explained like I’m five (E‑L‑I5)
Everything you do in the left sidebar changes one big object called `filters`. When `filters` change, the grid on the right updates by itself.

- `filters` lives in `search.component.ts`:
```ts
filters = signal<SearchFilters>({
  characterType: 'any',
  minAge: 18,
  maxAge: 50,
  gender: 'any',
  heightFt: '',
  heightIn: '',
  weight: '',
  languages: []
});
```

- Signals can’t be changed directly with two-way binding. So we read a value and write updates with helper methods.

### How each control updates filters
- **Character Type (dropdown)**
  - Reads current value: `[value]="filters().characterType"`
  - When you pick a new one: `(change)="updateFilter('characterType', $any($event.target).value)"`
  - Note: Today, character type doesn’t affect filtering yet. It’s wired for future use.

- **Age (number + slider)**
  - Minimum: `(input)="updateFilter('minAge', +$any($event.target).value)"`
  - Maximum: `(input)="updateFilter('maxAge', +$any($event.target).value)"`
  - In filtering, age is considered only if you changed it away from the default 18–50.

- **Gender (radio buttons)**
  - Checked state comes from the signal, e.g. `[checked]="filters().gender === 'male'"`
  - Clicking a radio runs: `(change)="updateFilter('gender', 'male')"`

- **Height / Weight (text inputs)**
  - Height feet: `(input)="updateFilter('heightFt', $any($event.target).value)"`
  - Height inches: `(input)="updateFilter('heightIn', $any($event.target).value)"`
  - Weight: `(input)="updateFilter('weight', $any($event.target).value)"`

- **Languages (comma-separated input)**
  - What you type temporarily lives in `languageInput` (so you can edit without changing filters yet).
  - Press Enter or click “Apply Filters” to copy it into `filters.languages`:
```ts
applyLanguageFilter() {
  const input = this.languageInput().trim();
  const languages = input
    ? input.split(',').map(x => x.trim()).filter(Boolean)
    : [];
  updateFilter('languages', languages);
}
```

### What happens when you click “Apply Filters”
1. We parse the language text and store it in `filters.languages`.
2. We log the current filters for debugging.
3. We don’t manually refresh the grid — the computed `filteredActors` updates automatically because a signal changed.

### How the grid actually filters
Inside `filteredActors` we take `allActors` and narrow it step by step:
- **Gender**: keep only actors whose `actor.gender` matches your choice (case-insensitive).
- **Age**: keep only actors between `minAge` and `maxAge` if you changed them from defaults.
- **Height**: convert both your input and the actor’s height into inches; keep actors within ±2 inches.
- **Weight**: keep actors within ±5 kg of the number you typed.
- **Languages**: if you entered any, keep an actor if at least one of your languages appears in their language list (case-insensitive).

Each step logs how many actors were removed, so you can see exactly what happened. Example logs:
```
Gender filter (male): 50 → 27 actors
Age filter (20-30): 27 → 18 actors
Languages filter (English, Hindi): 18 → 12 actors
Filtered results: 12 actors found
```

### How to clear filters
- Click “Clear All Filters” to reset everything back to defaults.
- Or click the little “×” on each active filter chip above the grid to remove just that one.

### Quick mental model
- Think of filters like stacking sieves: each sieve removes some actors.
- Changing the knobs just swaps a sieve for a tighter/looser one.
- When you’re done, you see only the actors that passed through all sieves.

---

## UI states
- Loading: spinner while reading Firestore
- Initial (no query/filters): onboarding hint text
- Results: grid of actor cards
- No results: friendly message
- Error: retry button

---

## Defensive coding decisions
- We sanitize `skills` and `languages` during transform so they are always string arrays.
- All `.toLowerCase()` calls have type checks to avoid runtime errors.
- Age filter only applies if the user changed from defaults, so actors with missing age are not unintentionally filtered out.

---

## Common troubleshooting
- **No cards appear when typing**
  - Check DevTools console for our logs: you should see 
    - `Filtering X total actors with query: "..."`
    - `Filtered results: Y actors found`
  - If X is 0, verify Firestore has actor profiles and `users.currentRole == 'actor'` documents.
  - If Y is 0, try a simpler query (e.g. first 3 letters of stage name).

- **`skill.toLowerCase is not a function`**
  - Cause: non-string values inside `actorProfile.skills`.
  - Fix: we now sanitize arrays in the transform and type-guard all matches. Also ensure the onboarding writes `string[]` only.

- **`net::ERR_BLOCKED_BY_CLIENT` in Network tab**
  - Cause: a browser extension (ad/tracker blocker) is blocking Google/Firebase domains.
  - Fix: disable the extension for `localhost` / your dev domain.

---

## Where to change things
- Relevance formula: `calculateRelevance()` in `search.component.ts`.
- Add/remove recognized skill keywords in `parseSearchQuery()`.
- Filters UI: template section in `search.component.ts` under the sidebar.
- Card layout: results grid inside the main column of the same template.

---

## Wishlist Feature

The wishlist allows producers to save actors they're interested in. It persists across sessions and syncs in real-time across all devices.

### How it works
1. **Storage**: Firestore collection `wishlists` with document ID = producer's UID.
2. **Structure**:
   ```ts
   {
     producerId: string,
     actorUids: string[],  // Array of actor UIDs
     updatedAt: Date
   }
   ```
3. **Real-time Sync**: Uses Firestore `onSnapshot` listener for live updates.
4. **Loading**: After actors load, we setup a real-time listener that automatically updates the wishlist.
5. **Saving**: Every add/remove triggers `saveWishlist()` which updates Firestore.
6. **Cross-device**: Changes on one device instantly reflect on all other devices.
7. **UI**: Heart icon on each card (filled = in wishlist, outline = not in wishlist).
8. **Sidebar**: Shows mini cards of wishlisted actors with remove button.

### Key methods
- `setupWishlistListener()`: Sets up real-time Firestore listener using `onSnapshot`.
- `saveWishlist()`: Writes current wishlist UIDs to Firestore.
- `toggleWishlist(actor)`: Adds/removes actor and persists immediately.
- `isInWishlist(actor)`: Checks if actor is in wishlist (for UI state).

### Real-time sync behavior
- **Device A adds actor** → Firestore updates → **Device B sees update instantly**
- **Device B removes actor** → Firestore updates → **Device A sees removal instantly**
- Listener automatically handles reconnection after network issues.
- Unsubscribes on component destroy to prevent memory leaks.

### Auth requirement
- Requires logged-in user (`this.auth.currentUser?.uid`).
- If no user, wishlist operations are skipped with a warning log.

---

## Future enhancements (nice-to-have)
- Add infinite scroll (currently preloads, then filters client-side).
- Voice search and AI search actions on the input.
- Proper language multi-select instead of free text.
- Export wishlist as PDF/CSV.
- Share wishlist with team members.

---

## Quick glossary
- **Signal**: Angular 16+ reactive primitive (`signal`, `computed`) for component state.
- **Debounce**: Wait briefly before reacting to input (reduces churn).
- **Relevance**: Numeric score used to order results.
- **Sanitize**: Clean raw data into a predictable shape before use.
