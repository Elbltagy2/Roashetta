# Roashetta - Medical Clinic Management System

## Project Overview

**Roashetta** is a fullstack medical clinic management system designed for Egyptian healthcare providers. It supports patient management, visit tracking, prescription writing with digital canvas, lab results, queue management, analytics, and real-time notifications.

**Primary Deployment**: Desktop application (Windows/Mac/Linux executables)
**Alternative Deployment**: Web-based (Vercel frontend + separate backend)

## Technology Stack

### Frontend
- **Framework**: React 18.3.1 with TypeScript 5.8.3
- **Build Tool**: Vite 5.4.19
- **Routing**: React Router DOM 6.30.1
- **Styling**: Tailwind CSS 3.4.17 + Shadcn UI (48+ components)
- **State Management**: React Context API + TanStack Query 5.83.0
- **Forms**: React Hook Form 7.61.1 + Zod 3.25.76
- **Real-time**: Socket.IO Client 4.8.3
- **PDF Generation**: html2pdf.js, html2canvas
- **Charts**: Recharts 2.15.4
- **Notifications**: Sonner 1.7.4
- **Icons**: Lucide React 0.462.0
- **i18n**: Custom solution (Arabic/English with RTL support)

### Backend
- **Runtime**: Node.js with TypeScript 5.3.2
- **Framework**: Express 4.18.2
- **Database**: SQLite via sql.js 1.10.0 (embedded)
- **Real-time**: Socket.IO 4.8.3
- **Authentication**: JWT (jsonwebtoken 9.0.2) + bcryptjs 2.4.3
- **Deployment**: pkg 5.8.1 (Node.js to executable)

## Project Structure

```
/Roashetta/
├── src/                          # Frontend React application
│   ├── components/               # React components
│   │   ├── ui/                   # Shadcn UI components (48 files)
│   │   ├── layout/               # Layout components
│   │   ├── patients/             # Patient-related components
│   │   ├── visit/                # Visit components
│   │   ├── dashboard/            # Dashboard components
│   │   └── notifications/        # Notification components
│   ├── pages/                    # Page components (15 pages)
│   ├── contexts/                 # React Context providers (4 contexts)
│   │   ├── AuthContext.tsx       # Authentication & user state
│   │   ├── DataContext.tsx       # Patient/Visit/Expense data (766 lines)
│   │   ├── LanguageContext.tsx   # Bilingual i18n
│   │   └── NotificationContext.tsx # Real-time notifications
│   ├── services/                 # API & Socket services
│   │   ├── api.ts                # API client (744 lines)
│   │   ├── mockApi.ts            # Mock API for demo mode
│   │   └── socket.ts             # Socket.IO client
│   ├── lib/                      # Utilities & helpers
│   │   ├── utils.ts              # General utilities
│   │   ├── download-pdf.ts       # PDF generation
│   │   ├── pdf-to-images.ts      # PDF preview
│   │   └── drawing-utils.ts      # Canvas helpers
│   ├── data/                     # Static data (lab tests, medical data)
│   ├── types/                    # TypeScript type definitions
│   └── hooks/                    # Custom React hooks
│
├── backend/                      # Backend Node.js server
│   ├── src/
│   │   ├── domain/               # Domain layer (Clean Architecture)
│   │   │   ├── entities/         # Domain entities (13 files)
│   │   │   └── repositories/     # Repository interfaces
│   │   ├── application/          # Application layer
│   │   │   ├── use-cases/        # Business logic use cases
│   │   │   └── services/         # Application services
│   │   ├── infrastructure/       # Infrastructure layer
│   │   │   ├── database/         # SQLite database (501 lines config)
│   │   │   ├── repositories/     # Repository implementations
│   │   │   └── socket/           # Socket.IO server
│   │   ├── presentation/         # Presentation layer
│   │   │   ├── controllers/      # Request handlers (14 controllers)
│   │   │   ├── routes/           # API route definitions
│   │   │   └── middleware/       # Express middleware
│   │   ├── utils/                # Utilities (license validation)
│   │   └── index.ts              # Server entry point (204 lines)
│   ├── public/                   # Frontend build (for executable)
│   └── release/                  # Built executables
│
├── dist/                         # Frontend build output
├── package.json                  # Frontend dependencies
├── vite.config.ts                # Vite configuration
├── tailwind.config.ts            # Tailwind configuration
└── components.json               # Shadcn UI configuration
```

## Architecture Patterns

### Frontend Architecture
- **Component-based architecture** with functional components
- **Context + Hooks pattern** for global state management
- **Compound component pattern** for Shadcn UI components
- **Unidirectional data flow** (top-down)
- **Feature-based organization** (patients/, visit/, dashboard/)
- **Container/Presentational pattern** separation

