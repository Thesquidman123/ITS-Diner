const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const rootDir = path.resolve(__dirname, '..');

module.exports = {
  rootDir,
  port: Number(process.env.PORT || 5000),
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  jwtSecret: process.env.JWT_SECRET || 'change-me-in-production',
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
  stripePublishableKey: process.env.VITE_STRIPE_PUBLISHABLE_KEY || '',
  smtpHost: process.env.SMTP_HOST || '',
  smtpPort: Number(process.env.SMTP_PORT || 587),
  smtpUser: process.env.SMTP_USER || '',
  smtpPass: process.env.SMTP_PASS || '',
  emailFrom: process.env.EMAIL_FROM || 'noreply@foodvan.local',
  routeStopMinutes: Number(process.env.ROUTE_STOP_MINUTES || 20),
  dataDir: path.join(rootDir, 'data'),
  uploadsDir: path.join(rootDir, 'uploads')
};
