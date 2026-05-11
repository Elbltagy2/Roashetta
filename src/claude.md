# Frontend - Roashetta Medical Clinic Management System

## Overview

This is the frontend application for Roashetta, built with React 18, TypeScript, Vite, and Tailwind CSS. It provides a comprehensive UI for medical clinic management with features like patient records, visit tracking, prescription writing with digital canvas, real-time notifications, and bilingual support (Arabic/English).

## Architecture

### Component Architecture

```
┌─────────────────────────────────────────┐
│          App.tsx (Router)               │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│      Context Providers (4 layers)       │
│  Auth → Data → Language → Notification  │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│         Pages (15 routes)               │
│  Dashboard, Patients, Visits, etc.      │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│       Feature Components                │
│  PatientCard, VisitForm, Canvas, etc.   │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│         UI Components (Shadcn)          │
│  Button, Input, Card, Dialog, etc.      │
└─────────────────────────────────────────┘
```

## Directory Structure

```
src/
├── components/                   # React components
│   ├── ui/                       # Shadcn UI components (48 files)
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── select.tsx
│   │   ├── table.tsx
│   │   └── ... (42 more)
│   ├── layout/                   # Layout components
│   │   └── DashboardLayout.tsx   # Main app layout with sidebar
│   ├── patients/                 # Patient-related components
│   │   └── PatientCard.tsx       # Patient list card
│   ├── visit/                    # Visit components
│   │   └── LabTestRequestForm.tsx # Lab test checklist
│   ├── dashboard/                # Dashboard components
│   │   └── StatCard.tsx          # Statistic card
│   └── notifications/            # Notification components
│       ├── NotificationBell.tsx  # Bell icon with badge
│       ├── NotificationList.tsx  # Notification dropdown
│       └── NotificationItem.tsx  # Individual notification
│
├── pages/                        # Page components (15 files)
│   ├── Index.tsx                 # Root redirect
│   ├── LoginPage.tsx             # Login form
│   ├── SignupPage.tsx            # Doctor registration
│   ├── DashboardPage.tsx         # Dashboard overview
│   ├── PatientsPage.tsx          # Patient list
│   ├── NewPatientPage.tsx        # Patient registration
│   ├── PatientDetailPage.tsx     # Patient details & history
│   ├── NewVisitPage.tsx          # Visit creation/editing
│   ├── VisitDetailPage.tsx       # Visit details & prescription
│   ├── QueuePage.tsx             # Patient queue management
│   ├── AnalyticsPage.tsx         # Analytics & reports
│   ├── ExpensesPage.tsx          # Expense tracking
│   ├── AssistantsPage.tsx        # Assistant management (doctor only)
│   ├── SettingsPage.tsx          # User & clinic settings
│   └── NotFound.tsx              # 404 page
│
├── contexts/                     # React Context providers (4 files)
│   ├── AuthContext.tsx           # Authentication & user state
│   ├── DataContext.tsx           # Patient/Visit/Expense data (766 lines)
│   ├── LanguageContext.tsx       # i18n (Arabic/English)
│   └── NotificationContext.tsx   # Real-time notifications
│
├── services/                     # API & Socket services
│   ├── api.ts                    # API client (744 lines)
│   ├── mockApi.ts                # Mock API for demo mode
│   └── socket.ts                 # Socket.IO client
│
├── lib/                          # Utilities & helpers
│   ├── utils.ts                  # General utilities (cn, date formatters)
│   ├── download-pdf.ts           # PDF generation from HTML
│   ├── pdf-to-images.ts          # PDF preview conversion
│   ├── drawing-utils.ts          # Canvas drawing helpers
│   └── animations.ts             # Animation utilities
│
├── data/                         # Static data
│   ├── labTests.ts               # Lab test categories & tests
│   └── medicalData.ts            # Medical reference data
│
├── types/                        # TypeScript type definitions
│   └── index.ts                  # Type definitions
│
├── hooks/                        # Custom React hooks
│   └── use-toast.ts              # Toast notification hook
│
├── App.tsx                       # Main app component with routing
├── main.tsx                      # React app entry point
└── index.css                     # Global styles & Tailwind imports
```

## Technology Stack

### Core
- **React**: 18.3.1 (functional components, hooks)
- **TypeScript**: 5.8.3
- **Vite**: 5.4.19 (build tool & dev server)
- **React Router**: 6.30.1 (routing)

