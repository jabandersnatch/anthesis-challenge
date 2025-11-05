/**
 * Type definitions for Emissions API
 * These interfaces match the backend Django REST API schema
 */

/**
 * Emission Type enum - types of greenhouse gases
 */
export enum EmissionType {
  CO2 = 'CO2',
  CH4 = 'CH4',
  N2O = 'N2O',
  F_GASES = 'F_GASES',
}

/**
 * Activity enum - sectors producing emissions
 */
export enum Activity {
  ENERGY = 'ENERGY',
  TRANSPORT = 'TRANSPORT',
  AGRICULTURE = 'AGRICULTURE',
  INDUSTRIAL = 'INDUSTRIAL',
  WASTE = 'WASTE',
  OTHER = 'OTHER',
}

/**
 * Main Emission interface - represents a single emission record
 */
export interface Emission {
  id: number;
  year: number;
  emissions: number;
  country: string;
  emission_type: EmissionType;
  activity: Activity;
  created_at: string;
}

/**
 * DTO for creating a new emission (no id or created_at)
 */
export interface CreateEmissionDto {
  year: number;
  emissions: number;
  country: string;
  emission_type: EmissionType;
  activity: Activity;
}

/**
 * DTO for updating an emission (all fields optional)
 */
export interface UpdateEmissionDto {
  year?: number;
  emissions?: number;
  country?: string;
  emission_type?: EmissionType;
  activity?: Activity;
}

/**
 * Filter interface for querying emissions
 * Maps to Django REST Framework query parameters
 */
export interface EmissionFilters {
  // Year filters
  year?: number;
  year__gte?: number;
  year__lte?: number;

  // Country filters
  country?: string;
  country__in?: string[]; // Will be joined as comma-separated string

  // Type and activity filters
  emission_type?: EmissionType;
  activity?: Activity;

  // Emission value filters
  emissions__gte?: number;
  emissions__lte?: number;

  // Text search (searches country and activity fields)
  search?: string;

  // Ordering (prefix with '-' for descending)
  // Examples: 'year', '-emissions', '-year,country'
  ordering?: string;

  // Pagination
  page?: number;
  page_size?: number;
}

/**
 * Generic paginated response from the API
 */
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

/**
 * Helper type for ordering fields
 */
export type OrderingField =
  | 'year'
  | '-year'
  | 'emissions'
  | '-emissions'
  | 'country'
  | '-country'
  | 'emission_type'
  | '-emission_type'
  | 'activity'
  | '-activity'
  | 'created_at'
  | '-created_at';

/**
 * Helper function to convert EmissionFilters to query params
 */
export function filtersToParams(filters: EmissionFilters): Record<string, string> {
  const params: Record<string, string> = {};

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (key === 'country__in' && Array.isArray(value)) {
        // Convert array to comma-separated string
        params[key] = value.join(',');
      } else {
        params[key] = String(value);
      }
    }
  });

  return params;
}

/**
 * Country data for globe visualization
 */
export interface CountryEmissionData {
  country: string;
  totalEmissions: number;
  avgEmissions: number;
  yearRange: { min: number; max: number };
  emissionsByYear: { year: number; emissions: number }[];
  emissionsByType: { type: EmissionType; emissions: number }[];
}

/**
 * API Error response
 */
export interface ApiError {
  message: string;
  status: number;
  errors?: Record<string, string[]>;
}

/**
 * Globe point data for Three.js globe visualization
 */
export interface GlobePointData {
  lat: number;
  lng: number;
  country: string;
  totalEmissions: number;
  size: number;
  color: string;
  label: string;
}

/**
 * Globe configuration options
 */
export interface GlobeConfig {
  globeImageUrl?: string;
  bumpImageUrl?: string;
  backgroundColor?: string;
  atmosphereColor?: string;
  atmosphereAltitude?: number;
  pointAltitude?: number;
  pointRadius?: number;
}