**State Management:**
- **Global State**: React Context API (Auth, Data, Language, Notification)
- **Server State**: TanStack Query for caching
- **Local State**: useState, useReducer

**Data Flow:**
```
User Action → Event Handler → API Call → Backend
                                          ↓
                                     Database Update
                                          ↓
                                     Socket.IO Emit
                                          ↓
Frontend Socket Listener → Context Update → Component Re-render
```

### Backend Architecture
**Clean Architecture / Onion Architecture:**
```
Domain Layer (entities, interfaces)
    ↓
Application Layer (use cases, business logic)
    ↓
Infrastructure Layer (database, socket, external services)
    ↓
Presentation Layer (controllers, routes, middleware)
```

**Design Patterns:**
- Repository Pattern (abstraction over database)
- Dependency Injection (manual, no framework)
- Use Case Pattern (dedicated use cases per feature)
- DTO Pattern (data transformation between layers)
- Middleware Pattern (Express middleware chain)
- Singleton Pattern (database connection)

## Key Features & Pages

### Authentication
- **LoginPage** (`/login`) - Email/password with JWT
- **SignupPage** (`/signup`) - Doctor registration

### Core Pages
1. **DashboardPage** (`/dashboard`) - Statistics, recent patients, quick actions
2. **PatientsPage** (`/patients`) - Patient list with search
3. **NewPatientPage** (`/patients/new`) - Patient registration form
4. **PatientDetailPage** (`/patients/:id`) - Patient info, visits, records
5. **NewVisitPage** (`/patients/:id/visit/new`) - Visit creation with canvas drawings
6. **VisitDetailPage** (`/patients/:id/visit/:visitId`) - View/edit visit
7. **QueuePage** (`/queue`) - Daily patient queue with drag-and-drop
8. **AnalyticsPage** (`/analytics`) - Revenue, visits, expenses analytics
9. **ExpensesPage** (`/expenses`) - Expense tracking by category
10. **AssistantsPage** (`/assistants`) - Doctor-only, manage assistant accounts
11. **SettingsPage** (`/settings`) - User profile, clinic settings, pricing

### Unique Features

**Drawing Canvas System:**
- Multiple canvas pages for prescriptions (3 pages), radiology requests (3 pages), medical history (5 sections)
- Features: Undo/Redo, Text mode toggle, Clear canvas
- Egyptian-style prescription pad design
- Download/Print individual pages as PDF
- Base64 data URL storage in database

**Real-time Patient Queue:**
- Socket.IO powered real-time updates
- Drag-and-drop reordering
- Status workflow: Waiting → In Progress → Done
- Set current patient (broadcasts to all users)

**Lab Test Management:**
- Interactive checklist with categories (CBC, Sugar, Liver, Kidney, Lipid, Thyroid, Urine)
- Store results with reference ranges
- Flag abnormal results
- Historical tracking

**Real-time Notifications:**
- New visit created, patient updated, current patient changed
- Toast notifications + notification center
- Mark as read/delete (individual/all)

## Naming Conventions

### Files
- **Components**: PascalCase (e.g., `PatientCard.tsx`, `DashboardLayout.tsx`)
- **Utilities**: kebab-case (e.g., `download-pdf.ts`, `drawing-utils.ts`)
- **Pages**: PascalCase with "Page" suffix (e.g., `DashboardPage.tsx`)
- **Contexts**: PascalCase with "Context" suffix (e.g., `AuthContext.tsx`)
- **Backend Entities**: PascalCase (e.g., `Patient.ts`, `Visit.ts`)
- **Backend Controllers**: PascalCase with "Controller" suffix
- **Backend Routes**: camelCase with "Routes" suffix (e.g., `patientRoutes.ts`)

### Code
- **Variables/Functions**: camelCase
- **Components/Classes**: PascalCase
- **Constants**: SCREAMING_SNAKE_CASE (e.g., `LICENSE_SECRET`)
- **Database Columns**: snake_case (e.g., `created_at`, `doctor_id`)
- **Database Tables**: Plural (e.g., `patients`, `visits`)

## Code Conventions

### TypeScript
- Strict mode disabled (`"strict": false`)
- Path aliases: `@/*` → `./src/*` (frontend), layer aliases (backend)
- No implicit any allowed
- Functional components only (no class components)

### Styling
- Tailwind utility classes (no CSS modules)
- CSS variables for theming: `hsl(var(--primary))`
- Responsive design with Tailwind breakpoints
- RTL support with `dir` attribute on `<html>`

### API
- RESTful resource naming (plural: `/api/patients`, `/api/visits`)
- HTTP verbs for CRUD: GET, POST, PUT, DELETE
- JWT in Authorization header: `Bearer <token>`
- Standard error response format

