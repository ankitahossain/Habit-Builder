# Habit Builder: Gamified Daily Habit Tracking Web Application

**Student:** [Your name]  
**Student ID:** [Your ID]  
**Module:** [Module name]  
**Tutor:** [Tutor name]  
**Submission date:** [Date]

> Replace bracketed fields, add screenshots from your own running application, and update the evaluation with real test results. Do not claim a test or deployment succeeded unless you performed it.

## Abstract
Habit Builder is a responsive web application designed to help students and working adults build consistent routines. It combines scheduled habits, daily check-offs, streak tracking, a calendar heatmap, and weekly analytics in one interface. The application uses React for the client, an Express REST API for server-side operations, and PostgreSQL for persistent data storage. Passwords are hashed before storage and authenticated routes use JSON Web Tokens.

## 1. Introduction
Busy users may forget routines or lose motivation after missing a day. Habit Builder aims to make daily tracking quick and progress visible. The design follows the project requirements: a user should be able to check off a habit quickly, see progress, and review consistency over time.

### Objectives
- Provide registration and login.
- Let users create, read, update, and delete habits.
- Record daily completions without duplicate logs.
- Calculate current and longest streaks.
- Visualise completion history in a heatmap.
- Summarise the last seven days with a chart.
- Provide a responsive and accessible interface.
- Apply validation and basic security practices.

## 2. Requirements
### Functional requirements
1. Register and log in.
2. Create habits with a name, frequency, target time, description, and colour.
3. Edit and delete owned habits.
4. Mark a habit complete or undo the completion for a date.
5. Show completion percentage and habit totals.
6. Calculate streaks for daily, weekday, and weekly schedules.
7. Display a 12-week activity map.
8. Display weekly analytics.

### Non-functional requirements
- Responsive layout for mobile and desktop.
- Password hashing and authenticated API access.
- Input validation and useful error messages.
- Database constraints to prevent duplicate daily logs.
- Maintainable source code and version-control-ready structure.

## 3. System design
### Architecture
```text
React + Vite browser client
          |
          | HTTPS / JSON REST
          v
Node.js + Express API
   |          |          |
   v          v          v
PostgreSQL  JWT/Bcrypt  Reminder scheduler scaffold
```

### Technology choices
- **React + Vite:** component-based interface and fast development server.
- **Tailwind CSS:** utility-based styling setup, with additional custom CSS for the visual system.
- **Recharts:** weekly analytics charts.
- **Express:** REST endpoints and middleware.
- **PostgreSQL:** relational storage, foreign keys, and uniqueness constraints.
- **bcrypt:** password hashing.
- **JWT:** stateless API authentication.
- **Zod:** server-side input validation.
- **node-cron:** scheduling foundation for reminders.

## 4. Database design
- **users:** account identity, email, password hash, timezone, creation time.
- **habits:** owner, name, description, frequency, target time, colour, archived state.
- **habit_logs:** habit, user, date, completion flag; unique `(habit_id, habit_date)` constraint.
- **reminders:** habit, owner, reminder time, enabled state.

The foreign keys use cascading deletion so a user's dependent habit records do not remain orphaned. Email uniqueness prevents duplicate accounts.

## 5. Implementation
### Authentication
The API validates registration and login inputs, hashes new passwords with bcrypt, and issues a time-limited JWT. Protected endpoints verify the token and use the token's user ID to scope database queries.

### Habit management
The client provides a form to add or edit a habit. The API validates habit fields and associates the habit with the authenticated user. A user can only edit or delete their own habits.

### Daily checklist
A completion request uses a date-specific endpoint. PostgreSQL's unique constraint and `ON CONFLICT` handling make repeated completion requests idempotent. Undoing a completion removes that date's log.

### Streaks
The streak helper counts completed scheduled days and skips unscheduled days for weekday/weekly routines. Unit tests cover daily streaks, missed days, and weekday schedules. Before submission, add tests for month/year boundaries, future dates, timezone changes, and the exact rules agreed with your tutor.

### Heatmap and analytics
The client combines recorded logs to render a recent activity map. The backend weekly endpoint groups planned and completed habit check-ins over seven days. These visuals are intended to support reflection rather than penalise a user for missed routines.

### Reminders
The current code includes a scheduler integration point, not a fully delivered Web Push service. To complete this requirement, implement VAPID key configuration, service-worker registration, subscription storage, timezone-aware due-time queries, delivery deduplication, and tests that verify real delivery. Clearly describe this limitation if those items are not completed.

## 6. Testing plan
Record the actual result of every test after running it.

| Test ID | Scenario | Expected result | Actual result |
|---|---|---|---|
| T01 | Register with valid details | Account created and token returned | [Run and record] |
| T02 | Register duplicate email | Clear conflict response | [Run and record] |
| T03 | Login with incorrect password | 401 response without revealing account details | [Run and record] |
| T04 | Request protected route without token | 401 response | [Run and record] |
| T05 | Create a habit with a valid name | Habit saved to database | [Run and record] |
| T06 | Submit a blank habit name | Validation error | [Run and record] |
| T07 | Complete a habit twice for the same date | One log for that date | [Run and record] |
| T08 | Undo a completed habit | Date log removed | [Run and record] |
| T09 | Miss a scheduled day | Current streak breaks according to defined rule | [Run and record] |
| T10 | Weekday habit across a weekend | Weekend does not break weekday streak | [Run and record] |
| T11 | Open dashboard on mobile width | Layout remains usable | [Run and record] |
| T12 | Deploy frontend over HTTPS | App loads without mixed-content errors | [Run and record] |

### Running automated tests
```bash
cd server && npm test
cd client && npm install && npm test -- --run
```

## 7. Evaluation
Evaluate the system against the project success measures:
- **Fast check-off:** measure the number of user actions needed to complete a habit.
- **Streak accuracy:** compare displayed streaks with hand-calculated test cases.
- **Reminder reliability:** only report a delivery rate after testing real push delivery.
- **Usability:** ask 3–5 participants to perform common tasks and record feedback with consent.

Add screenshots and real observations here. Do not invent user-test results.

## 8. Limitations and future work
- Complete Web Push and timezone-aware reminder delivery.
- Add timezone selection and more rigorous date-boundary handling.
- Add password reset and account deletion flows.
- Improve accessibility testing and keyboard navigation.
- Add integration tests with a disposable PostgreSQL database.
- Add CI checks and deployment configuration.

## 9. Conclusion
Habit Builder brings routine management and progress visualisation into a single interface. The architecture separates the React client, Express API, and PostgreSQL persistence layer. Further testing and completion of the push-notification workflow are necessary before treating the system as production-ready.

## References
- React documentation: https://react.dev/
- Express documentation: https://expressjs.com/
- PostgreSQL documentation: https://www.postgresql.org/docs/
- MDN Web Push API: https://developer.mozilla.org/en-US/docs/Web/API/Push_API
- Recharts documentation: https://recharts.org/
