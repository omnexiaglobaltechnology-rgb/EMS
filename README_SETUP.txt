# Employee Management System (EMS) - Setup Guide

## project Overview
An integrated platform for organizational management, featuring a standalone administrative panel and a comprehensive workspace for employees and leadership.

## Technology Stack

### Frontend (User Application & Admin Panel)
- **Core Library**: React.js (built with Vite)
- **State Management**: Redux Toolkit (@reduxjs/toolkit)
- **Navigation**: React Router (react-router-dom)
- **Styling**: TailwindCSS (Utility-first CSS)
- **Icons**: Lucide React
- **Notifications**: In-app Notification System (LocalStorage based)

### Backend (REST API)
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (with Mongoose ODM)
- **Authentication**: JWT (JSON Web Token) with Bcrypt password hashing
- **Deployment**: Vercel/Prisma (Optional)
- **File Uploads**: Multer

---

## How to Start the Project

### 1. Prerequisites
Ensure you have **Node.js** (v14+) and **npm** installed on your machine.

### 2. Start the Backend
Navigate to the `backend` folder and start the server:
```bash
cd backend
npm install
npm run dev
```
*Note: The backend runs natively on port 5000.*

### 3. Start the Main Frontend
This project handles general user roles (Interns, Managers, CEO, etc.):
```bash
cd frontend
npm install
npm run dev
```
*Note: The frontend typically runs on port 5173.*

### 4. Start the Admin Frontend
This project is dedicated strictly to administrative functions (User & Settings management):
```bash
cd admin-frontend
npm install
npm run dev
```
*Note: The admin panel typically runs on port 5174.*
