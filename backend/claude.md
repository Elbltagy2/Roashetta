# Backend - Roashetta Medical Clinic Management System

## Overview

This is the backend server for Roashetta, built with Node.js, Express, TypeScript, and SQLite. It follows Clean Architecture principles with clear separation between domain, application, infrastructure, and presentation layers.

## Architecture

### Clean Architecture Layers

```
┌─────────────────────────────────────────┐
│     Presentation Layer (API)            │
│   Controllers, Routes, Middleware       │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│     Application Layer                   │
│   Use Cases, Business Logic             │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│     Infrastructure Layer                │
│   Database, Socket.IO, External APIs    │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│     Domain Layer (Core)                 │
│   Entities, Repository Interfaces       │
└─────────────────────────────────────────┘
```

**Dependency Rule**: Dependencies only point inward. Domain has no dependencies. Application depends on domain. Infrastructure and presentation depend on application and domain.

## Directory Structure

```
backend/
├── src/
│   ├── domain/                      # Core business entities (innermost layer)
│   │   ├── entities/                # Domain entities (13 files)
│   │   │   ├── Patient.ts           # Patient entity
│   │   │   ├── Visit.ts             # Visit entity
│   │   │   ├── Doctor.ts            # Doctor entity
│   │   │   ├── Assistant.ts         # Assistant entity
│   │   │   ├── Expense.ts           # Expense entity
│   │   │   ├── LabResult.ts         # Lab result entity
│   │   │   ├── Notification.ts      # Notification entity
│   │   │   ├── QueueEntry.ts        # Queue entry entity
│   │   │   ├── Settings.ts          # Settings entity
│   │   │   ├── PatientRecord.ts     # Patient record (file upload)
│   │   │   ├── PreviousInvestigation.ts  # Previous investigation
│   │   │   ├── VisitAttachment.ts   # Visit attachment
│   │   │   └── index.ts             # Barrel export
│   │   └── repositories/            # Repository interfaces (contracts)
│   │
│   ├── application/                 # Business logic layer
│   │   ├── use-cases/               # Use case implementations
│   │   │   ├── auth/                # Authentication use cases
│   │   │   │   ├── login.ts
│   │   │   │   ├── signup.ts
│   │   │   │   └── validateToken.ts
│   │   │   ├── patient/             # Patient use cases
│   │   │   │   ├── createPatient.ts
│   │   │   │   ├── updatePatient.ts
│   │   │   │   ├── deletePatient.ts
│   │   │   │   ├── getPatient.ts
│   │   │   │   └── getAllPatients.ts
│   │   │   ├── visit/               # Visit use cases
│   │   │   ├── expense/             # Expense use cases
│   │   │   ├── assistant/           # Assistant use cases
│   │   │   ├── lab-result/          # Lab result use cases
│   │   │   ├── patient-record/      # Patient record use cases
│   │   │   └── previous-investigation/  # Investigation use cases
│   │   └── services/                # Application services
│   │
│   ├── infrastructure/              # External concerns layer
│   │   ├── database/                # Database implementation
│   │   │   ├── config.ts            # SQLite setup, schema, migrations (501 lines)
│   │   │   └── migrations/          # (Empty - migrations in config.ts)
│   │   ├── repositories/            # Repository implementations
│   │   └── socket/                  # Socket.IO implementation
│   │       └── socketServer.ts      # WebSocket server setup
│   │
│   ├── presentation/                # API layer (outermost layer)
│   │   ├── controllers/             # Request handlers (14 controllers)
│   │   │   ├── AuthController.ts
│   │   │   ├── PatientController.ts
│   │   │   ├── VisitController.ts
│   │   │   ├── ExpenseController.ts
│   │   │   ├── AssistantController.ts
│   │   │   ├── LabResultController.ts
│   │   │   ├── NotificationController.ts
│   │   │   ├── QueueController.ts
│   │   │   ├── SettingsController.ts
│   │   │   ├── AnalyticsController.ts
│   │   │   ├── PatientRecordController.ts
│   │   │   ├── PreviousInvestigationController.ts
│   │   │   ├── VisitAttachmentController.ts
│   │   │   └── CurrentPatientController.ts
│   │   ├── routes/                  # Express route definitions (14 files)
│   │   │   ├── authRoutes.ts
│   │   │   ├── patientRoutes.ts
│   │   │   ├── visitRoutes.ts
│   │   │   ├── expenseRoutes.ts
│   │   │   ├── assistantRoutes.ts
│   │   │   ├── labResultRoutes.ts
│   │   │   ├── notificationRoutes.ts
│   │   │   ├── queueRoutes.ts
│   │   │   ├── settingsRoutes.ts
│   │   │   ├── analyticsRoutes.ts
│   │   │   ├── patientRecordRoutes.ts
│   │   │   ├── previousInvestigationRoutes.ts
│   │   │   ├── visitAttachmentRoutes.ts
│   │   │   ├── currentPatientRoutes.ts
│   │   │   └── index.ts             # Route aggregator
│   │   └── middleware/              # Express middleware
│   │       ├── authMiddleware.ts    # JWT authentication
│   │       └── errorHandler.ts      # Global error handling
│   │
│   ├── utils/                       # Utilities
│   │   └── license.ts               # License key validation
│   │
│   ├── types/                       # TypeScript type definitions
│   │
│   └── index.ts                     # Server entry point (204 lines)
│
├── public/                          # Frontend build (served by Express)
├── release/                         # Compiled executables
│   └── RoashettaServer.exe
├── dist/                            # Compiled TypeScript output
├── roashetta.db                     # SQLite database file
├── package.json                     # Dependencies and scripts
├── tsconfig.json                    # TypeScript configuration
└── .env.example                     # Environment variable template
```

