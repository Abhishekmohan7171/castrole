# Search Component Refactor - Implementation Plan

## Senior-Level Analysis

### Current State Issues
1. **Character Type**: Single dropdown with limited options (lead, supporting, extra, cameo)
2. **Gender**: Limited options (any, male, female, other)
3. **Height/Weight**: Single input fields instead of range sliders
4. **Skills/Languages**: Comma-separated text inputs without autocomplete
5. **Smart Search**: AI button is functional but should be locked for "Coming Soon"

### Target State Requirements
1. **Character Types**: Multi-select with 60+ options across 4 categories (emotions, energy, genres, styles)
2. **Gender**: Full list matching Edit Profile (10 options including non-binary, transgender, etc.)
3. **Height/Weight**: Dual-range sliders like Age (min/max with tolerance)
4. **Skills/Languages/Location**: Autocomplete dropdowns with predefined lists
5. **Smart Search**: Locked with "Coming Soon" message

### Interface Changes Required

```typescript
// OLD
interface SearchFilters {
  characterType: string;  // Single
  minAge: number;
  maxAge: number;
  gender: string;
  heightCm: string;  // Single value
  weightKg: string;  // Single value
  languages: string[];
  skills: string[];
  location: string;
}

// NEW
interface SearchFilters {
  characterTypes: string[];  // Multi-select array
  minAge: number;
  maxAge: number;
  gender: string;
  minHeight: number;  // Range start
  maxHeight: number;  // Range end
  minWeight: number;  // Range start
  maxWeight: number;  // Range end
  languages: string[];
  skills: string[];
  location: string;
}
```

### Implementation Steps

#### 1. Constants File ✅ (DONE)
- Created `search-constants.ts` with:
  - CHARACTER_TYPES array (60+ types)
  - CHARACTER_TYPE_SYNONYMS mapping
  - GENDER_OPTIONS array
  - AVAILABLE_SKILLS array
  - AVAILABLE_LANGUAGES array

#### 2. Update Interfaces
- Change `characterType` → `characterTypes: string[]`
- Change `heightCm` → `minHeight` and `maxHeight`
- Change `weightKg` → `minWeight` and `maxWeight`

#### 3. Update Initial Filters Signal
```typescript
filters = signal<SearchFilters>({
  characterTypes: [],  // Empty array
  minAge: 0,
  maxAge: 100,
  gender: 'any',
  minHeight: 140,  // Reasonable defaults
  maxHeight: 200,
  minWeight: 40,
  maxWeight: 120,
  languages: [],
  skills: [],
  location: ''
});
```

#### 4. Update Filter Logic Methods
- `hasNonDefaultFilters()`: Check `characterTypes.length > 0`, height/weight ranges
- `clearFilters()`: Reset to new defaults
- `getActiveFilterCount()`: Count based on new structure
- `toggleCharacterType(type: string)`: Add/remove from array

#### 5. Update Filtered Actors Computed
- Replace `characterType` checks with `characterTypes` array logic
- Replace single height/weight checks with range logic
- Add synonym matching for character types

#### 6. Update Template
- **Character Types**: Scrollable multi-select checkboxes with categories
- **Gender**: Dropdown with all 10 options
- **Height**: Dual-range slider (140-200cm default)
- **Weight**: Dual-range slider (40-120kg default)
- **Skills**: Autocomplete dropdown with AVAILABLE_SKILLS
- **Languages**: Autocomplete dropdown with AVAILABLE_LANGUAGES
- **Location**: Autocomplete dropdown (can add Indian cities list)
- **AI Button**: Add lock icon + "Coming Soon" tooltip

#### 7. Add Autocomplete Logic
```typescript
// Signals for autocomplete
skillsDropdownOpen = signal(false);
languagesDropdownOpen = signal(false);
locationDropdownOpen = signal(false);

// Filtered suggestions
filteredSkills = computed(() => {
  const input = this.skillsInput().toLowerCase();
  const selected = this.filters().skills;
  return AVAILABLE_SKILLS.filter(skill => 
    !selected.includes(skill) &&
    skill.toLowerCase().includes(input)
  );
});

// Similar for languages and location
```

#### 8. Add Character Type Synonym Matching
```typescript
private matchesCharacterType(actor: ActorSearchResult, types: string[]): boolean {
  if (types.length === 0) return true;
  
  // Check if actor's character types match any selected types or their synonyms
  return types.some(selectedType => {
    const synonyms = CHARACTER_TYPE_SYNONYMS[selectedType] || [];
    return actor.characterTypes?.some(actorType => 
      actorType.toLowerCase() === selectedType.toLowerCase() ||
      synonyms.some(syn => actorType.toLowerCase().includes(syn.toLowerCase()))
    );
  });
}
```

### Breaking Changes & Migration

1. **FilterPersistenceService**: May need to handle old filter format
2. **Profile Interface**: May need to add `characterTypes` field to ActorProfile
3. **Firestore**: Consider adding character types to actor profiles for filtering

### Testing Checklist

- [ ] Character types multi-select works
- [ ] Height/Weight sliders work with range logic
- [ ] Skills autocomplete shows suggestions
- [ ] Languages autocomplete shows suggestions
- [ ] Location autocomplete works
- [ ] Gender dropdown shows all options
- [ ] AI button shows lock + tooltip
- [ ] Filter persistence works with new structure
- [ ] Active filter chips display correctly
- [ ] Clear filters resets to new defaults
- [ ] Synonym matching works for character types

### Potential Issues & Solutions

**Issue 1**: Profile collection doesn't have `characterTypes` field
**Solution**: Make character type filtering optional, or add migration script

**Issue 2**: Height/Weight stored as strings (e.g., "173 cm", "65 kg")
**Solution**: Parse strings to numbers, handle various formats

**Issue 3**: Autocomplete dropdown positioning
**Solution**: Use relative positioning with z-index management

**Issue 4**: Too many character types to display
**Solution**: Group by category with collapsible sections

### Performance Considerations

1. **Character Types**: 60+ options - use virtual scrolling or categories
2. **Autocomplete**: Debounce input to avoid excessive filtering
3. **Synonym Matching**: Pre-compute synonym map for O(1) lookup
4. **Filter Logic**: Run filters in order of selectivity (most restrictive first)

### UI/UX Improvements

1. **Character Types**: Group into 4 collapsible categories
   - Emotional States (21 types)
   - Energy & Expression (7 types)
   - Genres (18 types)
   - Performance Styles (9 types)

2. **Height/Weight Sliders**: Show current range values prominently

3. **Autocomplete**: Show "No results" message, limit to 10 suggestions

4. **Smart Search Lock**: Subtle animation on hover, clear "Coming Soon" message

### Code Quality Standards

- ✅ Strict TypeScript typing (no `any`)
- ✅ Signal-based reactivity
- ✅ Computed for derived state
- ✅ Pure functions for filtering logic
- ✅ Proper error handling
- ✅ Accessibility (ARIA labels, keyboard navigation)
- ✅ Responsive design (mobile-first)
- ✅ Performance optimization (debouncing, memoization)

## Next Steps

1. Import constants into search component
2. Update SearchFilters interface
3. Update initial filters signal
4. Update all filter logic methods
5. Update filteredActors computed
6. Update template with new UI
7. Test thoroughly
8. Fix any compilation errors
9. Verify no runtime errors
10. Test on mobile devices