### UI & Styling
- **Tailwind CSS**: 3.4.17 (utility-first CSS)
- **Shadcn UI**: 48+ Radix UI-based components
- **Framer Motion**: 12.23.26 (animations)
- **Lucide React**: 0.462.0 (icons)
- **Cairo Font**: @fontsource/cairo (Arabic support)
- **next-themes**: 0.3.0 (dark mode)

### State Management
- **React Context API**: Global state (Auth, Data, Language, Notification)
- **TanStack Query**: 5.83.0 (server state management, caching)
- **useState/useReducer**: Local component state

### Forms
- **React Hook Form**: 7.61.1 (form handling)
- **Zod**: 3.25.76 (schema validation)
- **@hookform/resolvers**: 3.10.0 (form + Zod integration)

### Data Visualization
- **Recharts**: 2.15.4 (charts for analytics)

### PDF & Canvas
- **html2pdf.js**: 0.12.1 (HTML to PDF conversion)
- **html2canvas**: Screenshot to canvas
- **pdfjs-dist**: 5.4.624 (PDF preview)
- Custom canvas components for drawing

### Date Handling
- **date-fns**: 3.6.0 (date utilities)
- **react-day-picker**: 8.10.1 (date picker)

### Real-time
- **Socket.IO Client**: 4.8.3 (WebSocket communication)

### Notifications
- **Sonner**: 1.7.4 (toast notifications)

### Other UI
- **embla-carousel-react**: 8.6.0 (carousel)
- **react-resizable-panels**: 2.1.9 (resizable layouts)
- **input-otp**: 1.4.2 (OTP input)
- **cmdk**: 1.1.1 (command menu)
- **vaul**: 0.9.9 (drawer component)

### Utilities
- **class-variance-authority**: 0.7.1 (component variants)
- **clsx**: 2.1.1 (conditional classes)
- **tailwind-merge**: 2.6.0 (Tailwind class merging)

## State Management

### Context Architecture

**Four Context Providers** (nested in order):

1. **AuthContext** - Authentication & user state
2. **DataContext** - Application data (patients, visits, expenses)
3. **LanguageContext** - Internationalization (i18n)
4. **NotificationContext** - Real-time notifications

**Nesting Order** (in `App.tsx`):
```tsx
<AuthProvider>
  <DataProvider>
    <LanguageProvider>
      <NotificationProvider>
        <Router />
      </NotificationProvider>
    </LanguageProvider>
  </DataProvider>
</AuthProvider>
```

### AuthContext

**File**: `contexts/AuthContext.tsx`

**State**:
```typescript
{
  user: User | null;           // Current user (doctor or assistant)
  isAuthenticated: boolean;    // Auth status
  login: (email, password) => Promise<void>;
  logout: () => void;
  signup: (data) => Promise<void>;
  hasPermission: (permission) => boolean;
}
```

**User Object**:
```typescript
{
  id: string;
  email: string;
  name: string;
  role: 'doctor' | 'assistant';
  doctorId: string;
  permissions?: AssistantPermissions; // Only for assistants
}
```

**Usage**:
```tsx
const { user, isAuthenticated, hasPermission, logout } = useAuth();

if (user?.role === 'doctor') {
  // Doctor-specific UI
}

if (hasPermission('canEditPatient')) {
  // Show edit button
}
```

### DataContext

**File**: `contexts/DataContext.tsx` (766 lines - largest file)

**State**:
```typescript
{
  // Patients
  patients: Patient[];
  addPatient: (patient) => Promise<void>;
  updatePatient: (id, patient) => Promise<void>;
  deletePatient: (id) => Promise<void>;

  // Visits
  visits: Visit[];
  addVisit: (visit) => Promise<void>;
  updateVisit: (id, visit) => Promise<void>;
  deleteVisit: (id) => Promise<void>;

  // Expenses
  expenses: Expense[];
  addExpense: (expense) => Promise<void>;
  updateExpense: (id, expense) => Promise<void>;
  deleteExpense: (id) => Promise<void>;

  // Queue
  queue: QueueEntry[];
  addToQueue: (entry) => Promise<void>;
  updateQueueEntry: (id, entry) => Promise<void>;
  removeFromQueue: (id) => Promise<void>;

  // Lab Results
  labResults: LabResult[];
  addLabResult: (result) => Promise<void>;
  updateLabResult: (id, result) => Promise<void>;
  deleteLabResult: (id) => Promise<void>;

  // And more...
}
```