## Technology Stack

- **Runtime**: Node.js
- **Language**: TypeScript 5.3.2
- **Framework**: Express 4.18.2
- **Database**: SQLite (sql.js 1.10.0)
- **Real-time**: Socket.IO 4.8.3
- **Authentication**: JWT (jsonwebtoken 9.0.2)
- **Password Hashing**: bcryptjs 2.4.3
- **CORS**: cors 2.8.5
- **Environment**: dotenv 16.3.1
- **UUID**: uuid 9.0.0
- **Date Utilities**: date-fns 4.1.0
- **Packaging**: pkg 5.8.1 (Node.js to executable)

## Database (SQLite)

### Configuration
**File**: `src/infrastructure/database/config.ts` (501 lines)

**Features**:
- In-memory SQLite with file persistence
- Auto-save every 5 seconds
- Graceful shutdown with final save
- Foreign key constraints enabled
- Prepared statements for all queries

### Schema Overview

**Tables**:
1. **doctors** - Doctor accounts
2. **assistants** - Assistant accounts with permissions
3. **patients** - Patient demographics and medical history
4. **visits** - Visit records with vitals, diagnoses, prescriptions
5. **expenses** - Clinic expenses by category
6. **lab_results** - Lab test results with reference ranges
7. **notifications** - User notifications
8. **queue** - Daily patient queue
9. **settings** - Clinic settings
10. **patient_records** - Uploaded patient files (base64)
11. **previous_investigations** - Previous medical investigations
12. **visit_attachments** - Files attached to visits (base64)

**Primary Keys**: UUIDs (TEXT type)
**Foreign Keys**: Enforced with `PRAGMA foreign_keys = ON`
**Timestamps**: `created_at`, `updated_at` (TEXT format: ISO 8601)

### Database Initialization

**Auto-created on first run**:
1. All table schemas
2. Default doctor account:
   - Email: `doctor@clinic.com`
   - Password: `doctor123` (bcrypt hashed)
   - Role: `doctor`

### Database Access Pattern

