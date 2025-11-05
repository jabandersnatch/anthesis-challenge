import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';

import { EmissionsStore } from '../../store/emissions.store';
import { Emission } from '../../models/emission.model';
import { FilterPanelComponent } from '../filter-panel/filter-panel.component';

/**
 * Emissions List Component
 * Displays emissions in a sortable, paginated table with filtering
 */
@Component({
  selector: 'app-emissions-list',
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatDialogModule,
    MatSnackBarModule,
    MatChipsModule,
    FilterPanelComponent,
  ],
  templateUrl: './emissions-list.component.html',
  styleUrl: './emissions-list.component.css',
})
export class EmissionsListComponent implements OnInit {
  private readonly store = inject(EmissionsStore);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  // Expose store signals
  readonly emissions = this.store.emissions;
  readonly loading = this.store.loading;
  readonly error = this.store.error;
  readonly totalCount = this.store.totalCount;
  readonly currentPage = this.store.currentPage;
  readonly pageSize = this.store.pageSize;
  readonly filters = this.store.filters;

  // Table configuration
  readonly displayedColumns: string[] = [
    'year',
    'country',
    'emissions',
    'emission_type',
    'activity',
    'actions',
  ];

  readonly showFilters = signal(true);

  async ngOnInit(): Promise<void> {
    await this.store.loadEmissions();
  }

  onSort(sort: Sort): void {
    if (!sort.active || !sort.direction) {
      this.store.updateFilters({ ordering: '-year' });
      return;
    }

    const direction = sort.direction === 'asc' ? '' : '-';
    const ordering = `${direction}${sort.active}`;
    this.store.updateFilters({ ordering });
  }

  onPageChange(event: PageEvent): void {
    this.store.updateFilters({
      page: event.pageIndex + 1,
      page_size: event.pageSize,
    });
  }

  editEmission(emission: Emission): void {
    this.router.navigate(['/edit', emission.id]);
  }

  async deleteEmission(emission: Emission): Promise<void> {
    const confirmDelete = confirm(
      `Are you sure you want to delete emission record for ${emission.country} (${emission.year})?`
    );

    if (!confirmDelete) return;

    const success = await this.store.deleteEmission(emission.id);

    if (success) {
      this.snackBar.open('Emission deleted successfully', 'Close', {
        duration: 3000,
      });
    } else {
      this.snackBar.open('Failed to delete emission', 'Close', {
        duration: 3000,
      });
    }
  }

  toggleFilters(): void {
    this.showFilters.update((current) => !current);
  }

  async clearFilters(): Promise<void> {
    await this.store.resetFilters();
  }

  createNew(): void {
    this.router.navigate(['/create']);
  }
}
