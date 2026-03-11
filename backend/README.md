# OWMS Backend

Backend service for OWMS (Organization Work Management System), built with Node.js, Express, and MongoDB (Mongoose).

## What This Service Does

- Authenticates users with email/password and JWT.
- Enforces first-party access (`@owms.com` by default).
- Requires email verification before login.
- Protects routes by role and permission.
- Manages tasks and submissions.
- Supports file uploads (local disk by default, S3 when configured).

## Tech Stack

- Node.js + Express
- MongoDB + Mongoose
- JWT (`jsonwebtoken`)
- Password hashing (`bcryptjs`)
- File upload (`multer`)
- Testing (`jest`, `supertest`)

## Local Setup

1. Install dependencies

```bash
cd backend
npm install
```

2. Configure environment variables in `backend/.env`

```env
PORT=5000
MONGODB_URL=mongodb://localhost:27017/ems
JWT_SECRET=replace-with-a-strong-secret
JWT_EXPIRES_IN=7d

ALLOWED_EMAIL_DOMAIN=owms.com
EMAIL_VERIFICATION_TOKEN_TTL_MINUTES=30

AUTH_COOKIE_NAME=owms_auth_token
AUTH_COOKIE_MAX_AGE_MS=604800000
# AUTH_COOKIE_DOMAIN=.yourdomain.com

# Optional S3 upload settings
# AWS_S3_BUCKET=your-bucket
# AWS_REGION=ap-south-1
# AWS_ACCESS_KEY_ID=your-access-key
# AWS_SECRET_ACCESS_KEY=your-secret-key
```

3. Start server

```bash
npm start
```

The backend runs on:

- `http://localhost:5000`

Health check:

- `GET http://localhost:5000/` -> `OWMS Backend Running`

## Database Connection (Important)

Database connection is created in `config/db.js` using:

- `process.env.MONGODB_URL`
- fallback: `mongodb://localhost:27017/ems` when `MONGODB_URL` is missing

### Valid MongoDB URL formats

- Local MongoDB:
	- `mongodb://localhost:27017/ems`
- MongoDB Atlas:
	- `mongodb+srv://<username>:<password>@<cluster-host>/<db-name>?retryWrites=true&w=majority`

### How to verify DB connection

- Start backend using `npm start`
- Check terminal for:
	- `MongoDB connected successfully`

If connection fails, check:

- `MONGODB_URL` is correct
- DB user/password are valid
- IP/network access is allowed (Atlas)
- Database name exists or can be created

## Environment Variables Reference

- `PORT`: HTTP port (default `5000`)
- `MONGODB_URL`: MongoDB connection string
- `JWT_SECRET`: JWT signing secret (required in production)
- `JWT_EXPIRES_IN`: token lifetime (default `7d`)
- `ALLOWED_EMAIL_DOMAIN`: allowed corporate email domain (default `owms.com`)
- `EMAIL_VERIFICATION_TOKEN_TTL_MINUTES`: email verification token expiry in minutes (default `30`)
- `AUTH_COOKIE_NAME`: auth cookie key (default `owms_auth_token`)
- `AUTH_COOKIE_MAX_AGE_MS`: auth cookie lifetime in ms (default 7 days)
- `AUTH_COOKIE_DOMAIN`: cookie domain for production (optional)
- `AWS_S3_BUCKET`, `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`: enable S3 uploads

## API Base Paths

- Auth: `/api/auth`
- Tasks: `/api/tasks`
- Submissions: `/api/submissions`
- Uploaded files (local): `/uploads/<filename>`

## Main Endpoints

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/verify-email`
- `POST /api/auth/logout`
- `GET /api/auth/me`

Register payload example:

```json
{
	"email": "intern@owms.com",
	"password": "password123",
	"confirmPassword": "password123",
	"name": "Intern User",
	"role": "intern"
}
```

Verify email payload:

```json
{
	"token": "<verification-token>"
}
```

### Tasks

- `POST /api/tasks`
- `GET /api/tasks`
- `GET /api/tasks/:id`
- `PATCH /api/tasks/:id`
- `DELETE /api/tasks/:id`
- `GET /api/tasks/:id/versions`
- `PATCH /api/tasks/:id/assign`

### Submissions

- `POST /api/submissions` (supports multipart file upload with `file` field)
- `GET /api/submissions/task/:taskId`
- `GET /api/submissions/:id`
- `GET /api/submissions/task/:taskId/user/:submittedById`
- `PATCH /api/submissions/:id/review`
- `DELETE /api/submissions/:id`

## Auth + Authorization Behavior

- Only emails matching `ALLOWED_EMAIL_DOMAIN` are accepted.
- Password must be at least 8 chars and include letters and numbers.
- `confirmPassword` must match on register.
- Email must be verified before login.
- Third-party accounts are blocked (`local` provider only).
- Login sets an `HttpOnly` cookie.
- Protected routes authenticate via cookie first, then Bearer token fallback.

Role permissions are defined in `config/permissions.js` and enforced by:

- `middlewares/auth.middleware.js`
- `middlewares/role.middleware.js`

## CORS Configuration

Current allowed frontend origins in `app.js`:

- `http://localhost:5173`
- `http://localhost:5174`

If your frontend runs on another URL/port, add it in `app.js`.

## File Uploads

Upload config is in `config/multer.js`.

- Default: local storage at `backend/uploads/`
- S3 mode auto-enables when all required AWS env vars are set
- Max file size: 50 MB

## Run Tests

```bash
npm test
```

Auth-focused test file:

- `tests/auth.test.js`

## Deployment (Vercel)

- `vercel.json` routes all requests to `server.js`.
- Set production env vars in Vercel project settings.
- Use a production MongoDB URL in `MONGODB_URL`.
- For production uploads, use S3 (serverless local disk is ephemeral).

## Security Notes

- Never commit real credentials in `.env`.
- Use a strong `JWT_SECRET` in production.
- Rotate credentials immediately if they were exposed.