```typescript
import db from './infrastructure/database/config';

// Get data
const result = db.exec('SELECT * FROM patients WHERE id = ?', [patientId]);

// Insert data
db.run('INSERT INTO patients (id, name, ...) VALUES (?, ?, ...)', [id, name, ...]);

// Update data
db.run('UPDATE patients SET name = ? WHERE id = ?', [newName, patientId]);

// Delete data
db.run('DELETE FROM patients WHERE id = ?', [patientId]);
```

**Important**: Use prepared statements (parameterized queries) to prevent SQL injection.

## Authentication & Authorization

### JWT Authentication

**Token Structure**:
```typescript
{
  userId: string;      // User ID (doctor or assistant)
  email: string;       // User email
  role: 'doctor' | 'assistant';
  doctorId: string;    // Associated doctor ID
}
```

**Token Flow**:
1. Login → Generate JWT → Return token
2. Client stores token in localStorage
3. Client sends token in `Authorization: Bearer <token>` header
4. Middleware validates token on protected routes
5. Token payload attached to `req.user`

**Implementation**: `src/presentation/middleware/authMiddleware.ts`

### Role-Based Access Control (RBAC)

**Roles**:
- **doctor**: Full access to all features
- **assistant**: Restricted access based on permissions

**Assistant Permissions** (stored in `assistants` table):
```typescript
{
  canCreatePatient: boolean;
  canEditPatient: boolean;
  canDeletePatient: boolean;
  canCreateVisit: boolean;
  canEditVisit: boolean;
  canDeleteVisit: boolean;
  canViewPrescription: boolean;
  canCreatePrescription: boolean;
  canManageRecords: boolean;
}
```

**Permission Checking**:
```typescript
// In controllers
if (req.user.role !== 'doctor' && !assistant.permissions.canEditPatient) {
  return res.status(403).json({ error: 'Insufficient permissions' });
}
```

## API Routes

### Base URL
- Development: `http://localhost:3000/api`
- Production (packaged): `/api`

### Authentication Routes (`/api/auth`)
- `POST /auth/signup` - Register new doctor
- `POST /auth/login` - Login (doctor or assistant)
- `GET /auth/validate` - Validate JWT token

### Patient Routes (`/api/patients`)
- `GET /patients` - Get all patients (for current doctor)
- `GET /patients/:id` - Get patient by ID
- `POST /patients` - Create patient
- `PUT /patients/:id` - Update patient
- `DELETE /patients/:id` - Delete patient

### Visit Routes (`/api/visits`)
- `GET /visits` - Get all visits (for current doctor)
- `GET /visits/:id` - Get visit by ID
- `POST /visits` - Create visit
- `PUT /visits/:id` - Update visit
- `DELETE /visits/:id` - Delete visit
- `GET /visits/patient/:patientId` - Get visits for patient

### Expense Routes (`/api/expenses`)
- `GET /expenses` - Get all expenses
- `GET /expenses/:id` - Get expense by ID
- `POST /expenses` - Create expense
- `PUT /expenses/:id` - Update expense
- `DELETE /expenses/:id` - Delete expense

### Assistant Routes (`/api/assistants`)
- `GET /assistants` - Get all assistants (doctor only)
- `GET /assistants/:id` - Get assistant by ID
- `POST /assistants` - Create assistant (doctor only)
- `PUT /assistants/:id` - Update assistant (doctor only)
- `DELETE /assistants/:id` - Delete assistant (doctor only)

### Lab Result Routes (`/api/lab-results`)
- `GET /lab-results/visit/:visitId` - Get lab results for visit
- `POST /lab-results` - Create lab result
- `PUT /lab-results/:id` - Update lab result
- `DELETE /lab-results/:id` - Delete lab result

### Notification Routes (`/api/notifications`)
- `GET /notifications` - Get all notifications for user
- `PUT /notifications/:id/read` - Mark notification as read
- `PUT /notifications/read-all` - Mark all as read
- `DELETE /notifications/:id` - Delete notification
- `DELETE /notifications/delete-all` - Delete all