### Database
- UUIDs for primary keys (via `uuid` package)
- Foreign key constraints enforced
- Hard delete (no soft delete)
- Timestamps: `created_at`, `updated_at`
- Boolean as INTEGER (0/1) for SQLite compatibility

## Authentication & Authorization

**JWT Authentication:**
- Token stored in localStorage
- Token sent in `Authorization: Bearer <token>` header
- Token contains: userId, email, role, doctorId
- Socket.IO authenticated with same token

**Role-Based Access Control (RBAC):**
- **Roles**: `doctor` | `assistant`
- **Doctor**: Full access to all features
- **Assistant**: Configurable granular permissions:
  - `canCreatePatient`, `canEditPatient`, `canDeletePatient`
  - `canCreateVisit`, `canEditVisit`, `canDeleteVisit`
  - `canViewPrescription`, `canCreatePrescription`
  - `canManageRecords`

**Permission Checking Pattern:**
```typescript
// In AuthContext
hasPermission(permission: keyof AssistantPermissions): boolean {
  if (user?.role === 'doctor') return true; // Doctors have all permissions
  return user?.permissions?.[permission] ?? false;
}
```

## Real-time Communication

**Socket.IO Events:**
- **Server Emits**:
  - `visitCreated` - New visit added
  - `patientUpdated` - Patient info changed
  - `currentPatientChanged` - Current patient set
  - `queueUpdated` - Queue order/status changed
  - `notificationSent` - New notification for user

- **Client Emits**:
  - `joinRoom` - Join user's personal notification room

**Event Flow:**
```
Action → API Call → Database Update → Socket Emit (to specific doctorId)
                                          ↓
                              Listening Clients → State Update → UI Re-render
```

## Internationalization (i18n)

**Custom i18n Solution** (not using i18next):
- **LanguageContext** provides `t(key)` function and `language` state
- **Languages**: English (`en`), Arabic (`ar`)
- **RTL Support**: Automatic `dir="rtl"` on `<html>` for Arabic
- **Storage**: Language preference in localStorage
- **Cairo Font**: @fontsource/cairo for Arabic text

**Usage Example:**
```typescript
const { t, language, changeLanguage } = useLanguage();
return <h1>{t('dashboard')}</h1>;
```

## Deployment Models

### Model 1: Standalone Desktop App (Primary)
1. Build frontend: `npm run build`
2. Copy `dist/` to `backend/public/`
3. Build backend executable: `cd backend && npm run build:exe:win`
4. Distribute 4 files:
   - `RoashettaServer.exe` (or .bin/.app)
   - `sql-wasm.wasm` (SQLite WebAssembly)
   - `.env` (configuration)
   - `start.bat` (launcher)

**Features:**
- Single executable runs both server + frontend
- Embedded SQLite database (roashetta.db)
- No internet required
- Cross-platform (Windows, Mac, Linux)

### Model 2: Web Deployment (Demo)
- **Frontend**: Deployed to Vercel (SPA)
- **Backend**: Separate deployment (not included in Vercel)
- **Demo Mode**: `VITE_DEMO_MODE=true` uses mock API (no backend)

**Environment Variables:**
- `VITE_API_URL`: Backend API URL (default: `http://localhost:3000/api`)
- `VITE_DEMO_MODE`: Use mock API instead of real backend
- `PORT`: Backend server port (default: 3000)
- `JWT_SECRET`: JWT signing secret
- `LICENSE_SECRET`: License key validation secret

## Database Schema

**SQLite Database** (sql.js with auto-save):
- **Tables**: patients, visits, expenses, assistants, doctors, lab_results, notifications, queue, settings, patient_records, previous_investigations, visit_attachments
- **Auto-save**: Every 5 seconds if changes exist
- **Storage**: File-based (`roashetta.db`) + in-memory cache
- **Foreign Keys**: Enforced with `PRAGMA foreign_keys = ON`

**Key Entity Relationships:**
```
Doctor (1) ─── (N) Patient
Patient (1) ─── (N) Visit
Patient (1) ─── (N) PatientRecord
Visit (1) ─── (N) LabResult
Visit (1) ─── (N) VisitAttachment
Doctor (1) ─── (N) Assistant
Doctor (1) ─── (N) QueueEntry
Doctor (1) ─── (N) Expense
Doctor (1) ─── (N) Notification
```

## License System

**Commercial License Key:**
- **Format**: `BASE64(clinicName|expiryDate|maxDoctors|signature)`
- **Display**: `XXXX-XXXX-XXXX-XXXX` (chunked for readability)
- **Signature**: HMAC-SHA256 (first 16 chars)
- **Validation**: On server startup and in login flow
- **Enforcement**: Blocks login if expired or invalid

**Location**: `backend/src/utils/license.ts`