**Data Flow**:
1. Component calls context method (e.g., `addPatient`)
2. Context calls API service (`api.ts`)
3. API returns response
4. Context updates local state
5. Component re-renders with new data

**Usage**:
```tsx
const { patients, addPatient, updatePatient } = useData();

const handleSubmit = async (data) => {
  await addPatient(data);
  navigate('/patients');
};
```

### LanguageContext

**File**: `contexts/LanguageContext.tsx`

**State**:
```typescript
{
  language: 'en' | 'ar';
  direction: 'ltr' | 'rtl';
  t: (key: string) => string;     // Translation function
  changeLanguage: (lang) => void;
}
```

**Translation Keys** (examples):
- `dashboard`, `patients`, `visits`, `settings`
- `addPatient`, `editPatient`, `deletePatient`
- `name`, `email`, `phone`, `address`
- `save`, `cancel`, `delete`, `edit`

**Usage**:
```tsx
const { t, language, changeLanguage, direction } = useLanguage();

return (
  <div dir={direction}>
    <h1>{t('dashboard')}</h1>
    <Button onClick={() => changeLanguage('ar')}>
      {t('switchToArabic')}
    </Button>
  </div>
);
```

### NotificationContext

**File**: `contexts/NotificationContext.tsx`

**State**:
```typescript
{
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id) => Promise<void>;
  deleteAllNotifications: () => Promise<void>;
}
```

**Real-time Events** (via Socket.IO):
- `visitCreated` - New visit added
- `patientUpdated` - Patient info changed
- `currentPatientChanged` - Current patient set
- `queueUpdated` - Queue order/status changed
- `notificationSent` - New notification

**Usage**:
```tsx
const { notifications, unreadCount, markAsRead } = useNotification();

return (
  <NotificationBell count={unreadCount}>
    {notifications.map(notif => (
      <NotificationItem
        key={notif.id}
        notification={notif}
        onRead={() => markAsRead(notif.id)}
      />
    ))}
  </NotificationBell>
);
```

## Routing

**File**: `App.tsx`

**Route Structure**:
```tsx
<Routes>
  <Route path="/" element={<Index />} />

  {/* Public Routes */}
  <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
  <Route path="/signup" element={<PublicRoute><SignupPage /></PublicRoute>} />

  {/* Protected Routes */}
  <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
  <Route path="/patients" element={<ProtectedRoute><PatientsPage /></ProtectedRoute>} />
  <Route path="/patients/new" element={<ProtectedRoute><NewPatientPage /></ProtectedRoute>} />
  <Route path="/patients/:id" element={<ProtectedRoute><PatientDetailPage /></ProtectedRoute>} />
  <Route path="/patients/:id/visit/new" element={<ProtectedRoute><NewVisitPage /></ProtectedRoute>} />
  <Route path="/patients/:id/visit/:visitId" element={<ProtectedRoute><VisitDetailPage /></ProtectedRoute>} />
  <Route path="/queue" element={<ProtectedRoute><QueuePage /></ProtectedRoute>} />
  <Route path="/analytics" element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />
  <Route path="/expenses" element={<ProtectedRoute><ExpensesPage /></ProtectedRoute>} />
  <Route path="/assistants" element={<ProtectedRoute><AssistantsPage /></ProtectedRoute>} />
  <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />

  {/* 404 */}
  <Route path="*" element={<NotFound />} />
</Routes>
```

**Route Guards**:
- **PublicRoute**: Redirects to `/dashboard` if authenticated
- **ProtectedRoute**: Redirects to `/login` if not authenticated

## API Service

**File**: `services/api.ts` (744 lines)

### Configuration

```typescript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';
```

### Authentication

**Token Storage**: localStorage (`token` key)