### Queue Routes (`/api/queue`)
- `GET /queue` - Get today's queue
- `GET /queue/date/:date` - Get queue for specific date
- `POST /queue` - Add patient to queue
- `PUT /queue/:id` - Update queue entry
- `DELETE /queue/:id` - Remove from queue
- `PUT /queue/reorder` - Reorder queue

### Analytics Routes (`/api/analytics`)
- `GET /analytics` - Get analytics data (revenue, visits, expenses)

### Settings Routes (`/api/settings`)
- `GET /settings` - Get clinic settings
- `PUT /settings` - Update clinic settings

### Current Patient Routes (`/api/current-patient`)
- `GET /current-patient` - Get current patient
- `PUT /current-patient` - Set current patient

### Patient Record Routes (`/api/patient-records`)
- `GET /patient-records/patient/:patientId` - Get records for patient
- `POST /patient-records` - Upload patient record
- `DELETE /patient-records/:id` - Delete record

### Previous Investigation Routes (`/api/previous-investigations`)
- `GET /previous-investigations/patient/:patientId` - Get investigations
- `POST /previous-investigations` - Upload investigation
- `DELETE /previous-investigations/:id` - Delete investigation

### Visit Attachment Routes (`/api/visit-attachments`)
- `GET /visit-attachments/visit/:visitId` - Get attachments for visit
- `POST /visit-attachments` - Upload attachment
- `DELETE /visit-attachments/:id` - Delete attachment

## Socket.IO Events

### Server → Client Events

**visitCreated**
```typescript
{
  visitId: string;
  patientId: string;
  patientName: string;
  doctorId: string;
}
```

**patientUpdated**
```typescript
{
  patientId: string;
  patientName: string;
  doctorId: string;
}
```

**currentPatientChanged**
```typescript
{
  patientId: string;
  patientName: string;
  doctorId: string;
}
```

**queueUpdated**
```typescript
{
  doctorId: string;
}
```

**notificationSent**
```typescript
{
  notification: Notification;
  doctorId: string;
}
```

### Client → Server Events

**joinRoom**
```typescript
{
  doctorId: string;
}
```

### Broadcasting Pattern

Notifications are sent to specific doctor's room:
```typescript
io.to(`doctor-${doctorId}`).emit('visitCreated', { ... });
```

This ensures users only receive notifications relevant to their clinic.

## Environment Variables

**File**: `.env` (create from `.env.example`)

```bash
# Server Configuration
PORT=3000                           # Server port

# JWT Configuration
JWT_SECRET=your-secret-key-here     # Secret for JWT signing

# License Configuration
LICENSE_SECRET=your-license-secret  # Secret for license key validation
LICENSE_KEY=                        # Optional: Pre-configured license key

# Database Configuration
DATABASE_PATH=./roashetta.db        # Path to SQLite database file
```

**Important**:
- Never commit `.env` to version control
- Use strong secrets in production
- Change default passwords after first login

## License System

**File**: `src/utils/license.ts`

### License Key Format
```
BASE64(clinicName|expiryDate|maxDoctors|signature)
```

**Components**:
- `clinicName`: Clinic name (string)
- `expiryDate`: Expiry date (YYYY-MM-DD)
- `maxDoctors`: Maximum number of doctors (integer)
- `signature`: HMAC-SHA256(clinicName|expiryDate|maxDoctors, LICENSE_SECRET) - first 16 chars

### Validation
```typescript
import { validateLicense, generateLicenseKey } from './utils/license';

// Generate license
const licenseKey = generateLicenseKey('My Clinic', '2025-12-31', 5);

// Validate license
const validation = validateLicense(licenseKey);
if (!validation.isValid) {
  console.error(validation.error);
}
```

**Validation Rules**:
1. Key must be properly formatted
2. Signature must match (prevents tampering)
3. Expiry date must be in the future
4. Number of doctors must not exceed `maxDoctors`