## PDF Generation

**HTML → Canvas → PDF Pipeline:**
1. Render HTML content (prescription pad template)
2. Convert to canvas with `html2canvas`
3. Generate PDF with `html2pdf.js`
4. Download or open in new tab (iOS compatibility)

**Egyptian Prescription Pad Design:**
- Header with clinic name and logo
- Patient information section
- Prescription content (from canvas)
- Footer with doctor signature
- Multi-page support (3 pages)

**Usage:**
```typescript
import { downloadPdf } from '@/lib/download-pdf';
await downloadPdf(elementRef.current, 'prescription.pdf');
```

## Testing

**Current Status**: No tests implemented
**Recommended**:
- Vitest for frontend unit tests
- React Testing Library for component tests
- Supertest for backend API tests
- Playwright for E2E tests

## Security Considerations

**Implemented:**
- ✅ JWT authentication with bcrypt password hashing
- ✅ Role-based access control (RBAC)
- ✅ SQL injection prevention (prepared statements)
- ✅ CORS configuration

**Missing/Recommended:**
- ⚠️ Rate limiting on API endpoints
- ⚠️ HTTPS enforcement in production
- ⚠️ XSS protection headers (Helmet.js)
- ⚠️ CSRF protection for state-changing operations
- ⚠️ Input sanitization/validation on backend
- ⚠️ Environment-based secrets (LICENSE_SECRET hardcoded)

## Common Tasks

### Add a New Page
1. Create page component in `src/pages/NewPage.tsx`
2. Add route in `src/App.tsx`:
   ```typescript
   <Route path="/new-page" element={<ProtectedRoute><NewPage /></ProtectedRoute>} />
   ```
3. Add navigation link in sidebar (if needed)
4. Add translations in `LanguageContext.tsx`

### Add a New API Endpoint
1. Create entity in `backend/src/domain/entities/`
2. Create use case in `backend/src/application/use-cases/`
3. Create controller in `backend/src/presentation/controllers/`
4. Create route in `backend/src/presentation/routes/`
5. Register route in `backend/src/presentation/routes/index.ts`
6. Update database schema in `backend/src/infrastructure/database/config.ts`
7. Add API call in frontend `src/services/api.ts`
8. Update `DataContext.tsx` if needed

### Add a New Shadcn Component
```bash
npx shadcn@latest add [component-name]
```
Component will be added to `src/components/ui/`

### Build Desktop Executable
```bash
# Windows
cd backend && npm run build:exe:win

# Mac
cd backend && npm run build:exe:mac

# Linux
cd backend && npm run build:exe:linux
```

## Performance Considerations

**Frontend:**
- Use React.memo for expensive components
- Lazy load pages with React.lazy + Suspense
- TanStack Query caching reduces API calls
- Debounce search inputs

**Backend:**
- SQLite auto-save every 5 seconds (not on every write)
- Prepared SQL statements for query performance
- Socket.IO rooms for targeted broadcasts
- Connection pooling not needed (embedded database)

## Known Limitations

1. **iOS PDF Download**: Uses `window.open()` instead of download (iOS restriction)
2. **Canvas Requirement**: Prescription requires canvas support (modern browsers only)
3. **Single Database File**: No distributed database support
4. **No Cloud Sync**: Desktop app databases are local-only
5. **No Backup System**: Manual database file backup required
6. **License Key**: Hardcoded secret (should be environment variable)

## Default Credentials

**Doctor Account** (auto-created on first run):
- Email: `doctor@clinic.com`
- Password: `doctor123`
- Role: Doctor

**Note**: Change password immediately after first login in production.

## Useful Commands

### Frontend
```bash
npm run dev              # Start Vite dev server (port 8080)
npm run build            # Production build
npm run build:dev        # Development build
npm run build:demo       # Demo mode build (mock API)
npm run preview          # Preview production build
```

### Backend
```bash
npm run dev              # Start backend with ts-node-dev (auto-reload)
npm run build            # Compile TypeScript to JavaScript
npm start                # Run compiled JavaScript
npm run build:exe:win    # Build Windows executable
npm run build:exe:mac    # Build macOS executable
npm run build:exe:linux  # Build Linux executable
```

## Additional Resources

- **README.md**: Comprehensive setup and deployment guide (350 lines)
- **Git Repository**: Current branch `main`
- **Recent Commits**: Focus on performance enhancements and demo version
- **Package Managers**: npm (no yarn.lock or pnpm-lock.yaml)

## Support & Contribution

**For Issues/Bugs**: No issue tracker configured
**For Questions**: No documentation site or wiki
**Contribution Guidelines**: Not documented

---

**Last Updated**: 2026-03-03
**Project Version**: Active development
**Target Users**: Egyptian medical clinics and healthcare providers
