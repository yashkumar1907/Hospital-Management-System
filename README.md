# 🏥 Hospital Management System

<p align="center">

Full Stack Hospital Management System built using **HTML, CSS, JavaScript, Node.js, Express.js, MongoDB Atlas, JWT Authentication, Cloudinary, and REST APIs**.

A complete hospital management solution featuring separate portals for **Patients**, **Doctors**, and **Administrators**, with secure authentication, appointment booking, slot management, profile management, and role-based access control.

</p>

---

<p align="center">

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)
![Cloudinary](https://img.shields.io/badge/Cloudinary-3448C5?style=for-the-badge&logo=cloudinary&logoColor=white)

</p>

---

## 📌 Overview

Hospital Management System is a full-stack web application developed to simplify hospital operations by providing dedicated dashboards for **Patients**, **Doctors**, and **Administrators**.

The system enables patients to register, book appointments, manage profiles, and track appointment status. Doctors can manage their schedules, generate appointment slots, update profiles, and view approved appointments. Administrators have complete control over doctors, patients, appointments, and approval workflows.

The project follows a **Role-Based Access Control (RBAC)** architecture using JWT Authentication and RESTful APIs while storing all application data securely in MongoDB Atlas.

---

## 🚀 Key Highlights

- 🔐 Secure JWT Authentication
- 👥 Three Separate User Portals
- 📅 Doctor Slot Management System
- 🏥 Appointment Approval Workflow
- ☁️ Cloudinary Image Upload
- 📱 Fully Responsive Design
- 🔒 Role-Based Route Protection
- 📊 Interactive Dashboards
- 📂 MongoDB Atlas Integration
- 🔔 Custom Toast Notifications
- ❓ Custom Confirmation Modals
- 🌐 REST API Based Architecture

---

# 📑 Table of Contents

- Project Overview
- Features
- User Modules
- Appointment Workflow
- Screenshots
- Tech Stack
- Project Structure
- Installation Guide
- Environment Variables
- API Overview
- Security Features
- Future Enhancements
- Author
- License


# ✨ Features

## 👤 Patient Module

The Patient Portal enables patients to conveniently manage their healthcare journey through a secure and user-friendly dashboard.

### Authentication

- Patient Registration
- Patient Login
- Secure JWT Authentication
- Protected Routes
- Secure Logout

### Dashboard

- Personalized Dashboard
- Appointment Statistics
- Upcoming Appointment Summary
- Latest Appointment Card
- Responsive Interface

### Profile Management

- View Profile Information
- Update Personal Details
- Upload Profile Photo
- Update Emergency Contact
- Manage Allergies
- Manage Medical History
- Real-time Profile Update

### Appointment Management

- Browse Available Doctors
- View Doctor Details
- Book Appointment
- Select Appointment Date
- Choose Available Time Slot
- Add Appointment Notes
- View Appointment History
- Track Appointment Status

---

## 👨‍⚕️ Doctor Module

The Doctor Portal provides doctors with complete control over appointments, availability, schedules, and profile management.

### Authentication

- Doctor Login
- JWT Protected Routes
- Secure Logout

### Dashboard

- Personalized Dashboard
- Appointment Overview
- Upcoming Appointment Summary

### Profile Management

- View Professional Details
- Update Doctor Profile
- Change Profile Picture
- Update Contact Information

### Slot Management

- Generate Daily Appointment Slots
- View Generated Slots
- Block Individual Slots
- Unblock Slots
- Prevent Duplicate Slot Generation
- View Slot Availability Status

### Appointment Management

- View Approved Appointments
- View Patient Information
- View Appointment Details
- Appointment Status Tracking

---

## 🛡️ Admin Module

The Administrator Portal provides complete control over the Hospital Management System.

### Dashboard

- System Overview
- Appointment Statistics
- Doctor Statistics
- Patient Statistics

### Doctor Management

- Add Doctor
- Update Doctor Details
- Upload Doctor Profile Image
- Delete Doctor
- Prevent Deletion if Appointment History Exists
- Manage Doctor Availability

### Patient Management

- View Registered Patients
- Delete Patients
- Prevent Deletion if Appointment History Exists

### Appointment Management

- View All Appointments
- Approve Appointments
- Reject Appointments
- Track Appointment Status
- Maintain Complete Appointment Workflow

---

## 🌐 Homepage

A modern and responsive landing page providing visitors with hospital information and services.

### Features

- Responsive Landing Page
- Hero Section
- About Hospital
- Hospital Services
- Dynamic Doctor Listing
- Auto Sliding Doctor Cards
- Contact Form
- Privacy Policy
- Terms & Conditions
- Modern Responsive UI

---

## 🔐 Authentication & Security

- JWT Authentication
- Password Hashing using bcryptjs
- Role-Based Access Control (RBAC)
- Protected API Routes
- Authentication Middleware
- Role Middleware
- Secure Password Storage
- Token Verification
- Session Protection

---

## 📅 Appointment Workflow

The appointment process follows a real-world hospital workflow.

```text
Patient
      │
      ▼
Book Appointment
      │
      ▼
Appointment Created (Pending)
      │
      ▼
Admin Reviews Appointment
      │
      ├──────────────┐
      ▼              ▼
Approved         Rejected
      │
      ▼
Visible to Doctor
      │
      ▼
Doctor Consultation
      │
      ▼
Appointment Completed
```

---

## 🎯 Additional Features

- RESTful API Architecture
- MongoDB Atlas Database
- Cloudinary Image Upload
- Image Preview Before Upload
- Responsive Design
- Custom Toast Notifications
- Custom Confirmation Dialogs
- Client-side Form Validation
- Backend Validation
- Dynamic Dashboard Statistics
- Automatic Image Fallback
- Persistent Login Sessions
- Refresh-safe Authentication
- Clean Folder Structure
- Error Handling
- Loading Indicators
- Empty State Screens
- Professional User Interface


screenshots/
│
├── homepage.png
├── patient-dashboard.png
├── book-appointment.png
├── doctor-dashboard.png
├── doctor-slots.png
└── admin-dashboard.png



# ⚙️ Installation Guide

## 1️⃣ Clone the Repository

```bash
git clone https://github.com/yashkumar1907/Hospital-Management-System.git
```

Move into the project directory:

```bash
cd Hospital-Management-System
```

---

## 2️⃣ Backend Setup

Navigate to the backend folder:

```bash
cd BACKEND
```

Install all required dependencies:

```bash
npm install
```

---

## 3️⃣ Configure Environment Variables

Create a `.env` file inside the `BACKEND` directory.

Example:

```env
PORT=

MONGO_URI=

JWT_SECRET=

CLOUDINARY_CLOUD_NAME=

CLOUDINARY_API_KEY=

CLOUDINARY_API_SECRET=
```

> **Note:** Never commit your `.env` file to GitHub.

---

## 4️⃣ Start Backend Server

Development Mode

```bash
npm run dev
```

Production Mode

```bash
npm start
```

If everything is configured correctly, you should see:

```text
🚀 HMS Backend running on port 5000
MongoDB Connected Successfully
Environment: development
```

---

## 5️⃣ Frontend Setup

Open the project root.

Launch

```text
FRONTEND/homepage/homepage.html
```

using **Live Server** (VS Code) or any local web server.

---

# 🌍 Deployment

## Backend

Deployed on **Render**

Features:

- REST APIs
- MongoDB Atlas Connection
- Cloudinary Integration
- Environment Variable Support
- Automatic Deployment from GitHub

---

## Frontend

Can be hosted on:

- Render Static Site
- GitHub Pages
- Netlify
- Vercel

---

# 🔑 Environment Variables

The backend requires the following environment variables.

| Variable | Description |
|-----------|-------------|
| PORT | Backend Port |
| MONGO_URI | MongoDB Atlas Connection String |
| JWT_SECRET | Secret Key for JWT Authentication |
| CLOUDINARY_CLOUD_NAME | Cloudinary Cloud Name |
| CLOUDINARY_API_KEY | Cloudinary API Key |
| CLOUDINARY_API_SECRET | Cloudinary API Secret |

---

# 🚀 Running the Application

### Start Backend

```bash
cd BACKEND

npm install

npm run dev
```

---

### Start Frontend

Run the homepage using Live Server:

```text
FRONTEND/homepage/homepage.html
```

---

# 🌐 Application Modules

The project contains three independent user portals.

## 👤 Patient Portal

Features:

- Register
- Login
- Dashboard
- Profile
- Book Appointment
- Appointment History

---

## 👨‍⚕️ Doctor Portal

Features:

- Login
- Dashboard
- Profile
- Manage Slots
- View Approved Appointments

---

## 🛡️ Admin Portal

Features:

- Dashboard
- Doctor Management
- Patient Management
- Appointment Management
- Appointment Approval

---

# 📡 REST API Overview

## Authentication

### Patient

| Method | Endpoint |
|----------|----------|
| POST | `/api/patients/register` |
| POST | `/api/patients/login` |

---

### Doctor

| Method | Endpoint |
|----------|----------|
| POST | `/api/doctors/login` |

---

### Contact

| Method | Endpoint |
|----------|----------|
| POST | `/api/contact` |

---

### Patient APIs

| Method | Endpoint |
|----------|----------|
| GET | `/api/patients/profile` |
| PUT | `/api/patients/profile` |
| POST | `/api/patients/book-appointment` |
| GET | `/api/patients/appointments` |

---

### Doctor APIs

| Method | Endpoint |
|----------|----------|
| GET | `/api/doctors/profile` |
| PUT | `/api/doctors/profile` |
| GET | `/api/doctors/appointments` |

---

### Doctor Slot APIs

| Method | Endpoint |
|----------|----------|
| POST | `/api/doctor-slots/generate` |
| GET | `/api/doctor-slots/my-slots/:date` |
| GET | `/api/doctor-slots/available/:doctorId/:date` |
| PATCH | `/api/doctor-slots/block/:slotId` |
| PATCH | `/api/doctor-slots/unblock/:slotId` |

---

### Admin APIs

| Method | Endpoint |
|----------|----------|
| GET | `/api/admin/dashboard` |
| GET | `/api/admin/doctors` |
| POST | `/api/admin/doctors` |
| PUT | `/api/admin/doctors/:id` |
| DELETE | `/api/admin/doctors/:id` |
| GET | `/api/admin/patients` |
| DELETE | `/api/admin/patients/:id` |
| GET | `/api/admin/appointments` |
| PATCH | `/api/admin/appointments/:id` |



# 🔒 Security Features

The application follows several security best practices to ensure secure authentication, authorization, and data management.

## Authentication

- JWT (JSON Web Token) Authentication
- Secure Login System
- Protected Routes
- Automatic Session Validation
- Secure Logout

---

## Authorization

- Role-Based Access Control (RBAC)
- Patient Protected Routes
- Doctor Protected Routes
- Admin Protected Routes
- Middleware-based Access Verification

---

## Password Security

- Password Hashing using **bcryptjs**
- Plain Text Passwords Never Stored
- Secure Password Verification

---

## File Upload Security

- Cloudinary Image Storage
- Image Type Validation
- Maximum File Size Validation
- Default Image Fallback

---

## API Security

- JWT Token Verification
- Authentication Middleware
- Role Middleware
- Global Error Handling
- Invalid Route Handling

---

# 🏗️ System Workflow

The Hospital Management System follows a structured workflow similar to real-world healthcare systems.

## Patient Registration

```text
Patient
    │
    ▼
Register
    │
    ▼
Login
    │
    ▼
Dashboard
```

---

## Appointment Booking Workflow

```text
Patient
    │
    ▼
Select Doctor
    │
    ▼
Choose Date
    │
    ▼
Select Available Slot
    │
    ▼
Book Appointment
    │
    ▼
Appointment Status → Pending
```

---

## Appointment Approval Workflow

```text
Patient
      │
      ▼
Appointment Request
      │
      ▼
Administrator
      │
      ├──────────────┐
      ▼              ▼
Approve         Reject
      │
      ▼
Doctor Dashboard
      │
      ▼
Consultation
      │
      ▼
Completed
```

---

## Doctor Slot Workflow

```text
Doctor
     │
     ▼
Generate Slots
     │
     ▼
Available Slots
     │
     ├──────────────┐
     ▼              ▼
Blocked        Booked
```

---

# 🎯 Project Highlights

## Full Stack Development

✔ Frontend Development

✔ Backend Development

✔ REST API Development

✔ MongoDB Database Design

✔ Authentication System

✔ Role-Based Authorization

✔ Image Upload & Management

✔ Dashboard Development

✔ CRUD Operations

✔ Deployment

---

## Database Entities

The system manages multiple interconnected collections:

- Admin
- Patient
- Doctor
- Appointment
- Doctor Slot
- Contact Messages

---

## Core Functionalities

- User Authentication
- Profile Management
- Appointment Booking
- Appointment Approval
- Doctor Slot Management
- Contact Form
- Image Upload
- Dashboard Statistics
- Dynamic Doctor Listing
- Responsive User Interface

---

# 🧪 Testing Summary

The application has been manually tested across all major modules.

## Homepage

- ✅ Responsive Layout
- ✅ Doctor Listing
- ✅ Contact Form
- ✅ Image Loading

---

## Patient Module

- ✅ Registration
- ✅ Login
- ✅ Dashboard
- ✅ Profile Update
- ✅ Image Upload
- ✅ Appointment Booking
- ✅ Appointment History
- ✅ Latest Appointment
- ✅ Logout
- ✅ Route Protection

---

## Doctor Module

- ✅ Login
- ✅ Dashboard
- ✅ Profile Management
- ✅ Slot Generation
- ✅ Block Slots
- ✅ Unblock Slots
- ✅ Appointment Management
- ✅ Logout

---

## Admin Module

- ✅ Dashboard
- ✅ Add Doctor
- ✅ Update Doctor
- ✅ Delete Doctor
- ✅ Prevent Doctor Deletion with Appointment History
- ✅ Delete Patient
- ✅ Prevent Patient Deletion with Appointment History
- ✅ Appointment Approval
- ✅ Appointment Status Management

---

## Overall Status

- ✅ Backend APIs Tested
- ✅ Database Operations Verified
- ✅ Authentication Tested
- ✅ CRUD Operations Verified
- ✅ Image Upload Verified
- ✅ MongoDB Persistence Verified
- ✅ Refresh Persistence Verified
- ✅ Deployment Verified

---

# 🚀 Future Enhancements

The following features can further improve the application:

- 💳 Online Payment Gateway Integration
- 📧 Email Appointment Notifications
- 📱 SMS Appointment Reminders
- 📄 Medical Report Upload
- 💊 Digital Prescription Management
- 🎥 Video Consultation
- 📅 Doctor Calendar Integration
- 📈 Admin Analytics Dashboard
- 🤖 AI-Based Appointment Recommendation
- 🔔 Real-Time Notifications
- 📲 Progressive Web App (PWA)
- 🌍 Multi-Language Support
- 🌙 Dark Mode
- ⭐ Doctor Ratings & Reviews
- 📋 Electronic Medical Records (EMR)




# 🤝 Contributing

Contributions are welcome!

If you would like to improve this project, feel free to:

- Fork the repository
- Create a new feature branch
- Commit your changes
- Push your branch
- Open a Pull Request

Any suggestions, improvements, or bug fixes are greatly appreciated.

---

# ⭐ Show Your Support

If you found this project helpful or learned something from it, please consider giving it a ⭐ on GitHub.

It helps motivate future development and makes the repository more visible to others.

---

# 💡 What I Learned

Building this project helped me gain practical experience in:

- Designing RESTful APIs
- Full Stack Web Development
- Authentication using JWT
- Role-Based Access Control (RBAC)
- MongoDB Database Design
- Cloudinary Image Upload Integration
- Express.js Middleware
- CRUD Operations
- Responsive UI Development
- Client & Server-side Validation
- Git & GitHub Workflow
- Deploying Applications on Render
- Building Multi-Role Dashboard Applications

---

# 🎓 Project Purpose

This project was developed as a full-stack learning project to understand how a real-world Hospital Management System works.

The primary objectives were:

- Apply Full Stack Development concepts
- Practice Backend API Development
- Implement Authentication & Authorization
- Design MongoDB Database Models
- Learn Image Upload using Cloudinary
- Build Role-Based Dashboards
- Develop a complete CRUD-based application
- Gain experience with project deployment

---

# 📈 Project Statistics

| Feature | Status |
|---------|--------|
| Frontend | ✅ Complete |
| Backend | ✅ Complete |
| REST APIs | ✅ Complete |
| MongoDB Integration | ✅ Complete |
| JWT Authentication | ✅ Complete |
| Role-Based Access | ✅ Complete |
| Doctor Slot Management | ✅ Complete |
| Appointment Workflow | ✅ Complete |
| Cloudinary Integration | ✅ Complete |
| Responsive Design | ✅ Complete |
| Deployment | ✅ Complete |

---

# 📞 Contact

**Yash Kumar**

📧 Email: *your-email@example.com*

💼 GitHub: https://github.com/yashkumar1907

LinkedIn: *Add your LinkedIn profile (optional)*

Portfolio: *Add your portfolio website (optional)*

---

# 🙏 Acknowledgements

This project was built using the following amazing technologies and services:

- HTML5
- CSS3
- JavaScript (ES6)
- Node.js
- Express.js
- MongoDB Atlas
- Mongoose
- JWT
- bcryptjs
- Cloudinary
- Multer
- Render
- GitHub
- Visual Studio Code

Special thanks to the open-source community for providing excellent tools and documentation that made this project possible.

---

# 📄 License

This project is licensed under the **MIT License**.

Feel free to use this project for learning, educational purposes, and personal development.

---

# 🌟 Thank You

Thank you for visiting this repository!

If you like this project, don't forget to **⭐ Star the repository** and share your feedback.

Happy Coding! 🚀