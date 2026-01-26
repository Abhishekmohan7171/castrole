import { Injectable } from '@angular/core';

/**
 * Filter state structure for persistence
 */
export interface FilterState {
  filters: SearchFilters;
  searchQuery: string;
  languageInput: string;
  skillsInput: string;
}

/**
 * Search filters interface (matches search.component.ts)
 */
export interface SearchFilters {
  characterTypes: string[];  // Multi-select character types
  minAge: number;
  maxAge: number;
  gender: string;
  minHeight: number;  // Min height in cm
  maxHeight: number;  // Max height in cm
  bodyType: string;  // Single body type selection
  languages: string[];
  skills: string[];
  location: string;
}

/**
 * Service to persist search filters to localStorage across browser sessions.
 * Handles SSR compatibility, validation, and error handling.
 */
@Injectable({ providedIn: 'root' })
export class FilterPersistenceService {
  // localStorage keys following existing pattern (like 'chat:lastRoomId')
  private readonly FILTERS_KEY = 'search:filters';
  private readonly SEARCH_QUERY_KEY = 'search:query';
  private readonly LANGUAGE_INPUT_KEY = 'search:languageInput';
  private readonly SKILLS_INPUT_KEY = 'search:skillsInput';

  // Default filter values (matches search.component.ts defaults)
  private readonly defaultFilters: SearchFilters = {
    characterTypes: [],
    minAge: 0,
    maxAge: 100,
    gender: 'any',
    minHeight: 140,
    maxHeight: 200,
    bodyType: '',
    languages: [],
    skills: [],
    location: ''
  };

  /**
   * Save filter state to localStorage
   */
  saveFilters(data: FilterState): void {
    try {
      // Check if localStorage is available (SSR compatibility)
      if (typeof localStorage === 'undefined') {
        return;
      }

      localStorage.setItem(this.FILTERS_KEY, JSON.stringify(data.filters));
      localStorage.setItem(this.SEARCH_QUERY_KEY, data.searchQuery);
      localStorage.setItem(this.LANGUAGE_INPUT_KEY, data.languageInput);
      localStorage.setItem(this.SKILLS_INPUT_KEY, data.skillsInput);
    } catch (e) {
      // Handle quota exceeded or other storage errors gracefully
      if (e instanceof Error && e.name === 'QuotaExceededError') {
        console.warn('localStorage quota exceeded, skipping filter save');
      } else {
        console.warn('Error saving filters to localStorage:', e);
      }
    }
  }

  /**
   * Load filter state from localStorage
   * Returns defaults if not available or invalid
   */
  loadFilters(): FilterState {
    try {
      // Check if localStorage is available (SSR compatibility)
      if (typeof localStorage === 'undefined') {
        return this.getDefaults();
      }

      const savedFilters = localStorage.getItem(this.FILTERS_KEY);
      const savedQuery = localStorage.getItem(this.SEARCH_QUERY_KEY) || '';
      const savedLanguageInput = localStorage.getItem(this.LANGUAGE_INPUT_KEY) || '';
      const savedSkillsInput = localStorage.getItem(this.SKILLS_INPUT_KEY) || '';

      // Parse and validate saved filters
      const filters = savedFilters ? this.validateFilters(JSON.parse(savedFilters)) : this.defaultFilters;

      return {
        filters,
        searchQuery: savedQuery,
        languageInput: savedLanguageInput,
        skillsInput: savedSkillsInput
      };
    } catch (e) {
      // If any error occurs (parse error, etc), return defaults
      console.warn('Error loading filters from localStorage, using defaults:', e);
      return this.getDefaults();
    }
  }

  /**
   * Clear all saved filters from localStorage
   */
  clearFilters(): void {
    try {
      if (typeof localStorage === 'undefined') {
        return;
      }

      localStorage.removeItem(this.FILTERS_KEY);
      localStorage.removeItem(this.SEARCH_QUERY_KEY);
      localStorage.removeItem(this.LANGUAGE_INPUT_KEY);
      localStorage.removeItem(this.SKILLS_INPUT_KEY);
    } catch (e) {
      console.warn('Error clearing filters from localStorage:', e);
    }
  }

  /**
   * Validate and sanitize loaded filter data
   * Ensures all fields have correct types and valid values
   */
  private validateFilters(data: any): SearchFilters {
    if (!data || typeof data !== 'object') {
      return this.defaultFilters;
    }

    return {
      characterTypes: this.validateArray(data.characterTypes),
      minAge: this.validateNumber(data.minAge, 0, 0, 100),
      maxAge: this.validateNumber(data.maxAge, 100, 0, 100),
      gender: this.validateString(data.gender, 'any'),
      minHeight: this.validateNumber(data.minHeight, 140, 100, 250),
      maxHeight: this.validateNumber(data.maxHeight, 200, 100, 250),
      bodyType: this.validateString(data.bodyType, ''),
      languages: this.validateArray(data.languages),
      skills: this.validateArray(data.skills),
      location: this.validateString(data.location, '')
    };
  }

  /**
   * Validate string field
   */
  private validateString(value: any, defaultValue: string): string {
    return typeof value === 'string' ? value : defaultValue;
  }

  /**
   * Validate number field with optional min/max bounds
   */
  private validateNumber(value: any, defaultValue: number, min?: number, max?: number): number {
    if (typeof value !== 'number' || isNaN(value)) {
      return defaultValue;
    }

    // Apply bounds if provided
    if (min !== undefined && value < min) {
      return min;
    }
    if (max !== undefined && value > max) {
      return max;
    }

    return value;
  }

  /**
   * Validate array field (ensure it's an array of strings)
   */
  private validateArray(value: any): string[] {
    if (!Array.isArray(value)) {
      return [];
    }

    // Filter out non-string values
    return value.filter(item => typeof item === 'string');
  }

  /**
   * Get default filter state
   */
  private getDefaults(): FilterState {
    return {
      filters: this.defaultFilters,
      searchQuery: '',
      languageInput: '',
      skillsInput: ''
    };
  }
}
