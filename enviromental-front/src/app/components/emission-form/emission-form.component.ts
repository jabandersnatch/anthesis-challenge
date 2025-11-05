import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';

import { EmissionsStore } from '../../store/emissions.store';
import { EmissionType, Activity } from '../../models/emission.model';

/**
 * Emission Form Component
 * Handles creation and editing of emission records
 */
@Component({
  selector: 'app-emission-form',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  templateUrl: './emission-form.component.html',
  styleUrl: './emission-form.component.css',
})
export class EmissionFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly store = inject(EmissionsStore);
  private readonly snackBar = inject(MatSnackBar);

  readonly emissionForm: FormGroup;
  readonly emissionTypes = Object.values(EmissionType);
  readonly activities = Object.values(Activity);
  readonly currentYear = new Date().getFullYear();

  readonly isEditMode = signal(false);
  readonly emissionId = signal<number | null>(null);
  readonly loading = this.store.loading;

  constructor() {
    this.emissionForm = this.fb.group({
      year: [
        this.currentYear,
        [Validators.required, Validators.min(1900), Validators.max(this.currentYear + 10)],
      ],
      country: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(2)]],
      emissions: [0, [Validators.required, Validators.min(0)]],
      emission_type: [EmissionType.CO2, Validators.required],
      activity: [Activity.ENERGY, Validators.required],
    });
  }

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');

    if (id) {
      this.isEditMode.set(true);
      this.emissionId.set(Number(id));
      await this.loadEmission(Number(id));
    }
  }

  private async loadEmission(id: number): Promise<void> {
    await this.store.loadEmissionById(id);
    const emission = this.store.selectedEmission();

    if (emission) {
      this.emissionForm.patchValue({
        year: emission.year,
        country: emission.country,
        emissions: emission.emissions,
        emission_type: emission.emission_type,
        activity: emission.activity,
      });
    }
  }

  async onSubmit(): Promise<void> {
    if (this.emissionForm.invalid) {
      this.emissionForm.markAllAsTouched();
      return;
    }

    const formValue = this.emissionForm.value;
    // Ensure country is uppercase
    formValue.country = formValue.country.toUpperCase();

    if (this.isEditMode()) {
      await this.updateEmission(formValue);
    } else {
      await this.createEmission(formValue);
    }
  }

  private async createEmission(data: any): Promise<void> {
    const result = await this.store.createEmission(data);

    if (result) {
      this.snackBar.open('Emission created successfully', 'Close', {
        duration: 3000,
      });
      this.router.navigate(['/list']);
    } else {
      this.snackBar.open('Failed to create emission', 'Close', {
        duration: 3000,
      });
    }
  }

  private async updateEmission(data: any): Promise<void> {
    const id = this.emissionId();
    if (!id) return;

    const result = await this.store.updateEmission(id, data);

    if (result) {
      this.snackBar.open('Emission updated successfully', 'Close', {
        duration: 3000,
      });
      this.router.navigate(['/list']);
    } else {
      this.snackBar.open('Failed to update emission', 'Close', {
        duration: 3000,
      });
    }
  }

  cancel(): void {
    this.router.navigate(['/list']);
  }

  getErrorMessage(field: string): string {
    const control = this.emissionForm.get(field);
    if (!control) return '';

    if (control.hasError('required')) {
      return 'This field is required';
    }
    if (control.hasError('min')) {
      return `Minimum value is ${control.errors?.['min'].min}`;
    }
    if (control.hasError('max')) {
      return `Maximum value is ${control.errors?.['max'].max}`;
    }
    if (control.hasError('minlength')) {
      return `Minimum length is ${control.errors?.['minlength'].requiredLength}`;
    }
    if (control.hasError('maxlength')) {
      return `Maximum length is ${control.errors?.['maxlength'].requiredLength}`;
    }

    return '';
  }
}
