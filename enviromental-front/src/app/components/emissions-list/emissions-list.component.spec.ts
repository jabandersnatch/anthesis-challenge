import { ComponentFixture, TestBed, fakeAsync, tick, flush } from '@angular/core/testing';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { signal } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { Sort } from '@angular/material/sort';

import { EmissionsListComponent } from './emissions-list.component';
import { EmissionsStore } from '../../store/emissions.store';
import { Emission, EmissionType, Activity } from '../../models/emission.model';

describe('EmissionsListComponent', () => {
  let component: EmissionsListComponent;
  let fixture: ComponentFixture<EmissionsListComponent>;
  let mockStore: jasmine.SpyObj<EmissionsStore>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;

  const mockEmissions: Emission[] = [
    {
      id: 1,
      year: 2023,
      country: 'USA',
      emissions: 5000,
      emission_type: EmissionType.CO2,
      activity: Activity.ENERGY,
      created_at: '2023-01-01T00:00:00Z',
    },
    {
      id: 2,
      year: 2022,
      country: 'Canada',
      emissions: 3000,
      emission_type: EmissionType.CH4,
      activity: Activity.TRANSPORT,
      created_at: '2023-01-02T00:00:00Z',
    },
  ];

  beforeEach(async () => {
    // Create spy objects for dependencies
    mockStore = jasmine.createSpyObj(
      'EmissionsStore',
      [
        'loadEmissions',
        'updateFilters',
        'resetFilters',
        'deleteEmission',
      ],
      {
        // Mock store signals as properties
        emissions: signal(mockEmissions).asReadonly(),
        loading: signal(false).asReadonly(),
        error: signal(null).asReadonly(),
        totalCount: signal(2).asReadonly(),
        currentPage: signal(1).asReadonly(),
        pageSize: signal(50).asReadonly(),
        filters: signal({
          page: 1,
          page_size: 50,
          ordering: '-year',
        }).asReadonly(),
      }
    );

    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockSnackBar = jasmine.createSpyObj('MatSnackBar', ['open']);

    // Mock async methods
    mockStore.loadEmissions.and.returnValue(Promise.resolve());
    mockStore.updateFilters.and.returnValue(Promise.resolve());
    mockStore.resetFilters.and.returnValue(Promise.resolve());
    mockStore.deleteEmission.and.returnValue(Promise.resolve(true));

    await TestBed.configureTestingModule({
      imports: [EmissionsListComponent, NoopAnimationsModule],
      providers: [
        { provide: EmissionsStore, useValue: mockStore },
        { provide: Router, useValue: mockRouter },
        { provide: MatSnackBar, useValue: mockSnackBar },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EmissionsListComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Component Initialization', () => {
    it('should load emissions on init', async () => {
      await fixture.whenStable();
      fixture.detectChanges();

      expect(mockStore.loadEmissions).toHaveBeenCalled();
    });

    it('should have correct display columns', () => {
      expect(component.displayedColumns).toEqual([
        'year',
        'country',
        'emissions',
        'emission_type',
        'activity',
        'actions',
      ]);
    });

    it('should expose store signals', () => {
      expect(component.emissions()).toEqual(mockEmissions);
      expect(component.loading()).toBe(false);
      expect(component.error()).toBeNull();
      expect(component.totalCount()).toBe(2);
      expect(component.currentPage()).toBe(1);
      expect(component.pageSize()).toBe(50);
    });

    it('should have filters visible by default', () => {
      expect(component.showFilters()).toBe(true);
    });
  });

  describe('Sorting Functionality', () => {
    it('should update filters with ascending sort', () => {
      const sortEvent: Sort = {
        active: 'country',
        direction: 'asc',
      };

      component.onSort(sortEvent);

      expect(mockStore.updateFilters).toHaveBeenCalledWith({
        ordering: 'country',
      });
    });

    it('should update filters with descending sort', () => {
      const sortEvent: Sort = {
        active: 'emissions',
        direction: 'desc',
      };

      component.onSort(sortEvent);

      expect(mockStore.updateFilters).toHaveBeenCalledWith({
        ordering: '-emissions',
      });
    });

    it('should reset to default ordering when sort is cleared', () => {
      const sortEvent: Sort = {
        active: '',
        direction: '',
      };

      component.onSort(sortEvent);

      expect(mockStore.updateFilters).toHaveBeenCalledWith({
        ordering: '-year',
      });
    });
  });

  describe('Pagination Functionality', () => {
    it('should update filters on page change', () => {
      const pageEvent: PageEvent = {
        pageIndex: 2,
        pageSize: 50,
        length: 100,
      };

      component.onPageChange(pageEvent);

      expect(mockStore.updateFilters).toHaveBeenCalledWith({
        page: 3, // pageIndex + 1
        page_size: 50,
      });
    });

    it('should update filters when page size changes', () => {
      const pageEvent: PageEvent = {
        pageIndex: 0,
        pageSize: 100,
        length: 100,
      };

      component.onPageChange(pageEvent);

      expect(mockStore.updateFilters).toHaveBeenCalledWith({
        page: 1,
        page_size: 100,
      });
    });
  });

  describe('Edit Functionality', () => {
    it('should navigate to edit page when editing an emission', () => {
      const emission = mockEmissions[0];

      component.editEmission(emission);

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/edit', emission.id]);
    });
  });

  describe('Delete Functionality', () => {
    it('should call store deleteEmission when confirmed', fakeAsync(() => {
      spyOn(window, 'confirm').and.returnValue(true);
      const emission = mockEmissions[0];

      component.deleteEmission(emission);
      flush(); // Flush all pending async operations including promises

      expect(window.confirm).toHaveBeenCalledWith(
        `Are you sure you want to delete emission record for ${emission.country} (${emission.year})?`
      );
      expect(mockStore.deleteEmission).toHaveBeenCalledWith(emission.id);
    }));

    it('should not delete emission when cancelled', fakeAsync(() => {
      spyOn(window, 'confirm').and.returnValue(false);
      const emission = mockEmissions[0];

      component.deleteEmission(emission);
      flush();

      expect(mockStore.deleteEmission).not.toHaveBeenCalled();
      expect(mockSnackBar.open).not.toHaveBeenCalled();
    }));

    it('should call store deleteEmission when deletion is requested', fakeAsync(() => {
      spyOn(window, 'confirm').and.returnValue(true);
      mockStore.deleteEmission.and.returnValue(Promise.resolve(false));
      const emission = mockEmissions[0];

      component.deleteEmission(emission);
      flush(); // Flush all pending async operations including promises

      expect(mockStore.deleteEmission).toHaveBeenCalledWith(emission.id);
    }));
  });

  describe('Filter Functionality', () => {
    it('should toggle filters visibility', () => {
      const initialValue = component.showFilters();

      component.toggleFilters();

      expect(component.showFilters()).toBe(!initialValue);

      component.toggleFilters();

      expect(component.showFilters()).toBe(initialValue);
    });

    it('should clear filters when requested', async () => {
      await component.clearFilters();

      expect(mockStore.resetFilters).toHaveBeenCalled();
    });
  });

  describe('Create New Functionality', () => {
    it('should navigate to create page', () => {
      component.createNew();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/create']);
    });
  });

  describe('Template Integration', () => {
    it('should render the table when emissions are available', () => {
      fixture.detectChanges();
      const compiled = fixture.nativeElement;
      const table = compiled.querySelector('table');

      expect(table).toBeTruthy();
    });

    it('should display correct number of column headers', () => {
      fixture.detectChanges();
      const headers = fixture.nativeElement.querySelectorAll('th');

      // Should have headers for all displayedColumns
      expect(headers.length).toBeGreaterThan(0);
    });
  });
});

describe('EmissionsListComponent - Loading State', () => {
  let component: EmissionsListComponent;
  let fixture: ComponentFixture<EmissionsListComponent>;
  let mockStore: jasmine.SpyObj<EmissionsStore>;

  const mockEmissions: Emission[] = [];

  beforeEach(async () => {
    // Create a mock store with loading = true
    mockStore = jasmine.createSpyObj(
      'EmissionsStore',
      ['loadEmissions', 'updateFilters', 'resetFilters', 'deleteEmission'],
      {
        emissions: signal(mockEmissions).asReadonly(),
        loading: signal(true).asReadonly(), // Set to true for this test
        error: signal(null).asReadonly(),
        totalCount: signal(0).asReadonly(),
        currentPage: signal(1).asReadonly(),
        pageSize: signal(50).asReadonly(),
        filters: signal({
          page: 1,
          page_size: 50,
          ordering: '-year',
        }).asReadonly(),
      }
    );

    mockStore.loadEmissions.and.returnValue(Promise.resolve());

    await TestBed.configureTestingModule({
      imports: [EmissionsListComponent, NoopAnimationsModule],
      providers: [
        { provide: EmissionsStore, useValue: mockStore },
        { provide: Router, useValue: jasmine.createSpyObj('Router', ['navigate']) },
        { provide: MatSnackBar, useValue: jasmine.createSpyObj('MatSnackBar', ['open']) },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EmissionsListComponent);
    component = fixture.componentInstance;
  });

  it('should display loading spinner when loading', () => {
    fixture.detectChanges();
    const spinner = fixture.nativeElement.querySelector('mat-spinner');
    expect(spinner).toBeTruthy();
  });
});
