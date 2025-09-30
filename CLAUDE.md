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

This is a static web application. No build, lint, or test commands are available.

**To run the application:**
- Open `index.html` for Project Management System
- Open `lms.html` for Learning Management System
- Open `admin.html` for Admin Dashboard

## Important Implementation Notes

- All data is stored in browser localStorage - no backend required
- Admin system includes video upload functionality for course lessons
- Korean language interface throughout the application
- Cross-page data sharing via localStorage between LMS and Admin systems
- No external dependencies - pure vanilla JavaScript implementation