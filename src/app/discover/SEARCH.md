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

## Future enhancements (nice-to-have)
- Add infinite scroll (currently preloads, then filters client-side).
- Persist wishlist to Firestore per producer.
- Voice search and AI search actions on the input.
- Proper language multi-select instead of free text.

---

## Quick glossary
- **Signal**: Angular 16+ reactive primitive (`signal`, `computed`) for component state.
- **Debounce**: Wait briefly before reacting to input (reduces churn).
- **Relevance**: Numeric score used to order results.
- **Sanitize**: Clean raw data into a predictable shape before use.
