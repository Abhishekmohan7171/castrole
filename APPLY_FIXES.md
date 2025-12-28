# Quick Fix Script for Search Component

## Step 1: Import Constants (Line 15)
Add after line 15:
```typescript
import { CHARACTER_TYPES, CHARACTER_TYPE_SYNONYMS, GENDER_OPTIONS, AVAILABLE_SKILLS, AVAILABLE_LANGUAGES } from './search-constants';
```

## Step 2: Update SearchFilters Interface (Lines 37-47)
Replace with:
```typescript
interface SearchFilters {
  characterTypes: string[];  // Multi-select character types
  minAge: number;
  maxAge: number;
  gender: string;
  minHeight: number;  // Min height in cm
  maxHeight: number;  // Max height in cm
  minWeight: number;  // Min weight in kg
  maxWeight: number;  // Max weight in kg
  languages: string[];
  skills: string[];
  location: string;
}
```

## Step 3: Expose Constants in Component Class (After line 598)
Add:
```typescript
  // Expose constants for template
  readonly characterTypes = CHARACTER_TYPES;
  readonly genderOptions = GENDER_OPTIONS;
  readonly availableSkills = AVAILABLE_SKILLS;
  readonly availableLanguages = AVAILABLE_LANGUAGES;
```

## Step 4: Update Initial Filters Signal (Lines 617-627)
Replace with:
```typescript
  filters = signal<SearchFilters>({
    characterTypes: [],  // Multi-select character types
    minAge: 0,
    maxAge: 100,
    gender: 'any',
    minHeight: 140,  // Min height in cm
    maxHeight: 200,  // Max height in cm
    minWeight: 40,   // Min weight in kg
    maxWeight: 120,  // Max weight in kg
    languages: [],
    skills: [],
    location: ''
  });
```

## Step 5: Add toggleCharacterType Method (After updateFilter method ~line 1248)
Add:
```typescript
  /**
   * Toggle character type in multi-select
   */
  toggleCharacterType(type: string): void {
    const currentTypes = this.filters().characterTypes;
    const newTypes = currentTypes.includes(type)
      ? currentTypes.filter(t => t !== type)
      : [...currentTypes, type];
    this.updateFilter('characterTypes', newTypes);
    this.logger.log(`Character type toggled: ${type}, now selected: ${newTypes.length}`);
  }
```

## Step 6: Replace Character Type Dropdown in Template (Lines 118-130)
Replace with:
```html
              <!-- Character Types (Multi-select) -->
              <div class="mb-6">
                <label class="block text-sm font-medium text-neutral-300 mb-2">
                  Character Types
                  @if (filters().characterTypes.length > 0) {
                    <span class="ml-2 text-xs text-fuchsia-400">({{ filters().characterTypes.length }} selected)</span>
                  }
                </label>
                <div class="max-h-64 overflow-y-auto bg-neutral-800 border border-neutral-700 rounded-lg p-3 space-y-2">
                  @for (type of characterTypes; track type) {
                    <label class="flex items-center gap-2 cursor-pointer hover:bg-neutral-700 p-2 rounded transition-colors">
                      <input 
                        type="checkbox"
                        [checked]="filters().characterTypes.includes(type)"
                        (change)="toggleCharacterType(type)"
                        class="w-4 h-4 rounded border-neutral-600 text-fuchsia-500 focus:ring-fuchsia-500 focus:ring-offset-0 bg-neutral-700">
                      <span class="text-sm text-neutral-200 capitalize">{{ type }}</span>
                    </label>
                  }
                </div>
              </div>
```

This is the minimal set of changes needed to make the character types dropdown work!
The remaining errors can be fixed later.
