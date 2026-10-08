# SVEC LAB SCHEDULER
## Sri Vasavi Engineering College — Laboratory Scheduling & Booking Web Application

**Official College-Grade Production System**  
**Version:** 2.0 Production  
**Institution:** Sri Vasavi Engineering College (Autonomous), Pedatadepalli, Tadepalligudem  

---

## 1. Executive Summary

**SVEC Lab Scheduler** is a centralized, production-ready web application developed specifically for **Sri Vasavi Engineering College** to manage laboratory availability, academic lab-session allocations, and double-booking prevention across all engineering and polytechnic departments.

The system is built in strict adherence to:
1. `Lab_Scheduler_System_Specification_V2.0.docx`
2. `LABS & CAPACITY.xlsx` (All 29 Laboratories & Capacities loaded verbatim)

---

## 2. Key Architecture & Technical Stack

### Frontend
- **Framework:** React 19 with TypeScript & Vite
- **Styling:** Tailwind CSS v4 & Lucide Icons
- **Routing:** React Router v6 (Client-side routing with Public, Protected, and Admin guards)
- **Aesthetics:** Academic institutional design system, responsive data tables, desktop availability matrix, mobile card-based schedule, accessible status badges, loading skeletons, confirmation dialogs, and toast notifications.

### Backend & Database
- **Server:** Node.js & Express 5 API
- **Database Engine:** SQLite (via `better-sqlite3`) configured with Write-Ahead Logging (`WAL` mode), Foreign Key Enforcement (`PRAGMA foreign_keys = ON`), and Busy Timeout serialization.
- **Critical Concurrency Protection:** Partial unique index:
  ```sql
  CREATE UNIQUE INDEX idx_active_bookings_unique 
  ON bookings (lab_id, date, slot_id) 
  WHERE status = 'BOOKED';
  ```
- **Double-Booking Prevention:** Atomic database transactions (`BEGIN IMMEDIATE`). If two users submit the exact same slot concurrently, only the first committed transaction succeeds. The conflicting request is rejected with HTTP 409 and the exact required friendly message:  
  *“Sorry. This slot has just been booked by another user. Please select another available slot.”*
- **Authentication:** JWT Bearer tokens, bcryptjs salt hashing, role-based authorization middlewares (`authenticateToken`, `requireAdmin`).
- **Reports & Export:** In-memory streaming of dynamic CSV and Microsoft Excel (`.xlsx`) spreadsheets.

---

## 3. Verified Operating Hours (P1–P7)

As mandated by the specification correction, the operational college day consists of **exactly 7 bookable periods** and **one non-bookable lunch break**:

| Period | Start Time | End Time | Bookable Status |
| :--- | :--- | :--- | :--- |
| **P1** | 9:30 AM | 10:30 AM | Bookable |
| **P2** | 10:30 AM | 11:20 AM | Bookable |
| **P3** | 11:20 AM | 12:10 PM | Bookable |
| **P4** | 12:10 PM | 1:00 PM | Bookable |
| **BREAK** | 1:00 PM | 2:00 PM | **Non-Bookable (Lunch Break)** |
| **P5** | 2:00 PM | 2:50 PM | Bookable |
| **P6** | 2:50 PM | 3:40 PM | Bookable |
| **P7** | 3:40 PM | 4:30 PM | Bookable |

> **Note:** Period **P8 does NOT exist**. Exactly 7 bookable periods per laboratory day (Total of $29 \times 7 = 203$ daily bookable periods college-wide).

---

## 4. Complete Inventory of 29 College Laboratories

Loaded verbatim from `LABS & CAPACITY.xlsx` into the database:

