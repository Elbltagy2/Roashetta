# Roashetta - نظام إدارة العيادات الطبية

Medical Clinic Management System with Egyptian-style prescription pad (روشتة).

## Features

### Patient Management
- Add, edit, and view patient profiles
- Optional file number field for paper-based record tracking
- Search by name, phone, or file number
- Medical history and allergies tracking
- Patient records upload (images, PDFs) with preview
- Previous investigations management

### Visit & Medical Records
- Visit tracking with vitals (blood pressure, temperature, weight)
- Visit type classification (new/follow-up) with editable pricing
- **Medical History Canvas Sections:**
  - Past Medical History
  - History of Present Illness (HPI)
  - Drug History
  - Family History
  - Current Medication
- **Medical Notes Canvas Sections:**
  - Chief Complaint (الشكوى)
  - Diagnosis (التشخيص)
- **Prescription Canvas (3 pages)**
- **Radiology Request Canvas (3 pages)**
- **Lab Test Requests** - Interactive checklist with categories:
  - CBC, Sugar, Liver, Kidney, Lipids, Thyroid, Urine
- Egyptian-style prescription pad design
- PDF download and print functionality
- Visit attachments upload (images, PDFs with preview)
- **Drawing Canvas Features:**
  - Text mode toggle for typing instead of drawing
  - Undo/Redo functionality
  - Clear canvas
  - Download individual pages as PDF
  - Print individual pages

### Lab Results Management
- Track and manage patient lab test results
- Categories: CBC, Sugar, Liver, Kidney, Lipids, Thyroid, Urine
- Record test values, units, reference ranges
- Flag abnormal results
- Date tracking for historical comparison

### Patient Queue System
- Real-time patient queue management
- Add patients to daily queue
- Queue positions with drag-and-drop reordering
- Status tracking: Waiting → In Progress → Done
- Date-based queue filtering
- Assistant and doctor can both manage queue

### Analytics & Reports
- Revenue analytics with date range filtering
- Visit statistics (new vs follow-up)
- Patient growth tracking
- Expense tracking and net profit calculation
- Daily revenue breakdown charts
- Visual charts with Recharts

### Clinic Expenses
- Track clinic operational expenses
- Categories: Rent, Utilities, Supplies, Equipment, Maintenance, Other
- Date range filtering with quick presets
- Expense summaries and category breakdowns

### Real-time Notifications
- WebSocket-based real-time notification system
- Notification types:
  - New visit created
  - Patient information updated
  - Current patient changed
- Notification bell with unread count badge
- Mark notifications as read (individual or all)
- Delete notifications (individual or all)
- Toast notifications for instant alerts
- Automatic refresh of current patient data when relevant updates occur

### Staff Management
- Assistant accounts with granular permissions
- Role-based access control (Doctor/Assistant)
- Configurable permission types for assistants:
  - Create/Edit/Delete Patients
  - Create/Edit/Delete Visits
  - View/Create Prescriptions
  - Manage Records

### Settings
- Customize default pricing for new visits and follow-ups
- User profile management

### Internationalization
- Bilingual support (Arabic/English)
- Full RTL Arabic UI support
- Cairo Arabic font for better readability

## Tech Stack

### Frontend
- React 18 + TypeScript
- Vite (build tool)
- Tailwind CSS + Shadcn UI
- Framer Motion (animations)
- date-fns (date handling)
- Socket.IO Client (real-time updates)
- Recharts (analytics charts)
- jsPDF + html2canvas (PDF generation)
- pdfjs-dist (PDF preview)
- Lucide React (icons)

### Backend
- Node.js + Express + TypeScript
- SQLite with sql.js (embedded database)
- JWT authentication
- Role-based access control (RBAC)
- Socket.IO (real-time notifications)
- bcryptjs (password hashing)
- License key validation system
- Clean Architecture pattern (Domain/Application/Infrastructure/Presentation)

## Getting Started

### Development Mode

#### Frontend Setup

```sh
# Install dependencies
npm install

# Start development server
npm run dev
```

#### Backend Setup

```sh
# Navigate to backend
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env and configure
# For development, set NODE_ENV=development to skip license check

# Start backend server (SQLite database is auto-created)
npm run dev
```

### Production Build (Windows Executable)

```sh
# Build frontend
npm run build

# Copy frontend to backend
rm -rf backend/public/*
cp -r dist/* backend/public/

# Build backend TypeScript
cd backend
npm run build

# Build Windows executable
npm run build:exe:win

# Build Mac executable
npm run build:exe:mac

# Build Linux executable
npm run build:exe:linux
```

The executable will be in `backend/release/` folder.

### Deploying the Windows App

Send these files to the Windows machine in one folder:

1. **`RoashettaServer.exe`** - The server binary
2. **`sql-wasm.wasm`** - SQLite engine (required)
3. **`.env`** - Configuration file (see below)
4. **`StartRoashetta.bat`** - Launcher script

#### Configuration (.env)

```env
# License Key (REQUIRED for production)
LICENSE_KEY=your-license-key-here

# Server
PORT=3000

# Database (SQLite - leave empty for default 'roashetta.db')
# DATABASE_PATH=./roashetta.db

# JWT Secret (generate a random string)
JWT_SECRET=your-secret-key-here-change-this

# CORS (for local network, use *)
CORS_ORIGIN=*

# File Storage (local folder for patient records)
UPLOAD_PATH=./uploads
```

#### Running on Windows

1. Put all 4 files in a folder
2. Double-click `StartRoashetta.bat`
3. Open browser at `http://localhost:3000`

#### Default Login

- **Email:** `admin@clinic.com`
- **Password:** `admin123`

⚠️ **Important:** Change the default password immediately after first login.

## Environment Variables

### Backend (.env)

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `LICENSE_KEY` | License key for production | Yes* | - |
| `JWT_SECRET` | Secret for JWT tokens | Yes | - |
| `PORT` | Server port | No | 3000 |
| `NODE_ENV` | Environment (development/production) | No | production |
| `DATABASE_PATH` | SQLite database file path | No | ./roashetta.db |
| `CORS_ORIGIN` | CORS allowed origins | No | * |
| `UPLOAD_PATH` | Patient records storage folder | No | ./uploads |

\* Skip in development mode by setting `NODE_ENV=development`

### Frontend (.env)

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | http://localhost:3000/api |
| `VITE_DEMO_MODE` | Enable demo mode (uses mock data) | false |

## Project Structure

```
roashetta/
├── src/                        # Frontend source
│   ├── components/             # React components
│   │   ├── layout/             # Layout components
│   │   └── ui/                 # Shadcn UI components
│   ├── contexts/               # React contexts
│   │   ├── AuthContext.tsx     # Authentication
│   │   ├── DataContext.tsx     # Patient/Visit data
│   │   └── LanguageContext.tsx # i18n
│   ├── pages/                  # Page components
│   │   ├── DashboardPage.tsx
│   │   ├── PatientsPage.tsx
│   │   ├── NewVisitPage.tsx
│   │   ├── VisitDetailPage.tsx
│   │   ├── QueuePage.tsx
│   │   ├── AnalyticsPage.tsx
│   │   ├── ExpensesPage.tsx
│   │   └── SettingsPage.tsx
│   ├── services/               # API client
│   ├── lib/                    # Utilities
│   │   ├── download-pdf.ts     # PDF generation
│   │   ├── drawing-utils.ts    # Canvas helpers
│   │   └── pdf-to-images.ts    # PDF preview
│   └── data/                   # Static data (lab tests)
├── backend/                    # Backend source
│   ├── src/
│   │   ├── domain/             # Domain layer
│   │   │   ├── entities/       # Patient, Visit, Expense, etc.
│   │   │   └── repositories/   # Repository interfaces
│   │   ├── infrastructure/     # Infrastructure layer
│   │   │   ├── database/       # SQLite implementation
│   │   │   ├── repositories/   # Repository implementations
│   │   │   └── socket/         # Socket.IO server
│   │   ├── presentation/       # Presentation layer
│   │   │   ├── controllers/    # Request handlers
│   │   │   ├── routes/         # API routes
│   │   │   └── middleware/     # Auth & permissions
│   │   ├── utils/              # Utilities
│   │   │   └── license.ts      # License validation
│   │   └── index.ts            # Server entry point
│   ├── public/                 # Frontend build (for exe)
│   └── release/                # Built executables
└── dist/                       # Frontend build output
```

## License System

The app uses a license key system for production deployments:

- License keys are validated on server start
- Includes clinic name, expiry date, and max doctors limit
- Lifetime licenses available
- Development mode (`NODE_ENV=development`) skips license check

## Features by Role

### Doctor
- Full access to all features
- Manage assistants and permissions
- View analytics and financial reports
- Create and edit visits
- Manage expenses

### Assistant (Configurable Permissions)
- Create/Edit/Delete Patients
- Create/Edit/Delete Visits
- View/Create Prescriptions
- Manage Records
- Access to queue management
- Limited by assigned permissions

## Security

- JWT-based authentication
- Password hashing with bcryptjs
- Role-based access control (RBAC)
- Permission-based feature access
- Secure session management

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile responsive design
- iOS Safari and Chrome supported

## Known Limitations

- PDF download on iOS: Opens in new tab (iOS doesn't support download attribute)
- Canvas drawing requires touch/mouse input
- Requires JavaScript enabled

## Support

For issues and support, contact the development team.

## License

Private project for medical clinic management.
