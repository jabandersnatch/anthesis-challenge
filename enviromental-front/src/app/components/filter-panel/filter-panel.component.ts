import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { EmissionsStore } from '../../store/emissions.store';
import { EmissionType, Activity } from '../../models/emission.model';

/**
 * Filter Panel Component
 * Provides filtering controls for emissions data
 */
@Component({
  selector: 'app-filter-panel',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
  ],
  templateUrl: './filter-panel.component.html',
  styleUrl: './filter-panel.component.css',
})
export class FilterPanelComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly store = inject(EmissionsStore);

  readonly filterForm: FormGroup;

  readonly emissionTypes = Object.values(EmissionType);
  readonly activities = Object.values(Activity);
  readonly currentYear = new Date().getFullYear();

  constructor() {
    this.filterForm = this.fb.group({
      search: [''],
      year: [null],
      yearFrom: [null],
      yearTo: [null],
      country: [''],
      emissionType: [''],
      activity: [''],
    });
  }

  ngOnInit(): void {
    // Subscribe to form changes with debounce
    this.filterForm.valueChanges
      .pipe(debounceTime(500), distinctUntilChanged())
      .subscribe((values) => {
        this.applyFilters(values);
      });
  }

  private async applyFilters(values: any): Promise<void> {
    const filters: any = {};

    if (values.search?.trim()) {
      filters.search = values.search.trim();
    }

    if (values.year) {
      filters.year = Number(values.year);
    }

    if (values.yearFrom) {
      filters.year__gte = Number(values.yearFrom);
    }

    if (values.yearTo) {
      filters.year__lte = Number(values.yearTo);
    }

    if (values.country?.trim()) {
      filters.country = values.country.trim().toUpperCase();
    }

    if (values.emissionType) {
      filters.emission_type = values.emissionType;
    }

    if (values.activity) {
      filters.activity = values.activity;
    }

    await this.store.updateFilters(filters);
  }

  async clearFilters(): Promise<void> {
    this.filterForm.reset();
    await this.store.resetFilters();
  }

  async applyQuickFilter(filter: 'recent' | 'high' | 'co2'): Promise<void> {
    const currentYear = new Date().getFullYear();

    switch (filter) {
      case 'recent':
        this.filterForm.patchValue({
          yearFrom: currentYear - 5,
          yearTo: currentYear,
        });
        break;
      case 'high':
        await this.store.updateFilters({
          ordering: '-emissions',
        });
        break;
      case 'co2':
        this.filterForm.patchValue({
          emissionType: EmissionType.CO2,
        });
        break;
    }
  }
}
