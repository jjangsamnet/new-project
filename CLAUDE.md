# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a multi-page web application system with three main components:

1. **Project Management System** (`index.html`, `script.js`, `styles.css`)
   - CRUD operations for projects with status tracking (기획, 진행중, 완료, 보류)
   - Dashboard with statistics and filtering capabilities
   - Local storage persistence for project data

2. **Learning Management System (LMS)** (`lms.html`, `lms-script.js`, `lms-styles.css`)
   - Online education platform with course catalog
   - User authentication (login/register modals)
   - Course enrollment system with payment flow
   - Category-based course filtering (programming, design, business, language)

3. **Admin Dashboard** (`admin.html`, `admin-script.js`, `admin-styles.css`)
   - Administrative interface for managing LMS content
   - Course management with lesson video upload capabilities
   - User and enrollment management
   - Site settings and analytics dashboard
   - Admin authentication (hardcoded credentials: username: `jjangsam`, password: `16181618wkd`)

## Architecture

- **Frontend-only application**: Pure HTML, CSS, and Vanilla JavaScript
- **Data persistence**: LocalStorage for all data (projects, courses, users, enrollments, settings)
- **Class-based JavaScript**: Each system uses a main class (`ProjectManager`, `LMSSystem`, `AdminSystem`)
- **Modal-based UI**: Extensive use of modals for forms and detailed views
- **Responsive design**: CSS Grid and Flexbox layouts

## Key Data Structures

### Project Management
- Projects stored in localStorage as `projects` array
- Each project has: id, name, description, status, priority, dates, team, progress

### LMS System
- Courses: `lms_courses` in localStorage
- Users: `lms_users` in localStorage
- Enrollments: `lms_enrollments` in localStorage
- Settings: `lms_settings` in localStorage

## Development Commands

This is a static web application with Firebase backend integration.

**To run the application:**
- Open `index.html` for Project Management System
- Open `lms.html` for Learning Management System
- Open `admin.html` for Admin Dashboard
- Open `firebase-test.html` for Firebase connection testing

**Firebase Setup (Security Important!):**

⚠️ **SECURITY WARNING**: Never commit real API keys to the repository!

1. **Copy the configuration template:**
   ```bash
   cp firebase-config.example.js firebase-config.local.js
   ```

2. **Edit `firebase-config.local.js` with your actual Firebase project settings:**
   - Get configuration from Firebase Console → Project Settings → General → Your apps
   - Replace all placeholder values with real ones

3. **Recommended Firebase project setup:**
   - Region: `asia-southeast1` (Singapore) or your preferred region
   - Services: Authentication, Firestore, Storage, Analytics
   - Security Rules: Configure appropriate read/write permissions

4. **Files to configure:**
   - `firebase-config.local.js` (your actual config - NOT committed to git)
   - `firebase-config.js` (template file - safe to commit)
   - `firebase-config.example.js` (example file for developers)

## Important Implementation Notes

- **Hybrid Data Storage**: Firebase Firestore for cloud data with localStorage fallback
- **Authentication**: Firebase Authentication with email/password
- **File Storage**: Firebase Storage for video uploads with Base64 fallback
- **Offline Support**: Automatic fallback to localStorage when Firebase is unavailable
- **Admin System**: Includes video upload functionality for course lessons
- **Korean Language**: Interface throughout the application
- **Cross-page Data Sharing**: Real-time synchronization via Firebase between LMS and Admin systems
- **No Build Process**: Pure vanilla JavaScript with Firebase SDK