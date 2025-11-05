# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**enviromental-front** is an Angular 20.3 application with Server-Side Rendering (SSR) support using Angular Universal. The project uses standalone components (no NgModules), signals for state management, and Express.js for the SSR server.

## Development Commands

### Start Development Server
```bash
ng serve
# or
npm start
```
Runs on `http://localhost:4200/` with hot reload enabled.

### Build
```bash
ng build                                    # Production build
ng build --configuration development        # Development build
npm run watch                               # Watch mode for development
```
Outputs to `dist/` directory. The build includes both browser and server bundles due to SSR configuration.

### Run SSR Server
```bash
npm run serve:ssr:enviromental-front
```
Runs the built SSR application on `http://localhost:4000` (or port specified by `PORT` env variable).

### Testing
```bash
ng test           # Run all tests with Karma
npm test          # Same as above
```
Tests use Jasmine and Karma with Chrome launcher.

### Code Generation
```bash
ng generate component component-name    # Generate new component
ng generate --help                      # See all available schematics
```

## Architecture

### Application Structure

This is a minimal Angular 20 application using modern Angular features:

- **Standalone Components**: No NgModules - all components use `imports` array directly
- **Signal-based State**: Uses Angular signals (`signal()`) instead of traditional observables for simple state
- **SSR/Hydration**: Full server-side rendering with client hydration and event replay enabled
- **File-based Routing**: Routes defined in `src/app/app.routes.ts`

### Key Files

- **src/app/app.ts**: Root component using `@Component` decorator with standalone configuration
- **src/app/app.config.ts**: Browser application configuration with providers for router, hydration, and error listeners
- **src/app/app.config.server.ts**: Server-specific configuration extending browser config
- **src/app/app.routes.ts**: Client-side route definitions (currently empty)
- **src/app/app.routes.server.ts**: Server-side route definitions
- **src/main.ts**: Browser application bootstrap
- **src/main.server.ts**: Server application bootstrap
- **src/server.ts**: Express server setup with Angular SSR engine

### SSR Architecture

The application uses Angular's `@angular/ssr/node` package:

1. **AngularNodeAppEngine**: Handles SSR rendering of Angular components
2. **Express Integration**: Static files served from `/browser`, all other requests handled by Angular
3. **API Endpoints**: Express middleware can be added before Angular handler for REST APIs
4. **Dual Output**: Build produces both browser bundle and server bundle

The server configuration in `angular.json` specifies:
- `outputMode: "server"` - enables SSR build
- `server: "src/main.server.ts"` - server entry point
- `ssr.entry: "src/server.ts"` - Express server file

### TypeScript Configuration

Project uses **strict mode** with additional safety checks:
- `strict: true`
- `noImplicitOverride: true`
- `noPropertyAccessFromIndexSignature: true`
- `noImplicitReturns: true`
- `noFallthroughCasesInSwitch: true`
- `strictTemplates: true` (Angular templates)

Target: ES2022 with module preservation for optimal Angular performance.

### Code Style

Prettier configuration in package.json:
- Print width: 100 characters
- Single quotes
- Angular parser for HTML templates

## Development Notes

- The project prefix is `app` (used for component selectors)
- Global styles in `src/styles.css`
- Public assets go in `public/` directory
- SSR server defaults to port 4000, dev server to port 4200
- Analytics disabled in Angular CLI configuration

## Emissions Tracking Application

### Overview

This application is a comprehensive Single Page Application (SPA) for managing and visualizing greenhouse gas emissions data. It connects to a Django REST API backend and provides full CRUD operations with advanced filtering, search, pagination, and data visualization.

### Technology Stack

- **Frontend**: Angular 20.3 with standalone components
- **UI Framework**: Angular Material 20.x
- **Charts**: Chart.js via ng2-charts for bar and line charts
- **State Management**: Signal-based store (no NgRx)
- **HTTP Client**: Angular HttpClient with fetch API
- **Backend API**: Django REST Framework at `http://localhost:8000/api`

### Application Structure

```
src/app/
├── components/
│   ├── dashboard/              # Main dashboard with stats and bar chart
│   ├── emissions-list/         # Data table with filtering and pagination
│   ├── filter-panel/           # Reusable filter controls
│   ├── emission-form/          # Create/Edit form for emissions
│   ├── globe-dashboard/        # Country selector with line charts
│   └── charts/
│       ├── bar-chart/          # Bar chart visualization
│       └── line-chart/         # Time series line chart
├── services/
│   └── emissions.service.ts    # API communication layer
├── store/
│   └── emissions.store.ts      # Signal-based state management
├── models/
│   └── emission.model.ts       # TypeScript interfaces and types
└── environments/               # Environment configurations
```

### Routes

- `/dashboard` - Overview with statistics and bar chart
- `/list` - Full data table with filtering, sorting, pagination
- `/create` - Create new emission record
- `/edit/:id` - Edit existing emission record
- `/globe` - Country selector with time series visualization

### Data Model

```typescript
interface Emission {
  id: number;
  year: number;
  emissions: number;
  country: string;  // 2-letter ISO code
  emission_type: 'CO2' | 'CH4' | 'N2O' | 'F_GASES';
  activity: 'ENERGY' | 'TRANSPORT' | 'AGRICULTURE' | 'INDUSTRIAL' | 'WASTE' | 'OTHER';
  created_at: string;
}
```