| S.No | Department | Lab / Hall Name | Capacity | Building Block |
| :---: | :--- | :--- | :---: | :--- |
| 1 | PLACEMENT BLOCK | Y-LAB | 72 | Placement Block |
| 2 | PLACEMENT BLOCK | P-LAB | 72 | Placement Block |
| 3 | PLACEMENT BLOCK | O-LAB | 72 | Placement Block |
| 4 | PLACEMENT BLOCK | G-LAB | 72 | Placement Block |
| 5 | PLACEMENT BLOCK | B-LAB | 72 | Placement Block |
| 6 | CSE | JAMES GOSLING LAB | 72 | Visvesvaraya Block |
| 7 | CSE | EF CODD LAB | 72 | Visvesvaraya Block |
| 8 | CSE | PG-CP LAB | 72 | Visvesvaraya Block |
| 9 | CSE | ORAGNE-SEMINAR HALL | 144 | Visvesvaraya Block |
| 10 | CSE | YELLOW SEMINAR HALL | 144 | Visvesvaraya Block |
| 11 | AIML | COMPUTER LAB | 75 | Turing Block |
| 12 | AIML | LINUS TURVALDS LAB | 72 | Turing Block |
| 13 | AIML | SEMINAR HALL -1 | 144 | Turing Block |
| 14 | AIML | SEMINAR HALL -2 | 144 | Turing Block |
| 15 | ECE | ECAD LAB | 72 | Ramanujan Block |
| 16 | ECE | SIGNAL PROCESSING LAB | 70 | Ramanujan Block |
| 17 | ECE | R & d LAB | 35 | Ramanujan Block |
| 18 | ECE | JAGADISH CHANDRAA BOSE SEMINAR HALL | 140 | Ramanujan Block |
| 19 | MECH | CAD/CAM LAB | 72 | Mechanical Block |
| 20 | MECH | SEMINAR HALL-1 | 140 | Mechanical Block |
| 21 | MECH | SEMINAR HALL-2 | 140 | Mechanical Block |
| 22 | EEE | SIMULATION LAB | 76 | Faraday Block |
| 23 | POLYTECHNIC | COMPUTER LAB 1 | 66 | Polytechnic Block |
| 24 | POLYTECHNIC | COMPUTER LAB 2 | 66 | Polytechnic Block |
| 25 | POLYTECHNIC | CHANAKYA CONCLAVE HALL | 110 | Polytechnic Block |
| 26 | BSH | TECHNOLOGY ASSISTANT LAB | 40 | Basic Sciences Block |
| 27 | BSH | APJ ABDUL KALAM SEMINAR HALL | 140 | Basic Sciences Block |
| 28 | BSH | MAHATHMA GANDHI SEMINAR HALL | 60 | Basic Sciences Block |
| 29 | MBA | SEMINAR HALL | 120 | Management Block |

---

## 5. Seed Credentials & User Roles

The database is seeded with initial operational accounts:

### 1. System Administrator
- **Email:** `admin@svec.ac.in`
- **Password:** `Admin@SVEC2026`
- **Employee ID:** `SVEC-ADM-001`
- **Capabilities:**
  - View & manage all 29 laboratories
  - Schedule grid surveillance across any date
  - Reschedule / edit bookings with mandatory audit reason
  - Administratively cancel or delete bookings
  - Manage user directory (Roles: `user` <-> `administrator`, Status: `active` <-> `inactive`)
  - Manage master entities: Departments, Years, Batches, Subjects, Faculty, Time Slots
  - Access 6 institutional reports & export to CSV / Excel (.xlsx)
  - Inspect immutable audit trail with old vs. new payload snapshots
  - Configure college branding and allowed email domain restrictions

### 2. Faculty User
- **Email:** `faculty@svec.ac.in`
- **Password:** `Faculty@SVEC2026`
- **Employee ID:** `SVEC-FAC-001`
- **Name:** Dr. K. Srinivas (CSE)
- **Capabilities:**
  - View real-time schedule grid & availability
  - Book available slots (P1–P7) with academic parameters (Faculty, Year, Batch, Subject)
  - Pre-commit confirmation review before atomic booking
  - View own active & past bookings under `My Bookings`
  - Cancel own bookings (which releases the slot immediately)
  - Cannot edit bookings, cannot cancel other users' bookings, cannot access administrative pages

---

## 6. How to Run Locally

### Prerequisites
- Node.js (v18+)
- npm (v9+)

### Installation
From the project root (`/Users/Jagan-MacBookPro/.gemini/antigravity-ide/scratch/svec-lab-scheduler`):
```bash
# 1. Install root & server dependencies
npm install

# 2. Install client dependencies
npm --prefix client install

# 3. Seed database with 29 laboratories and master data
npm run seed

# 4. Build client production bundle
npm run client:build

# 5. Start development servers concurrently (Backend on 5050, Frontend on 5173)
npm run dev
```

### Direct Access URLs
- **Frontend Portal (Vite Dev):** `http://localhost:5173`
- **Full-Stack Integrated Server (Express + Static Dist):** `http://localhost:5050`
- **API Health Check:** `http://localhost:5050/api/health`

---

## 7. Automated Test Suite Verification

Run the comprehensive 26-point automated test suite:
```bash
node test_all_features.js
```

