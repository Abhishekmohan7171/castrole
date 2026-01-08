# Search Component Refactor - Implementation Summary

## Status: IN PROGRESS

### Completed ✅
1. **Created `search-constants.ts`** with:
   - 60+ CHARACTER_TYPES (emotions, energy, genres, styles)
   - CHARACTER_TYPE_SYNONYMS mapping for smart search
   - GENDER_OPTIONS (10 options matching Edit Profile)
   - AVAILABLE_SKILLS (48 skills)
   - AVAILABLE_LANGUAGES (30 languages)

### Current Challenges 🔧
The search.component.ts file is 1508 lines and highly interconnected. Making changes requires updating:
- Interface definitions (SearchFilters)
- Initial state (filters signal)
- Template (60+ references to filter properties)
- Filter logic methods (hasActiveFilters, clearFilters, getActiveFilterCount)
- Computed filteredActors (filter application logic)
- Active filter chips display
- FilterPersistenceService compatibility

### Recommended Approach 📋

Given the complexity and interconnected nature, I recommend we implement this in phases:

#### **Phase 1: Core Interface & State** (PRIORITY)
1. Update SearchFilters interface
2. Update initial filters signal
3. Add constants import
4. Fix hasActiveFilters, clearFilters, getActiveFilterCount methods

#### **Phase 2: Filter Logic** (NEXT)
1. Update filteredActors computed for height/weight ranges
2. Add character type filtering with synonym matching
3. Update height/weight parsing logic

#### **Phase 3: Template Updates** (FINAL)
1. Character Types: Multi-select with categories
2. Gender: Full dropdown list
3. Height/Weight: Range sliders
4. Skills/Languages: Autocomplete dropdowns
5. AI Button: Lock with "Coming Soon"

### Key Changes Required

#### 1. SearchFilters Interface
```typescript
// OLD
interface SearchFilters {
  characterType: string;  // Single
  heightCm: string;  // Single value
  weightKg: string;  // Single value
  // ...
}

// NEW
interface SearchFilters {
  characterTypes: string[];  // Multi-select array
  minHeight: number;  // Range
  maxHeight: number;
  minWeight: number;
  maxWeight: number;
  // ...
}
```

#### 2. Initial Filters Signal
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

#### 3. Template Changes (60+ locations)
- Line 122: `filters().characterType` → `filters().characterTypes`
- Line 177: `filters().heightCm` → `filters().minHeight` / `filters().maxHeight`
- Line 185: `filters().weightKg` → `filters().minWeight` / `filters().maxWeight`
- Lines 118-130: Replace single dropdown with multi-select checkboxes
- Lines 157-168: Update gender dropdown with all 10 options
- Lines 171-191: Replace inputs with range sliders
- Lines 194-217: Add autocomplete dropdowns for skills/languages
- Lines 83-87: Add lock icon to AI button

#### 4. Filter Logic Methods
- `hasNonDefaultFilters()`: Check `characterTypes.length > 0`, height/weight ranges
- `hasActiveFilters()`: Same as above
- `clearFilters()`: Reset to new defaults
- `getActiveFilterCount()`: Count based on new structure
- Add `toggleCharacterType(type: string)` method

#### 5. Filtered Actors Computed
- Replace single height/weight checks with range logic
- Add character type array filtering
- Add synonym matching for character types

### Breaking Changes ⚠️

1. **FilterPersistenceService**: The SearchFilters interface changed, so saved filters in localStorage may be incompatible
   - **Solution**: Add migration logic or clear old filters on first load

2. **Profile Collection**: Actors don't have `characterTypes` field yet
   - **Solution**: Make character type filtering optional for now, or add field to profiles

3. **Height/Weight Storage**: Currently stored as strings ("173 cm", "65 kg")
   - **Solution**: Parse strings to numbers in transformation logic

### Testing Requirements 📝

- [ ] All filters compile without errors
- [ ] Character types multi-select works
- [ ] Height/Weight range sliders work
- [ ] Skills/Languages autocomplete works
- [ ] Gender dropdown shows all options
- [ ] AI button shows lock + tooltip
- [ ] Filter persistence works (or gracefully handles old format)
- [ ] Active filter chips display correctly
- [ ] Clear filters resets to new defaults
- [ ] No runtime errors in console

### Estimated Complexity 🎯

- **Lines to modify**: ~150-200 lines
- **New lines to add**: ~300-400 lines (template + autocomplete logic)
- **Risk level**: HIGH (many interconnected changes)
- **Time estimate**: 2-3 hours for full implementation + testing

### Next Steps 🚀

**Option A: Full Implementation** (Recommended for production)
- Create a feature branch
- Implement all changes systematically
- Test thoroughly
- Merge when stable

**Option B: Incremental Implementation** (Safer)
- Phase 1: Update interfaces & state (this session)
- Phase 2: Update filter logic (next session)
- Phase 3: Update template (final session)

**Option C: Simplified Version** (Quick win)
- Keep single character type dropdown but update list
- Keep height/weight as single inputs but add validation
- Add autocomplete hints without full dropdown
- Lock AI button only

### Current Recommendation 💡

Given the scope and complexity, I recommend **Option B (Incremental)** or **Option C (Simplified)** for this session.

For **Option B - Phase 1**, I can:
1. Update SearchFilters interface
2. Update initial filters signal
3. Add constants import
4. Fix all filter logic methods
5. Update filteredActors computed
6. Leave template as-is for now (will show compilation errors but won't break runtime)

This gives you a working backend with the new filter structure, and we can update the template in the next session.

**Would you like me to proceed with Option B - Phase 1?**
