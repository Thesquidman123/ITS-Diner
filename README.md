# Mobile Food Van Ordering System
 
 A unified full-stack MVP for a burger and sandwich van with one mobile-first web app and role-based dashboards for `owner`, `staff`, `driver`, and `customer`.
 
 ## What is included
 
 - Unified React + Vite frontend in `client/`
 - Express backend in `server/`
 - Modular route/controller/model structure
 - JSON file persistence in `data/`
 - JWT auth with bcrypt password hashing
 - Stripe payment intent wiring with local test fallback when keys are absent
 - Owner menu management with mobile camera upload support and image compression
 - Customer accounts, order history, favourites, and tab/credit support
 - Driver route live-mode with `ARRIVED` activation
 - Staff kitchen board for order lifecycle updates
 - In-app notifications and email notifications with SMTP or local log fallback
 - Docker backend/frontend setup with persistent `data` and `uploads` volumes
 
 ## Required structure
 
 ```text
 /client
 /server
 /routes
 /controllers
 /models
 /data
 /uploads
 /shared
 /docker
 ```
 
 ## Demo accounts
 
 Seed data is created automatically on first run.
 
 - Owner: `owner@foodvan.local` / `Password123!`
 - Staff: `staff@foodvan.local` / `Password123!`
 - Driver: `driver@foodvan.local` / `Password123!`
 - Customer: `customer@foodvan.local` / `Password123!`
 
 ## Environment setup
 
 Copy `.env.example` to `.env` and set values as needed.
 
 Important variables:
 
 - `JWT_SECRET`
 - `CLIENT_URL`
 - `STRIPE_SECRET_KEY`
 - `VITE_STRIPE_PUBLISHABLE_KEY`
 - `SMTP_HOST`
 - `SMTP_PORT`
 - `SMTP_USER`
 - `SMTP_PASS`
 - `EMAIL_FROM`
 - `ROUTE_STOP_MINUTES`
 
 If Stripe keys are not provided, the app uses a local test checkout fallback for MVP development.
 If SMTP is not configured, outgoing emails are logged to `data/email-log.json`.
 
 ## Run locally without Docker
 
 ### 1. Install dependencies
 
 ```bash
 npm run install:all
 ```
 
 ### 2. Start development mode
 
 ```bash
 npm run dev
 ```
 
 This starts:
 
 - API: `http://localhost:5000`
 - Frontend: `http://localhost:5173`
 
 ## Run with Docker
 
 ### 1. Create `.env`
 
 Use the provided `.env.example` as a base.
 
 ### 2. Start containers
 
 ```bash
 docker-compose up --build
 ```
 
 This starts:
 
 - Backend API on `http://localhost:5000`
 - Frontend on `http://localhost:8080`
 
 Docker volumes persist:
 
 - `./data`
 - `./uploads`
 
 ## Feature overview by role
 
 ### Owner
 
 - Add menu items quickly
 - Upload menu photos from mobile camera
 - Manage stock availability
 - View orders, customers, routes, and credit state
 - Enable or disable customer tab access
 
 ### Staff
 
 - View incoming orders
 - Move orders through `new`, `preparing`, `ready`, `collected`
 
 ### Driver
 
 - View assigned route
 - Activate a stop with `ARRIVED`
 - End live stop mode
 
 ### Customer
 
 - Sign up and sign in
 - Browse and order from phone
 - Use card payment or approved tab
 - View account history and notifications
 - Save favourites
 
 ## Payment rules
 
 - Card orders are submitted after successful Stripe confirmation or local fallback
 - Credit orders are only allowed when:
   - customer is signed in
   - `creditEnabled = true`
   - resulting balance does not exceed `creditLimit`
 
 ## Route ordering rules
 
 - Static ordering is always available
 - Route ordering is only allowed when a stop is active
 - Driver `ARRIVED` action activates route ordering and sends notifications
 
 ## Image handling
 
 - Images upload through the API
 - Files are stored in `uploads/`
 - Images are compressed with `sharp`
 - Files are served by Express static hosting
 
 ## API summary
 
 ### Auth
 - `POST /api/auth/signup`
 - `POST /api/auth/login`
 - `GET /api/auth/me`
 
 ### Menu
 - `GET /api/menu`
 - `POST /api/menu`
 - `PUT /api/menu/:id`
 - `PATCH /api/menu/:id/toggle`
 
 ### Orders
 - `GET /api/orders`
 - `POST /api/orders`
 - `PATCH /api/orders/:id/status`
 
 ### Customers
 - `GET /api/customers/me`
 - `GET /api/customers/me/orders`
 - `POST /api/customers/me/favourites`
 - `GET /api/customers/me/reorder/:id`
 - `GET /api/customers`
 - `PATCH /api/customers/:id/credit`
 
 ### Routes
 - `GET /api/routes`
 - `POST /api/routes`
 - `PATCH /api/routes/:id/arrive`
 - `PATCH /api/routes/:id/clear`
 
 ### Payments
 - `GET /api/payments/config`
 - `POST /api/payments/intent`
 
 ### Notifications
 - `GET /api/notifications`
 
 ## Notes
 
 - The old `backend/`, `frontend/`, and `dashboard/` folders remain in the workspace but are no longer the primary app structure.
 - Tailwind editor warnings such as unknown `@tailwind` or `@apply` rules are IDE warnings and do not block the Vite/Tailwind build.
 - The JSON repository pattern is intentionally simple and can be replaced by PostgreSQL-backed repositories later.
