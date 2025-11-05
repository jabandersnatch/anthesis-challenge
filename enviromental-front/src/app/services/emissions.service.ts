import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { environment } from '../../environments/environment';
import {
  Emission,
  CreateEmissionDto,
  UpdateEmissionDto,
  EmissionFilters,
  PaginatedResponse,
  ApiError,
  filtersToParams,
} from '../models/emission.model';

/**
 * Service for managing emissions data via the REST API
 * Provides CRUD operations with filtering, pagination, and ordering
 */
@Injectable({
  providedIn: 'root',
})
export class EmissionsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}${environment.apiEndpoints.emissions}`;

  /**
   * Get all emissions with optional filters
   * @param filters Optional filters for querying emissions
   * @returns Observable of paginated emissions response
   */
  getAll(filters?: EmissionFilters): Observable<PaginatedResponse<Emission>> {
    let params = new HttpParams();

    if (filters) {
      const filterParams = filtersToParams(filters);
      Object.entries(filterParams).forEach(([key, value]) => {
        params = params.set(key, value);
      });
    }

    return this.http
      .get<PaginatedResponse<Emission>>(this.baseUrl, { params })
      .pipe(catchError(this.handleError));
  }

  /**
   * Get a single emission by ID
   * @param id Emission ID
   * @returns Observable of emission
   */
  getById(id: number): Observable<Emission> {
    return this.http
      .get<Emission>(`${this.baseUrl}${id}/`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Create a new emission record
   * @param emission Emission data to create
   * @returns Observable of created emission
   */
  create(emission: CreateEmissionDto): Observable<Emission> {
    return this.http
      .post<Emission>(this.baseUrl, emission)
      .pipe(catchError(this.handleError));
  }

  /**
   * Update an existing emission record (full update)
   * @param id Emission ID
   * @param emission Complete emission data
   * @returns Observable of updated emission
   */
  update(id: number, emission: CreateEmissionDto): Observable<Emission> {
    return this.http
      .put<Emission>(`${this.baseUrl}${id}/`, emission)
      .pipe(catchError(this.handleError));
  }

  /**
   * Partially update an emission record
   * @param id Emission ID
   * @param emission Partial emission data to update
   * @returns Observable of updated emission
   */
  patch(id: number, emission: UpdateEmissionDto): Observable<Emission> {
    return this.http
      .patch<Emission>(`${this.baseUrl}${id}/`, emission)
      .pipe(catchError(this.handleError));
  }

  /**
   * Delete an emission record
   * @param id Emission ID
   * @returns Observable of void
   */
  delete(id: number): Observable<void> {
    return this.http
      .delete<void>(`${this.baseUrl}${id}/`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Get emissions grouped by country for visualization
   * @returns Observable of emissions aggregated by country
   */
  getByCountry(): Observable<Record<string, Emission[]>> {
    return this.getAll({ page_size: 100 }).pipe(
      map((response) => {
        const byCountry: Record<string, Emission[]> = {};
        response.results.forEach((emission) => {
          if (!byCountry[emission.country]) {
            byCountry[emission.country] = [];
          }
          byCountry[emission.country].push(emission);
        });
        return byCountry;
      })
    );
  }

  /**
   * Get emissions for a specific country (for time series charts)
   * @param country Country code
   * @returns Observable of paginated emissions for the country
   */
  getByCountryCode(country: string): Observable<PaginatedResponse<Emission>> {
    return this.getAll({ country, ordering: 'year', page_size: 100 });
  }

  /**
   * Get unique list of countries
   * @returns Observable of country codes array
   */
  getCountries(): Observable<string[]> {
    return this.getAll({ page_size: 100 }).pipe(
      map((response) => {
        const countries = new Set(response.results.map((e) => e.country));
        return Array.from(countries).sort();
      })
    );
  }

  /**
   * Handle HTTP errors
   * @param error HttpErrorResponse
   * @returns Observable error
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let apiError: ApiError;

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      apiError = {
        message: error.error.message,
        status: 0,
      };
    } else {
      // Backend error
      apiError = {
        message: error.message || 'An error occurred while fetching data',
        status: error.status,
        errors: error.error?.errors,
      };
    }

    console.error('API Error:', apiError);
    return throwError(() => apiError);
  }
}