**Enforcement**:
- Checked on server startup
- Checked during login
- Blocks access if invalid or expired

## Error Handling

### Global Error Handler
**File**: `src/presentation/middleware/errorHandler.ts`

**Pattern**:
```typescript
try {
  // Controller logic
} catch (error) {
  console.error('Error:', error);
  res.status(500).json({ error: 'Internal server error' });
}
```

**Error Response Format**:
```json
{
  "error": "Error message here"
}
```

**HTTP Status Codes**:
- `200` - Success
- `201` - Created
- `400` - Bad request (validation error)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not found
- `500` - Internal server error

## Deployment

### Development
```bash
npm run dev              # Start with ts-node-dev (auto-reload)
```

### Production (Node.js)
```bash
npm run build            # Compile TypeScript
npm start                # Run compiled JavaScript
```

### Production (Executable)

**Windows**:
```bash
npm run build:exe:win    # Creates RoashettaServer.exe
```

**macOS**:
```bash
npm run build:exe:mac    # Creates RoashettaServer.bin
```

**Linux**:
```bash
npm run build:exe:linux  # Creates RoashettaServer.bin
```

**Distribution Files**:
1. `RoashettaServer.exe` (or .bin/.app) - Main executable
2. `sql-wasm.wasm` - SQLite WebAssembly (must be in same folder)
3. `.env` - Environment configuration
4. `start.bat` or `start.sh` - Launcher script
5. `roashetta.db` - Database file (created on first run)

**Packaging Configuration** (in `package.json`):
```json
{
  "pkg": {
    "assets": [
      "public/**/*",
      "node_modules/sql.js/dist/sql-wasm.wasm"
    ],
    "targets": [
      "node18-win-x64",
      "node18-macos-x64",
      "node18-linux-x64"
    ],
    "outputPath": "release"
  }
}
```

## Common Patterns

### Controller Pattern
```typescript
export const getPatients = async (req: Request, res: Response) => {
  try {
    const doctorId = req.user.doctorId; // From auth middleware
    const patients = await getAllPatientsUseCase(doctorId);
    res.json(patients);
  } catch (error) {
    console.error('Error fetching patients:', error);
    res.status(500).json({ error: 'Failed to fetch patients' });
  }
};
```

### Use Case Pattern
```typescript
// application/use-cases/patient/getAllPatients.ts
export const getAllPatientsUseCase = async (doctorId: string) => {
  const query = 'SELECT * FROM patients WHERE doctor_id = ? ORDER BY created_at DESC';
  const result = db.exec(query, [doctorId]);

  if (result.length === 0) return [];

  return result[0].values.map(row => ({
    id: row[0],
    name: row[1],
    // ... map columns to object
  }));
};
```

### Repository Pattern (Conceptual)
While repositories are defined as interfaces in `domain/repositories/`, the actual implementation uses direct database access in use cases. This is a lightweight approach suitable for SQLite.

**To implement full repository pattern**:
1. Create repository interface in `domain/repositories/`
2. Implement in `infrastructure/repositories/`
3. Inject repository into use cases
4. Use cases interact with repository, not database directly

### Middleware Pattern
```typescript
// Authentication middleware
export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // Attach user to request
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};
```

## Testing

**Current Status**: No tests implemented

**Recommended Testing Strategy**:
1. **Unit Tests**: Use cases, utilities (Jest)
2. **Integration Tests**: API endpoints (Supertest)
3. **Database Tests**: Repository implementations (in-memory SQLite)
4. **E2E Tests**: Full API flows (Supertest + fixtures)

**Example Structure**:
```
backend/
├── tests/
│   ├── unit/
│   │   ├── use-cases/
│   │   └── utils/
│   ├── integration/
│   │   └── api/
│   └── fixtures/
```

## Security Best Practices

### Implemented
- ✅ JWT authentication
- ✅ Password hashing with bcrypt (10 rounds)
- ✅ SQL injection prevention (prepared statements)
- ✅ CORS configuration
- ✅ Environment-based secrets (JWT_SECRET)