**Token Attachment**:
```typescript
const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`
};
```

### API Methods

**Authentication**:
- `login(email, password)` - Login user
- `signup(doctorData)` - Register doctor
- `validateToken()` - Validate JWT token

**Patients**:
- `getPatients()` - Get all patients
- `getPatient(id)` - Get patient by ID
- `createPatient(patient)` - Create patient
- `updatePatient(id, patient)` - Update patient
- `deletePatient(id)` - Delete patient

**Visits**:
- `getVisits()` - Get all visits
- `getVisit(id)` - Get visit by ID
- `getVisitsByPatient(patientId)` - Get visits for patient
- `createVisit(visit)` - Create visit
- `updateVisit(id, visit)` - Update visit
- `deleteVisit(id)` - Delete visit

**Expenses**:
- `getExpenses()` - Get all expenses
- `createExpense(expense)` - Create expense
- `updateExpense(id, expense)` - Update expense
- `deleteExpense(id)` - Delete expense

**Queue**:
- `getQueue()` - Get today's queue
- `getQueueByDate(date)` - Get queue for date
- `addToQueue(entry)` - Add patient to queue
- `updateQueueEntry(id, entry)` - Update queue entry
- `removeFromQueue(id)` - Remove from queue
- `reorderQueue(entries)` - Reorder queue

**Lab Results**:
- `getLabResultsByVisit(visitId)` - Get lab results
- `createLabResult(result)` - Create lab result
- `updateLabResult(id, result)` - Update lab result
- `deleteLabResult(id)` - Delete lab result

**Notifications**:
- `getNotifications()` - Get all notifications
- `markNotificationAsRead(id)` - Mark as read
- `markAllNotificationsAsRead()` - Mark all as read
- `deleteNotification(id)` - Delete notification
- `deleteAllNotifications()` - Delete all

**Settings**:
- `getSettings()` - Get clinic settings
- `updateSettings(settings)` - Update settings

**Current Patient**:
- `getCurrentPatient()` - Get current patient
- `setCurrentPatient(patientId)` - Set current patient

### Error Handling

```typescript
try {
  const response = await fetch(url, options);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return await response.json();
} catch (error) {
  console.error('API Error:', error);
  throw error;
}
```

## Pages

### DashboardPage

**Route**: `/dashboard`

**Features**:
- Statistics cards (total patients, visits today, revenue today)
- Recent patients list
- Quick actions (new patient, new visit)
- Current patient display

**Components Used**:
- `StatCard` - Statistic display
- `PatientCard` - Patient list item
- `Button`, `Card` - Shadcn UI

### PatientsPage

**Route**: `/patients`

**Features**:
- Patient list with search
- Filter by name, file number, phone
- Patient cards with demographics
- Add new patient button

**Components Used**:
- `PatientCard` - Patient display
- `Input` - Search field
- `Button` - Add patient

### NewPatientPage

**Route**: `/patients/new`

**Features**:
- Patient registration form
- Fields: file number, name, phone, age, gender, address
- Medical history
- Allergies (multi-select)
- Form validation with Zod

**Technologies**:
- React Hook Form
- Zod validation
- Shadcn form components

### PatientDetailPage

**Route**: `/patients/:id`

**Features**:
- Patient information display
- Edit patient button
- Previous visits list
- Medical records section (file uploads)
- Previous investigations
- Lab results
- New visit button

**Tabs**:
1. Overview - Patient info
2. Visits - Visit history
3. Records - Uploaded files
4. Lab Results - Test results

### NewVisitPage

**Route**: `/patients/:id/visit/new`

**Features**:
- Visit creation/editing (largest page)
- Visit type selection (new/follow-up) with pricing
- Vitals: BP, temperature, weight, height
- **5 Medical History Canvas Sections**:
  - Past Medical History
  - History of Present Illness (HPI)
  - Drug History
  - Family History
  - Current Medication
- **2 Medical Notes Canvas Sections**:
  - Chief Complaint
  - Diagnosis
- **3 Prescription Canvas Pages**
- **3 Radiology Request Canvas Pages**
- **Lab Test Request** (interactive checklist)
- **Visit Attachments** (file uploads)
- Drawing canvas features:
  - Undo/Redo
  - Text mode toggle (type instead of draw)
  - Clear canvas
  - Individual page download/print

**Canvas Component Pattern**:
```tsx
<DrawingCanvas
  value={canvasData}
  onChange={setCanvasData}
  placeholder="Draw or type here..."
  textMode={textMode}
  onTextModeChange={setTextMode}
