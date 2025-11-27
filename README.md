# 🏥 Hospital Management System

A comprehensive, full-stack Hospital Management System built with Next.js, React, and Node.js. This application provides role-based dashboards for administrators, doctors, patients, pharmacists, lab technicians, and staff members.

## ✨ Features

### Multi-Role Authentication
- **Admin**: Full system control, user management, department management, reports
- **Doctor**: Patient management, appointments, prescriptions, availability settings
- **Patient**: Book appointments, view prescriptions, lab reports, invoices
- **Pharmacist**: Manage medicines, dispense prescriptions, track low stock
- **Lab Technician**: Process test requests, upload lab reports
- **Staff**: Manage appointments, patient check-in, billing

### Core Functionality
- 🔐 JWT-based authentication with role-based access control
- 📅 Appointment booking with real-time availability
- 💊 Prescription management and dispensing
- 🧪 Lab test requests and report management
- 💰 Billing and invoice management
- 📊 Admin dashboard with analytics and charts
- 🌙 Dark/Light mode support
- 📱 Responsive design for all devices

## 🛠️ Tech Stack

**Frontend:**
- Next.js 14 with React 18
- Tailwind CSS for styling
- Radix UI components
- Recharts for data visualization
- React Hook Form with Zod validation
- React Router for client-side routing

**Backend:**
- Node.js with Express.js
- MySQL database
- JWT authentication
- bcrypt for password hashing

## 📁 Project Structure

```
├── app/                    # Next.js app directory
├── backend/               # Express.js backend
│   ├── config/           # Database configuration
│   ├── controllers/      # Route controllers
│   ├── middleware/       # Auth middleware
│   ├── routes/           # API routes
│   └── server.js         # Server entry point
├── components/            # Shared UI components
├── src/
│   ├── components/       # React components
│   ├── context/          # Auth context
│   ├── hooks/            # Custom hooks
│   ├── layouts/          # Layout components
│   ├── pages/            # Page components
│   └── services/         # API services
└── public/               # Static assets
```

## 🚀 Getting Started

### Prerequisites
- Node.js v18 or higher
- MySQL 8.0+
- npm or pnpm

### Frontend Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/talharusman/Hospital_Managment_System.git
   cd Hospital_Managment_System
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:3000`

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   npm install
   ```

2. **Configure environment variables**
   Create a `.env` file in the backend directory:
   ```env
   DB_HOST=localhost
   DB_USER=your_username
   DB_PASSWORD=your_password
   DB_NAME=hospital_db
   DB_PORT=3306
   JWT_SECRET=your_jwt_secret
   JWT_EXPIRE=7d
   PORT=5000
   ```

3. **Set up the database**
   - Create a MySQL database named `hospital_db`
   - Run the SQL scripts in `backend/scripts/` to create tables

4. **Start the backend server**
   ```bash
   npm start
   # Or for development with auto-reload:
   npm run dev
   ```

## 🔑 Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@hospital.com | password123 |
| Doctor | dr.cardiology@hospital.com | password123 |
| Patient | jane.doe@hospital.com | password123 |
| Lab Tech | labtech@hospital.com | password123 |
| Pharmacist | pharma@hospital.com | password123 |
| Staff | staff@hospital.com | password123 |

## 📜 Available Scripts

### Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Backend
- `npm start` - Start server
- `npm run dev` - Start with nodemon (auto-reload)

## 🔗 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

### Admin
- `GET /api/admin/users` - Get all users
- `POST /api/admin/users` - Create user
- `GET /api/admin/departments` - Get departments
- `GET /api/admin/statistics` - Dashboard statistics

### Doctor
- `GET /api/doctor/dashboard` - Doctor dashboard
- `GET /api/doctor/appointments` - Get appointments
- `POST /api/doctor/prescriptions` - Create prescription
- `PUT /api/doctor/availability` - Update availability

### Patient
- `GET /api/patient/dashboard` - Patient dashboard
- `POST /api/patient/appointments` - Book appointment
- `GET /api/patient/prescriptions` - View prescriptions
- `GET /api/patient/lab-reports` - View lab reports

### Pharmacy
- `GET /api/pharmacy` - Get medicines
- `POST /api/pharmacy/dispense` - Dispense medicine
- `GET /api/pharmacy/low-stock` - Low stock alerts

### Lab
- `GET /api/lab/tests` - Get test requests
- `POST /api/lab/tests/:id/report` - Upload report

### Billing
- `GET /api/billing/invoices` - Get invoices
- `POST /api/billing/invoices` - Create invoice
- `POST /api/billing/payments` - Process payment

## 📄 License

This project is licensed under the MIT License.

## 👨‍💻 Author

Developed by [Talha Rusman](https://github.com/talharusman)