### Recommended Additions
- ⚠️ Rate limiting (express-rate-limit)
- ⚠️ Helmet.js for security headers
- ⚠️ Input validation/sanitization
- ⚠️ CSRF protection (csurf)
- ⚠️ Request logging (morgan)
- ⚠️ HTTPS enforcement in production
- ⚠️ Secrets rotation policy
- ⚠️ Move LICENSE_SECRET to environment variable

## Performance Optimization

### Database
- **Auto-save**: Batch writes every 5 seconds (not on every operation)
- **Prepared Statements**: Pre-compiled for faster execution
- **Indexes**: Add indexes on frequently queried columns
- **Foreign Keys**: Enforced at database level for data integrity

### API
- **Pagination**: Not implemented (recommend for large datasets)
- **Caching**: Not implemented (consider Redis for sessions)
- **Compression**: Not implemented (consider gzip compression middleware)

### Socket.IO
- **Rooms**: Broadcasts targeted to specific doctor rooms (not global)
- **Throttling**: Not implemented (consider for high-frequency events)

## Troubleshooting

### Database locked error
**Cause**: Multiple processes accessing database
**Solution**: Ensure only one server instance is running

### sql-wasm.wasm not found
**Cause**: Missing WebAssembly file in packaged executable
**Solution**: Ensure `sql-wasm.wasm` is in same directory as executable

### License validation fails
**Cause**: Invalid license key or expired license
**Solution**: Generate new license key or extend expiry date

### Token expired error
**Cause**: JWT token has expired (default: 7 days)
**Solution**: User must log in again

### Port already in use
**Cause**: Another process using port 3000
**Solution**: Change PORT in `.env` or stop other process

## Code Style Guide

### Naming Conventions
- **Files**: PascalCase for classes/controllers, camelCase for functions
- **Variables**: camelCase
- **Constants**: SCREAMING_SNAKE_CASE
- **Classes/Interfaces**: PascalCase
- **Database Tables**: Plural, snake_case
- **Database Columns**: snake_case

### TypeScript
- Use explicit types where not obvious
- Prefer interfaces over types for object shapes
- Use enums for fixed sets of values
- Avoid `any` type

### Async/Await
- Prefer async/await over promises
- Always use try-catch for error handling
- Never use `.then()` chains

### SQL Queries
- Always use prepared statements (parameterized queries)
- Use meaningful column aliases
- Order results consistently (usually by `created_at DESC`)

## Useful Commands

```bash
# Development
npm run dev                # Start with auto-reload

# Build
npm run build              # Compile TypeScript

# Production
npm start                  # Run compiled code

# Package as executable
npm run build:exe:win      # Windows
npm run build:exe:mac      # macOS
npm run build:exe:linux    # Linux

# Database
# (Manual backup - copy roashetta.db file)
```

## Key Files Reference

- **Server Entry**: `src/index.ts` (204 lines) - Express setup, Socket.IO, routes
- **Database**: `src/infrastructure/database/config.ts` (501 lines) - Schema, queries
- **License**: `src/utils/license.ts` - License key validation
- **Auth Middleware**: `src/presentation/middleware/authMiddleware.ts` - JWT validation
- **Routes Index**: `src/presentation/routes/index.ts` - All route aggregation

## Future Enhancements

1. **Database Migrations**: Structured migration system
2. **API Documentation**: OpenAPI/Swagger
3. **Logging**: Winston or Pino
4. **Monitoring**: Health check endpoint, metrics
5. **Backup**: Automated database backup system
6. **Testing**: Comprehensive test suite
7. **CI/CD**: GitHub Actions for automated builds
8. **Docker**: Containerization for easier deployment
9. **Cloud Sync**: Optional cloud backup for multi-clinic support
10. **Audit Log**: Track all data changes for compliance

---

**Last Updated**: 2026-03-03