### State Management Pattern

The application uses a **signal-based store** pattern (`EmissionsStore`) instead of NgRx:

- **Signals**: Reactive state containers using Angular signals
- **Computed Signals**: Derived state (filtered data, aggregations)
- **Async Methods**: Promise-based for API calls
- **No Observables**: Service returns Observables, but store uses async/await

Example usage:
```typescript
// In component
private readonly store = inject(EmissionsStore);
readonly emissions = this.store.emissions;  // Signal
readonly loading = this.store.loading;      // Signal

// Load data
await this.store.loadEmissions();

// Update filters
await this.store.updateFilters({ year__gte: 2020, country: 'US' });
```

### API Integration

The `EmissionsService` handles all backend communication:

**Endpoints**:
- `GET /api/emissions/` - List with filters, pagination, ordering
- `POST /api/emissions/` - Create new record
- `GET /api/emissions/{id}/` - Retrieve single record
- `PATCH /api/emissions/{id}/` - Partial update
- `PUT /api/emissions/{id}/` - Full update
- `DELETE /api/emissions/{id}/` - Delete record

**Query Parameters**:
- `year`, `year__gte`, `year__lte` - Year filtering
- `country`, `country__in` - Country filtering
- `emission_type`, `activity` - Type/sector filtering
- `search` - Text search (country, activity)
- `ordering` - Sort field (prefix `-` for descending)
- `page`, `page_size` - Pagination (max 100 per page)

### Visualization Components

#### Bar Chart Component
- Displays emissions by country, year, or type
- Top 10 items by default
- Color-coded bars
- Responsive canvas sizing
- SSR-safe (checks `isPlatformBrowser`)

#### Line Chart Component
- Time series visualization
- Multiple lines for emission types
- Country-specific or aggregate view
- Smooth bezier curves
- Interactive tooltips

### Filtering System

The `FilterPanelComponent` provides:
- **Text Search**: Search by country or activity
- **Year Filters**: Exact year, year range (from/to)
- **Country Filter**: 2-letter ISO code
- **Emission Type**: Dropdown for gas types
- **Activity Sector**: Dropdown for sectors
- **Quick Filters**: Preset filters (recent, high emissions, CO2 only)
- **Debounced**: 500ms debounce on input changes

### Forms and Validation

The `EmissionFormComponent` uses reactive forms with validation:
- **Year**: Required, 1900-2035 range
- **Country**: Required, exactly 2 characters, auto-uppercase
- **Emissions**: Required, positive number
- **Type/Activity**: Required, dropdown selection

Form state management:
- Edit mode detected via route param `:id`
- Pre-populates form in edit mode
- Shows validation errors on touch
- Disables submit when invalid or loading

### SSR Considerations

Chart components are SSR-safe:
- Check `isPlatformBrowser()` before Chart.js initialization
- Canvas elements only rendered on client
- No server-side Chart.js registration

### Error Handling

Multiple layers of error handling:
1. **Service Layer**: HTTP interceptor catches API errors
2. **Store Layer**: Wraps API calls in try/catch, sets error signal
3. **Component Layer**: Displays error messages via Material snackbars
4. **Template Layer**: Shows error cards when error signal is set

### Performance Optimizations

- **Lazy Loading**: Routes use dynamic imports
- **Debounced Filters**: 500ms debounce prevents excessive API calls
- **Server-Side Pagination**: Backend handles large datasets
- **OnPush Strategy**: Components use default strategy (can be optimized)
- **Signal-Based**: Fine-grained reactivity without zones

### Adding New Features

#### Add New Filter
1. Add field to `EmissionFilters` interface in `emission.model.ts`
2. Add form control in `FilterPanelComponent`
3. Include in `applyFilters()` method
4. Service automatically includes in query params

#### Add New Chart
1. Create component in `components/charts/`
2. Import Chart.js types and registerables
3. Implement SSR guards with `isPlatformBrowser`
4. Accept `@Input()` for data
5. Use in dashboard or globe view

#### Add New Route
1. Add route to `app.routes.ts` with lazy loading
2. Create component in `components/`
3. Add navigation link in app toolbar (`app.html`)
4. Component can inject `EmissionsStore` for data

### Common Patterns

**Component Injection**:
```typescript
private readonly store = inject(EmissionsStore);
private readonly router = inject(Router);
```

**Signal Reading**:
```typescript
readonly emissions = this.store.emissions;  // In class
{{ emissions().length }}                     // In template
```

**Async Operations**:
```typescript
async ngOnInit(): Promise<void> {
  await this.store.loadEmissions();
}
```

**Material Components**:
All Material components must be imported in component `imports` array:
```typescript
imports: [MatTableModule, MatButtonModule, ...]
```

### Troubleshooting

**Backend Not Running**:
- Ensure Django server is running on `http://localhost:8000`
- Check CORS settings allow requests from `http://localhost:4200`

**Chart Not Displaying**:
- Verify Chart.js is installed: `npm list chart.js`
- Check browser console for errors
- Ensure component is not SSR-rendered (add SSR guard)

**Filters Not Working**:
- Check Network tab for correct query parameters
- Verify backend API supports the filter
- Check form value in `FilterPanelComponent`

**Build Errors**:
- Run `npm install` to ensure all dependencies are installed
- Check for TypeScript errors: `ng build`
- Verify imports in standalone components
