# Hospital Management System - Frontend

A complete React.js frontend for the Hospital Management System.

## Installation

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Steps to Run

1. **Clone the repository**
   \`\`\`bash
   cd hospital-management-frontend
   \`\`\`

2. **Install dependencies**
   \`\`\`bash
   npm install
   \`\`\`

3. **Create environment file**
   \`\`\`bash
   cp .env.example .env
   \`\`\`
   Update `REACT_APP_API_URL` if your backend is running on a different port.

4. **Start the development server**
   \`\`\`bash
   npm start
   \`\`\`
   The application will open at `http://localhost:3000`

5. **Build for production**
   \`\`\`bash
   npm run build
   \`\`\`

## Project Structure

\`\`\`
src/
├── components/          # Reusable UI components
├── context/            # React context (Auth)
├── hooks/              # Custom hooks
├── pages/              # Page components
├── services/           # API services
├── styles/             # CSS files
└── App.jsx             # Main app component
\`\`\`

## Features

- User authentication with JWT
- Role-based access control (Admin, Doctor, Patient, etc.)
- API integration with backend
- Protected routes
- Toast notifications
- Responsive design

## API Configuration

Make sure your backend is running on `http://localhost:5000` or update the `REACT_APP_API_URL` in `.env` file.

Default backend API endpoints expected:
- `POST /api/auth/login`
- `POST /api/auth/register`
- `GET /api/admin/users`
- `GET /api/doctor/appointments`
- `GET /api/patient/dashboard`
- etc.

## Available Scripts

- `npm start` - Start development server
- `npm build` - Build for production
- `npm test` - Run tests
