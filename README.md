# Roashetta - نظام إدارة العيادات الطبية

Medical Clinic Management System with Egyptian-style prescription pad (روشتة)

## Features

- Patient management (add, edit, view patients)
- Visit tracking with vitals (blood pressure, temperature, weight)
- Handwriting canvas for medical notes:
  - Chief Complaint (الشكوى)
  - Diagnosis (التشخيص)
  - Prescription (الروشتة)
- Egyptian-style prescription pad matching Dr. Sherif Ali's design
- PDF download for prescriptions
- Patient records upload (images, PDFs)
- RTL Arabic UI support
- Assistant management for clinic staff

## Tech Stack

### Frontend
- React 18 + TypeScript
- Vite
- Tailwind CSS
- Shadcn UI
- Framer Motion
- html2pdf.js (PDF generation)

### Backend
- Node.js + Express
- TypeScript
- PostgreSQL
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
│   ├── contexts/           # React contexts
│   ├── pages/              # Page components
│   └── services/           # API client
├── backend/                # Backend source
│   └── src/
│       ├── domain/         # Entities & repositories
│       ├── application/    # Use cases
│       ├── infrastructure/ # Database & implementations
│       └── presentation/   # Controllers & routes
└── public/                 # Static assets
```

## License

Private project for medical clinic management.
