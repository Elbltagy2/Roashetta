# Roashetta - نظام إدارة العيادات الطبية

Medical Clinic Management System with Egyptian-style prescription pad (روشتة)

## Features

### Patient Management
- Add, edit, and view patient profiles
- Search by name, phone, or national ID
- Medical history and allergies tracking
- Patient records upload (images, PDFs) with preview

### Visit & Medical Records
- Visit tracking with vitals (blood pressure, temperature, weight)
- Handwriting canvas for medical notes:
  - Chief Complaint (الشكوى)
  - Diagnosis (التشخيص)
  - Prescription (الروشتة)
- Egyptian-style prescription pad design
- PDF download and print functionality

### Lab Results
- Track laboratory test results by category:
  - CBC, Sugar, Liver, Kidney, Lipids, Thyroid, Urine
- Record test values, units, and reference ranges
- Flag abnormal results
- Filter results by category

### Clinic Expenses
- Track clinic operational expenses
- Categories: Rent, Utilities, Supplies, Equipment, Maintenance, Other
- Date range filtering with quick presets
- Expense summaries and category breakdowns

### Current Patient Queue
- Real-time patient queue management for clinic workflow
- Assistant selects current patient from patient list
- Doctor/Assistant dashboard shows current patient details:
  - Full patient info, allergies, medical history
  - Quick access to patient profile and new visit
- Confirmation dialog when replacing current patient
- "Finish" button to clear current patient when done

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
- 9 configurable permission types for assistants

### Internationalization
- Bilingual support (Arabic/English)
- Full RTL Arabic UI support

## Tech Stack

### Frontend
- React 18 + TypeScript
- Vite
- Tailwind CSS + Shadcn UI
- Framer Motion (animations)
- html2pdf.js (PDF generation)
- date-fns (date handling)
- Socket.IO Client (real-time updates)

### Backend
- Node.js + Express
- TypeScript
- PostgreSQL
- JWT authentication
- Role-based access control
- Socket.IO (real-time notifications)
- Clean Architecture pattern

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 14+

### Frontend Setup

```sh
# Install dependencies
npm install

# Start development server
npm run dev
```

### Backend Setup

```sh
# Navigate to backend
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Update .env with your PostgreSQL credentials

# Run database migrations
npm run migrate

# Start backend server
npm run dev
```

## Environment Variables

### Backend (.env)
```
DATABASE_URL=postgresql://user:password@localhost:5432/roashetta
JWT_SECRET=your-secret-key
PORT=3000
```

## Project Structure

```
roashetta/
├── src/                    # Frontend source
│   ├── components/         # React components
│   │   └── ui/             # Shadcn UI components
│   ├── contexts/           # React contexts (Auth, Language)
│   ├── pages/              # Page components
│   └── services/           # API client
├── backend/                # Backend source
│   └── src/
│       ├── domain/         # Entities & repositories
│       │   ├── entities/   # Patient, Visit, LabResult, Expense, etc.
│       │   └── repositories/
│       ├── application/    # Use cases (business logic)
│       ├── infrastructure/ # Database implementations
│       └── presentation/   # Controllers & routes
│           ├── controllers/
│           ├── routes/
│           └── middleware/ # Auth & permissions
└── public/                 # Static assets
```

## License

Private project for medical clinic management.
