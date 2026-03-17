# SewaKhoj - सेवाखोज

A full-stack marketplace web platform designed specifically for Nepal and Nepali users, connecting customers with local service providers.

## Features

- 🏠 **Nepal-Specific**: Designed for Nepali users with Nepal phone format (+977)
- 🌐 **Bilingual Support**: Nepali (default) and English language support
- 📱 **Mobile-First**: Optimized for mobile devices and slow internet connections
- 🔐 **OTP Authentication**: Secure phone-based authentication with SMS verification
- 📍 **Location-Based**: Find nearby service providers in your area
- ⭐ **Rating System**: Customer reviews and ratings for service providers
- 💬 **Real-time Chat**: In-app messaging between customers and technicians
- 💰 **Multiple Payment Options**: Cash, eSewa, Khalti support

## Tech Stack

### Frontend
- Next.js 16 (React framework)
- TypeScript
- Tailwind CSS
- Heroicons & Lucide React

### Backend
- Node.js
- Express.js
- TypeScript
- MongoDB with Mongoose
- JWT Authentication
- Twilio (for SMS OTP)

## Project Structure

```
SewaKhoj/
├── frontend/                 # Next.js frontend application
│   ├── src/
│   │   ├── app/             # App router pages
│   │   ├── components/      # Reusable React components
│   │   ├── contexts/        # React contexts (Auth, Language)
│   │   └── lib/             # Utility functions and API client
│   ├── config.js            # Configuration file
│   └── package.json
├── backend/                  # Node.js backend API
│   ├── src/
│   │   ├── controllers/     # Route controllers
│   │   ├── middleware/      # Express middleware
│   │   ├── models/          # MongoDB models
│   │   ├── routes/          # API routes
│   │   ├── utils/           # Utility functions
│   │   └── config/          # Database configuration
│   ├── .env                 # Environment variables
│   └── package.json
└── README.md
```

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local or cloud instance)
- Twilio account (for SMS OTP)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd SewaKhoj
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

### Configuration

1. **Backend Environment Variables**
   Create `.env` file in `backend/` directory:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/sewakhoj
   JWT_SECRET=your_jwt_secret_key_here
   TWILIO_ACCOUNT_SID=your_twilio_account_sid
   TWILIO_AUTH_TOKEN=your_twilio_auth_token
   TWILIO_PHONE_NUMBER=your_twilio_phone_number
   ```

2. **Frontend Configuration**
   The frontend uses `config.js` for API URL configuration. Update if needed:
   ```javascript
   export const API_BASE_URL = 'http://localhost:5000/api';
   ```

### Running the Application

1. **Start the backend server**
   ```bash
   cd backend
   npm run dev
   ```
   The backend will run on `http://localhost:5000`

2. **Start the frontend server**
   ```bash
   cd frontend
   npm run dev
   ```
   The frontend will run on `http://localhost:3000`

## Available Pages

- **Homepage** (`/`) - Main landing page with service categories
- **Services** (`/services`) - Browse all available services
- **Login** (`/login`) - Phone-based OTP authentication
- **Service Details** (`/services/:id`) - Individual service information
- **Technician Profile** (`/technicians/:id`) - Service provider profiles
- **Customer Dashboard** (`/dashboard`) - Customer bookings and chats
- **Technician Dashboard** (`/technician`) - Technician job management

## API Endpoints

### Authentication
- `POST /api/auth/send-otp` - Send OTP to phone number
- `POST /api/auth/verify-otp` - Verify OTP and login/register
- `POST /api/auth/refresh-token` - Refresh JWT token

### Services
- `GET /api/services` - Get all services
- `GET /api/services/:id` - Get specific service details

### Users & Technicians
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `POST /api/technicians/register` - Register as technician

## Services Available

1. **Home Services**
   - Electrician (इलेक्ट्रिसियन)
   - Plumber (प्लम्बर)
   - Painter (पेन्टर)
   - Carpenter (कारपेन्टर)
   - House Cleaning (घर सफाई)
   - Water Filter Repair (पानी फिल्टर मर्मत)

2. **Electronics**
   - Computer Repair (कम्प्युटर मर्मत)
   - Mobile Repair (मोबाइल मर्मत)
   - AC Repair (AC मर्मत)
   - CCTV Installation (CCTV स्थापना)
   - Solar Technician (सोलार टेक्निसियन)

3. **Vehicle Services**
   - Bike Mechanic (बाइक मेकानिक)

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, please contact the development team or create an issue in the repository.