/>
```

### VisitDetailPage

**Route**: `/patients/:id/visit/:visitId`

**Features**:
- View visit details
- Display all canvas drawings
- Edit visit button
- Download prescription as PDF
- Print prescription
- View attachments
- Lab test requests display

### QueuePage

**Route**: `/queue`

**Features**:
- Daily patient queue management
- Add patient to queue
- **Drag-and-drop reordering** (react-beautiful-dnd pattern)
- Status tracking: Waiting → In Progress → Done
- Set current patient (broadcasts to all users)
- View patient profile
- Remove from queue
- Date filtering

**Real-time**: Queue updates via Socket.IO

### AnalyticsPage

**Route**: `/analytics`

**Features**:
- Date range filtering
- Revenue analytics (total, by visit type)
- Visit statistics (new vs follow-up)
- Patient growth tracking
- Expense summaries
- Net profit calculation
- Daily breakdown charts (Recharts)
- Visual graphs (line charts, bar charts)

**Charts**:
- Revenue over time (Line chart)
- Visit distribution (Bar chart)
- Expense breakdown (Pie chart)

### ExpensesPage

**Route**: `/expenses`

**Features**:
- Expense tracking
- Categories: Rent, Utilities, Supplies, Equipment, Maintenance, Other
- Date range filtering
- Add/Edit/Delete expenses
- Expense summaries by category
- Total expense calculation

### AssistantsPage

**Route**: `/assistants` (Doctor only)

**Features**:
- Assistant account management
- Create assistant accounts
- **Granular permission configuration**:
  - Create/Edit/Delete Patients
  - Create/Edit/Delete Visits
  - View/Create Prescriptions
  - Manage Records
- Activate/deactivate assistants
- View assistant list

**Permission Checkboxes**:
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

### SettingsPage

**Route**: `/settings`

**Features**:
- User profile management (name, email, password)
- Default pricing configuration (new visit, follow-up)
- Clinic settings (name, address, phone)
- Language toggle (Arabic/English)
- Theme toggle (light/dark) - if implemented

## Canvas Drawing System

### Drawing Canvas Component

**Custom Implementation** (not using external library)

**Features**:
- Freehand drawing with mouse/touch
- Undo/Redo functionality
- Text mode toggle (type instead of draw)
- Clear canvas
- Download as PDF
- Print
- Base64 data URL storage

**State Management**:
```typescript
const [lines, setLines] = useState<Line[]>([]);       // Drawing strokes
const [history, setHistory] = useState<Line[][]>([]); // Undo history
const [textMode, setTextMode] = useState(false);      // Text vs draw
const [textContent, setTextContent] = useState('');   // Text content
```

**Data Structure**:
```typescript
type Line = {
  points: { x: number; y: number }[];
  color: string;
  width: number;
};
```

**Canvas to Image Conversion**:
```typescript
const dataURL = canvas.toDataURL('image/png');
// Store in database as TEXT (base64 string)
```

### Prescription Pad Design

**Egyptian-style prescription pad**:
- Header: Clinic name, logo, address, phone
- Patient info: Name, age, gender, file number
- Date
- Prescription content (from canvas)
- Footer: Doctor name, signature, stamp

**Multi-page Support**: 3 prescription pages, 3 radiology pages

### PDF Generation

**File**: `lib/download-pdf.ts`

**Flow**:
1. Render HTML content (prescription template)
2. Convert to canvas with `html2canvas`
3. Generate PDF with `html2pdf.js`
4. Download or open in new tab

**Usage**:
```tsx
import { downloadPdf } from '@/lib/download-pdf';

const handleDownload = async () => {
  await downloadPdf(elementRef.current, 'prescription.pdf');
};
```

**iOS Compatibility**: Uses `window.open()` instead of download attribute

## Lab Test System

**File**: `data/labTests.ts`

**Categories**:
1. CBC (Complete Blood Count)
2. Sugar Tests (Fasting, Random, HbA1c)
3. Liver Function Tests
4. Kidney Function Tests
5. Lipid Profile
6. Thyroid Tests
7. Urine Analysis

**Lab Test Request Component**:
```tsx
<LabTestRequestForm
  selectedTests={selectedTests}
  onTestsChange={setSelectedTests}
