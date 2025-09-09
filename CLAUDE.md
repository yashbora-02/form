# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a DS-160 Helper Form application - a single-page web application that helps users fill out the DS-160 form (U.S. nonimmigrant visa application) by providing a structured interface with data persistence and preview capabilities.

## Architecture

**Core Files:**
- `index.html` - Main HTML document containing all form sections and navigation
- `app.js` - Single JavaScript module containing all application logic (287 lines)
- `style.css` - CSS styles with CSS custom properties and grid layouts

**Key Architectural Patterns:**
- Single-page application with section-based navigation
- Form data collected via FormData API and stored in localStorage
- Event delegation for dynamic content (repeatable rows, navigation)
- Section-based form organization with preview functionality
- Client-side data persistence with localStorage

## Development Commands

**Start development server:**
```bash
npm run dev
```
This runs live-server on port 8080 and opens index.html automatically.

**Project has no build process, linting, or testing setup currently configured.**

## Application Structure

**Navigation System:**
- Sidebar navigation with 18 different form sections
- Section switching via `showSection(id)` function
- Navigation buttons with data attributes for section targeting

**Form Sections:**
1. Personal Information (2 sections)
2. Travel Information
3. Travel Companions
4. Address & Phone
5. Passport Information
6. U.S. Contact Information
7. Family Information
8. Work/Education (3 sections: Present, Previous, Additional)
9. Security Questions (5 sections)
10. Student/SEVIS Information
11. Location Information
12. Preview Section

**Data Management:**
- `collectData()` - Aggregates form data from all sections
- `save()` - Persists data to localStorage and updates preview
- `load()` - Loads saved data (respects URL parameters for fresh/load modes)
- Auto-save on input changes
- Data confirmation system for verified fields

**Key Features:**
- Repeatable form rows with Add/Remove functionality
- Data persistence across sessions
- Field confirmation system with visual indicators
- Preview section with JSON display and grouped field view
- Print/PDF functionality
- Copy individual field values
- Fresh mode vs load mode via URL parameters

**URL Parameters:**
- `?fresh=1` or `?mode=fresh` - Start with blank form
- `?load=1` or `?mode=load` - Load saved data
- Default behavior is fresh mode (blank form)

## Data Storage

**localStorage Keys:**
- `ds160-helper-data-v1` - Form data storage
- `ds160-helper-confirmed-v1` - Field confirmation states

**Data Structure:**
Form data is collected as flat key-value pairs where repeated fields become arrays automatically.

## Styling Approach

Uses CSS custom properties for theming with a dark header and light content area. Grid layouts for form fields with responsive design patterns.