### Verified Test Results:
```
================================================================
   SVEC LAB SCHEDULER - END-TO-END AUTOMATED VERIFICATION SUITE  
   Sri Vasavi Engineering College (Production Grade System)      
================================================================

--- TEST 1: DATABASE LABS & TIME SLOTS ---
  [PASS] Exact 29 laboratories loaded from Excel (Found: 29)
  [PASS] James Gosling Lab capacity is exactly 72
  [PASS] Oragne Seminar Hall capacity is exactly 144
  [PASS] Exactly 8 slot records (P1-P7 + Break) (Found: 8)
  [PASS] P8 does NOT exist in the database
  [PASS] Lunch break (1:00 PM - 2:00 PM) is strictly non-bookable

--- TEST 2: AUTHENTICATION & SESSIONS ---
  [PASS] Administrator login succeeds with role "administrator"
  [PASS] Faculty user login succeeds with role "user"

--- TEST 3: SCHEDULE MATRIX OPERATIONAL VIEW ---
  [PASS] Schedule matrix endpoint returns success
  [PASS] Schedule grid contains all 29 laboratories
  [PASS] Schedule grid contains 8 periods per lab
  [PASS] Total daily bookable periods across 29 labs is 203 (29 * 7)

--- TEST 4: TRANSACTIONAL BOOKING ENGINE ---
  [PASS] Booking created successfully with ID LAB-000003

--- TEST 5: DATABASE-LEVEL DOUBLE BOOKING PREVENTION ---
  [PASS] Concurrent double booking attempt is rejected with HTTP 409 Conflict
  [PASS] Returns the exact mandated friendly error message on slot collision

--- TEST 6: LUNCH BREAK PROTECTION ---
  [PASS] Attempting to book Lunch Break (1:00 PM - 2:00 PM) is rejected with HTTP 400
  [PASS] Error message clarifies Lunch Break is non-bookable

--- TEST 7: AUTHORIZATION GUARDS ---
  [PASS] Normal user blocked from admin endpoints with HTTP 403

--- TEST 8: CANCELLATION & SLOT RELEASE ---
  [PASS] Cancellation succeeds and returns confirmation
  [PASS] Cancelled slot is immediately released and re-bookable

--- TEST 9: AUDIT LOGS IMMUTABILITY & RECORDING ---
  [PASS] Audit trail recorded all booking & cancellation transitions (Found: 2)

--- TEST 10: REPORTS & UTILIZATION FORMULA ---
  [PASS] Lab utilization report generated successfully
  [PASS] Formula strictly bases utilization on 7 bookable periods per day
  [PASS] All 29 laboratories measured in utilization report

--- TEST 11: EXPORTS (CSV & EXCEL) ---
  [PASS] CSV report export returns valid CSV stream
  [PASS] Excel (.xlsx) export returns valid spreadsheet stream

================================================================
VERIFICATION SUMMARY: 26 PASSED, 0 FAILED
================================================================
```

---

## 8. Final Acceptance Checklist Compliance

- [x] Authentication works (Login, Signup, Verify, Forgot, Reset)
- [x] Email verification flow works
- [x] Protected routes work (Client route guards & server token verification)
- [x] Normal user role works
- [x] Admin role works
- [x] Database works (Relational SQLite with WAL mode & foreign keys)
- [x] Excel lab data loaded (All 29 laboratories from `LABS & CAPACITY.xlsx`)
- [x] Capacities are correct (e.g. Orange Seminar Hall: 144, Gosling: 72, R&D Lab: 35)
- [x] P1–P7 exist (9:30 AM – 4:30 PM)
- [x] Break is correctly 1:00–2:00 PM and non-bookable
- [x] P8 does NOT exist
- [x] Schedule grid works (Desktop matrix & Mobile card view)
- [x] 4-Step booking workflow works
- [x] Booking pre-commit review works
- [x] Double booking prevented at database level (Partial unique index + transaction)
- [x] Concurrent booking handled with exact friendly collision error
- [x] Normal user cannot edit bookings
- [x] Normal user can cancel own bookings
- [x] Normal user cannot cancel another user's booking
- [x] Admin can manage all bookings, reschedule with audit reason, and cancel/delete
- [x] Admin can manage all 29 labs (Add, Edit, Soft activate/deactivate)
- [x] Admin can manage users (Change roles, toggle status)
- [x] Admin can manage master data (Departments, Years, Batches, Subjects, Faculty, Slots)
- [x] Reports work (6 distinct reports: Daily, Range, Utilization %, Faculty, Dept, Cancelled)
- [x] CSV & Excel (.xlsx) export works
- [x] Audit logs work (Immutable tracking of Created, Modified, Cancelled, Deleted)
- [x] Past slots blocked for normal users
- [x] Cancelled slots immediately released for future reservations
- [x] Search & multi-parameter filtering works
- [x] Pagination works
- [x] Loading skeleton states work
- [x] Error handling & confirmation dialogs work
- [x] Mobile, tablet, desktop responsive design works without horizontal page overflow
- [x] No fake buttons or placeholder links
- [x] Production build succeeds with 0 errors