/>
```

**Checklist Pattern**:
- Grouped by category
- Multiple selection
- Expandable/collapsible categories
- Search functionality

**Lab Results**:
- Test name
- Result value
- Reference range
- Flag abnormal results (high/low)
- Date of test

## Styling & Theming

### Tailwind Configuration

**File**: `tailwind.config.ts`

**Custom Theme**:
```typescript
{
  colors: {
    primary: 'hsl(var(--primary))',
    secondary: 'hsl(var(--secondary))',
    destructive: 'hsl(var(--destructive))',
    // ... CSS variables
  },
  fontFamily: {
    sans: ['Cairo', 'sans-serif'], // Arabic support
  },
}
```

### CSS Variables

**File**: `index.css`

```css
:root {
  --primary: 222.2 47.4% 11.2%;
  --secondary: 210 40% 96.1%;
  --accent: 210 40% 96.1%;
  --destructive: 0 84.2% 60.2%;
  --border: 214.3 31.8% 91.4%;
  --radius: 0.5rem;
  /* ... more variables */
}

.dark {
  --primary: 210 40% 98%;
  --secondary: 217.2 32.6% 17.5%;
  /* ... dark theme variables */
}
```

### RTL Support

**Language Context** handles direction:
```tsx
useEffect(() => {
  document.documentElement.dir = direction;
}, [direction]);
```

**Tailwind RTL**: Automatic with `dir="rtl"` attribute

### Responsive Design

**Breakpoints** (Tailwind defaults):
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

**Usage**:
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Responsive grid */}
</div>
```

## Forms & Validation

### React Hook Form Pattern

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  age: z.number().min(0).max(150),
});

type FormData = z.infer<typeof schema>;

const MyForm = () => {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    await api.createPatient(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Input {...register('name')} />
      {errors.name && <span>{errors.name.message}</span>}

      <Button type="submit">Submit</Button>
    </form>
  );
};
```

### Common Validation Patterns

**Required Field**:
```typescript
z.string().min(1, 'Field is required')
```

**Email**:
```typescript
z.string().email('Invalid email')
```

**Phone**:
```typescript
z.string().regex(/^[0-9]{10,11}$/, 'Invalid phone number')
```

**Number Range**:
```typescript
z.number().min(0).max(200)
```

**Optional Field**:
```typescript
z.string().optional()
```

**Date**:
```typescript
z.date()
// or
z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid date')
```

## Notifications

### Toast Notifications (Sonner)

**Usage**:
```tsx
import { toast } from 'sonner';

// Success
toast.success('Patient added successfully');

// Error
toast.error('Failed to add patient');

// Info
toast.info('Processing...');

// Promise
toast.promise(
  api.createPatient(data),
  {
    loading: 'Creating patient...',
    success: 'Patient created!',
    error: 'Failed to create patient',
  }
);
```

### Real-time Notifications

**Socket.IO Events** → **NotificationContext** → **Toast**

**Example**:
```tsx
// In NotificationContext
socket.on('visitCreated', (data) => {
  toast.info(`New visit created for ${data.patientName}`);
  setNotifications(prev => [...prev, newNotification]);
});
```

## Performance Optimization

### React.memo

**Use for expensive components**:
```tsx
const PatientCard = React.memo(({ patient }) => {
  // Component logic
});
```

### useMemo & useCallback

**Memoize expensive calculations**:
```tsx
const filteredPatients = useMemo(() => {
  return patients.filter(p => p.name.includes(searchTerm));
}, [patients, searchTerm]);

const handleClick = useCallback(() => {
  // Handler logic
}, [dependencies]);
```

### Lazy Loading

**Code splitting**:
```tsx
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'));

<Suspense fallback={<Loading />}>
  <AnalyticsPage />
</Suspense>
```

### TanStack Query Caching

**Automatic caching** of API responses:
```tsx
const { data, isLoading } = useQuery({
  queryKey: ['patients'],
  queryFn: api.getPatients,
  staleTime: 5 * 60 * 1000, // 5 minutes
});
```

## Common Patterns

### Component Pattern

```tsx
interface Props {
  patient: Patient;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export const PatientCard: React.FC<Props> = ({ patient, onEdit, onDelete }) => {
  const { t } = useLanguage();
  const { hasPermission } = useAuth();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{patient.name}</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Content */}
      </CardContent>
      <CardFooter>
        {hasPermission('canEditPatient') && (
          <Button onClick={() => onEdit(patient.id)}>
            {t('edit')}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};
```

### Custom Hook Pattern

```tsx
// hooks/usePatients.ts
export const usePatients = () => {
  const { patients, addPatient, updatePatient, deletePatient } = useData();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPatients = useMemo(() => {
    return patients.filter(p =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [patients, searchTerm]);

  return {
    patients: filteredPatients,
    searchTerm,
    setSearchTerm,
    addPatient,
    updatePatient,
    deletePatient,
  };
};
```

### Dialog/Modal Pattern

```tsx
const [open, setOpen] = useState(false);

<Dialog open={open} onOpenChange={setOpen}>
  <DialogTrigger asChild>
    <Button>Open Dialog</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Dialog Title</DialogTitle>
    </DialogHeader>
    {/* Content */}
    <DialogFooter>
      <Button onClick={() => setOpen(false)}>Close</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

## Development Workflow

### Running Development Server

```bash
npm run dev              # Start Vite dev server (http://localhost:8080)
```

### Building for Production

```bash
npm run build            # Production build (dist/)
npm run build:dev        # Development build
npm run build:demo       # Demo mode build (mock API)
```

### Adding New Shadcn Component

```bash
npx shadcn@latest add [component-name]
```

Component will be added to `src/components/ui/`

### Creating New Page

1. Create page component in `src/pages/NewPage.tsx`
2. Add route in `src/App.tsx`
3. Add navigation link in sidebar (DashboardLayout)
4. Add translations in LanguageContext

### Adding New Feature

1. Create types in `src/types/index.ts`
2. Add API methods in `src/services/api.ts`
3. Add state management in `DataContext.tsx`
4. Create components in `src/components/feature-name/`
5. Create page in `src/pages/FeaturePage.tsx`
6. Add route and navigation

## Testing

**Current Status**: No tests implemented

**Recommended**:
- **Vitest**: Unit tests
- **React Testing Library**: Component tests
- **Playwright**: E2E tests

**Example Structure**:
```
src/
├── __tests__/
│   ├── components/
│   ├── pages/
│   ├── hooks/
│   └── utils/
```

## Common Utilities

### cn (Class Name Utility)

**File**: `lib/utils.ts`

```tsx
import { cn } from '@/lib/utils';

<div className={cn(
  'base-class',
  isActive && 'active-class',
  className // From props
)} />
```

### Date Formatting

```tsx
import { format } from 'date-fns';

const formattedDate = format(new Date(), 'dd/MM/yyyy');
const dateTime = format(new Date(), 'dd/MM/yyyy HH:mm');
```

### Download PDF

```tsx
import { downloadPdf } from '@/lib/download-pdf';

await downloadPdf(elementRef.current, 'filename.pdf');
```

## Environment Variables

**File**: `.env` or `.env.local`

```bash
VITE_API_URL=http://localhost:3000/api   # Backend API URL
VITE_DEMO_MODE=false                      # Demo mode (mock API)
```

**Access in Code**:
```tsx
const apiUrl = import.meta.env.VITE_API_URL;
const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true';
```

## Troubleshooting

### Canvas not saving
**Cause**: Canvas data not converted to base64
**Solution**: Use `canvas.toDataURL()` before saving

### PDF not downloading on iOS
**Cause**: iOS doesn't support download attribute
**Solution**: Use `window.open(pdfURL)` instead

### RTL layout broken
**Cause**: Missing `dir` attribute
**Solution**: Ensure `document.documentElement.dir` is set

### Socket not connecting
**Cause**: Backend not running or CORS issue
**Solution**: Check backend server and CORS configuration

### White screen after build
**Cause**: Wrong base URL in Vite config
**Solution**: Check `base` in `vite.config.ts`

## Best Practices

### Component Organization
- Keep components small and focused
- Use composition over inheritance
- Extract reusable logic to custom hooks
- Separate UI components from business logic

### State Management
- Use Context for global state only
- Keep local state in components when possible
- Use TanStack Query for server state
- Don't duplicate state across contexts

### Performance
- Use React.memo for expensive components
- Memoize callbacks and values with useCallback/useMemo
- Lazy load routes and heavy components
- Optimize images and assets

### Accessibility
- Use semantic HTML
- Add ARIA labels to interactive elements
- Ensure keyboard navigation works
- Test with screen readers

### Code Style
- Use TypeScript for type safety
- Follow ESLint rules
- Use meaningful variable names
- Add comments for complex logic
- Keep functions small and single-purpose

---

**Last Updated**: 2026-03-03
