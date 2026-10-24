# MentorConnect – Viva Notes

## 1. Architecture in one picture

```
 Browser (React SPA)                    Express API (Node.js)                         MongoDB
 ───────────────────                    ─────────────────────                         ───────
 Page component
   │  calls service (e.g. requestService.create)
   ▼
 axios  ── POST /api/requests ──►  Vite proxy (dev) ──► app.js middleware chain:
 (withCredentials: sends                                 helmet → CORS allowlist → JSON (10kb)
  the httpOnly cookie)                                   → cookie-parser → mongo-sanitize
                                                         → requireDb (503 if DB down)
                                                         ▼
                                                       route: protect → restrictTo('student')
                                                              → validation rules → validate
                                                         ▼
                                                       controller (business rules) ── Mongoose ──► collections
                                                         ▼
 ◄──────────── JSON { success, message, data } ───────  respond / errorHandler
```

- **Frontend:** a single-page app. React Router chooses the page from the URL. `AuthContext` stores who is logged in. `useFetch` handles the loading, error and data states, and each page shows a skeleton, an error state with Retry, or an empty state.
- **Backend:** layered. **Routes** map URLs to middleware and controllers. **Middleware** handles cross-cutting concerns (auth, roles, validation, rate limits). **Controllers** hold the business rules. **Models** define and validate the data.
- **Database:** five collections: `users` (students and mentors in one collection, distinguished by `role`), `mentorshiprequests`, `sessions`, `messages`, `contactmessages`.

## 2. Why JWT in an httpOnly cookie (not localStorage)

- After login the server signs a JWT containing only the user id (`jwt.sign({ id }, JWT_SECRET, { expiresIn: '7d' })`) and sends it as a cookie with **`httpOnly`**, **`SameSite=Lax`**, and **`secure`** in production.
- **httpOnly:** JavaScript on the page cannot read the cookie. If an XSS bug ever let an attacker run script, they still could not steal the token. A token in `localStorage` can be read by any script.
- **SameSite=Lax:** the browser does not send the cookie on cross-site POST/PUT/DELETE requests, which blocks basic CSRF attacks.
- **secure:** the cookie travels only over HTTPS in production.
- The browser attaches the cookie automatically (axios `withCredentials: true`). On every protected request the `protect` middleware verifies the signature and expiry, then **loads the user fresh from MongoDB**. A deleted user is rejected immediately, and the user id always comes from the verified token, never from the request body.
- **Logout** clears the cookie. An expired or tampered token returns **401**. The frontend listens for 401s, clears the user and sends them to the login page.

## 3. How password hashing works

- Passwords are hashed with **bcrypt** (cost factor 12) before saving. Only `passwordHash` is stored, never the password itself.
- bcrypt generates a random **salt** per password, so two users with the same password get different hashes, and precomputed "rainbow tables" are useless.
- The cost factor makes each hash deliberately slow (about 0.2 s), so guessing millions of passwords is impractical.
- To log in, `bcrypt.compare(plain, hash)` re-hashes the attempt with the stored salt and compares the results.
- `passwordHash` has `select: false` in the schema, so normal queries never load it. It must be requested explicitly (`.select('+passwordHash')`), which only login and change-password do.
- Login failure always says **"Invalid email or password"**, so attackers cannot discover which emails are registered. Failed attempts are rate-limited (10 per 15 min per IP).

## 4. How role-based access is enforced

- **Registration** accepts only `student` or `mentor`. `admin` or any other value is rejected with 400, so nobody can make themselves an admin.
- **Server, three layers:**
  1. `protect`: must be logged in (401 otherwise).
  2. `restrictTo('mentor')`: must have the right role (403 otherwise). Example: a student calling `PUT /api/mentors/profile` gets 403.
  3. **Ownership in the query itself.** Example: `MentorshipRequest.findOne({ _id: id, mentor: req.user._id })`. Another mentor's request simply is not found (404), so users cannot act on, or even confirm the existence of, other people's data.
- **Client:** `ProtectedRoute` redirects a wrong role to its own dashboard and an anonymous visitor to `/login` (remembering the page they wanted). This is for user experience only. **Security lives on the server**, because anyone can call the API directly.

## 5. Request status state machine

```
             accept (mentor)              complete (mentor)
  pending ───────────────────► accepted ─────────────────────► completed
     │
     └────── reject (mentor) ──► rejected
```

- Defined once in `requestController.js` as a `TRANSITIONS` table: `{ accept: pending→accepted, reject: pending→rejected, complete: accepted→completed }`.
- Any other move (e.g. accepting twice, completing a pending request) returns **409 Conflict**.
- Only the mentor the request was sent to can change it.
- Duplicate active requests are blocked twice: a friendly check in the controller, plus a **partial unique index** `{ student, mentor }` where `status ∈ {pending, accepted}`. The index holds even if two requests arrive at the same instant. Rejected and completed requests are outside the index, so a student can ask again later.
- Side effects: completing a mentorship cancels its future sessions and lets the student leave one review. Sessions can only be created while the request is `accepted`. Messaging needs `accepted` or `completed`.

## 6. Other points worth mentioning

- **Validation everywhere:** express-validator on every input, Mongoose schema validation as a second net, and the same rules on the client for instant feedback.
- **Whitelisting:** profile updates use `matchedData()`, so only fields with a validation rule can be written. Sending `role` or `email` is silently ignored.
- **Injection protection:** `express-mongo-sanitize` removes `$` operators (blocks `{ "email": { "$gt": "" } }` login bypasses). Search text is regex-escaped. HTML tags are stripped from text.
- **Resilience:** missing env vars stop the server with a clear message. If MongoDB is down, the API still runs and answers **503**, retries the connection every 5 s, and recovers automatically. The UI shows "service unavailable" states instead of crashing.
- **Honest UI:** home-page stats are live database counts, testimonials are labelled as demo content, sample mentors carry a "Demo data" badge, and success messages appear only after the server confirms (e.g. the contact form checks for HTTP 201).
- **Performance:** pages are lazy-loaded, mentor lists are paginated on the server, and messages use 10-second polling that pauses when the browser tab is hidden.

## 7. Ten likely viva questions

1. **What is the MERN stack, and why use it here?**
   MongoDB, Express, React and Node.js. The whole application is JavaScript end to end, and JSON flows naturally from the database to the API to the UI. MongoDB's flexible documents suit profiles with nested lists such as education and experience.

2. **What happens, step by step, when a student clicks "Send request"?**
   The modal validates the input, then `requestService.create()` makes an axios POST to `/api/requests` with the cookie. Vite proxies it to Express. On the server: helmet, CORS and sanitising run first, then `protect` loads the user from the JWT and `restrictTo('student')` checks the role. Validation rules check the category and goals (20 or more characters). The controller checks that the mentor exists and is accepting students and that there is no active duplicate, then saves the document. The response is 201 `{ success, data: { request } }`, and the UI shows a toast and the "pending" state.

3. **Difference between authentication and authorization?**
   Authentication answers "who are you?" (login, JWT verification in `protect`). Authorization answers "what are you allowed to do?" (`restrictTo` roles, plus ownership checks inside queries).

4. **Why not store the JWT in localStorage?**
   Any script on the page can read localStorage, so an XSS bug would leak the token. An httpOnly cookie cannot be read by JavaScript, and SameSite=Lax limits CSRF.

5. **What is middleware in Express?**
   A function `(req, res, next)` that runs between receiving a request and sending a response. It can change `req`, end the response, or call `next()`. We chain helmet, cors, json parsing, sanitising, auth, role checks, validation and the error handler.

6. **How do you prevent duplicate mentorship requests, even under concurrency?**
   The application-level `findOne` check gives a friendly message, but two simultaneous requests could both pass it. The partial unique index in MongoDB guarantees only one active request per pair. The controller catches the duplicate-key error (code 11000) and returns 409.

7. **What is the virtual DOM / why React?**
   React keeps a lightweight copy of the UI in memory. When state changes, it re-renders components, compares the new tree with the old one, and updates only the changed parts of the real DOM. Components make the UI reusable (e.g. `MentorCard` on the home and search pages).

8. **How does search with filters work, and why put filters in the URL?**
   The frontend reads filters from the query string (`useSearchParams`) and debounces typing by 400 ms. The backend builds a MongoDB filter (escaped case-insensitive regex for search, exact match for category) and applies sort, skip and limit for pagination. URL state makes results shareable and bookmarkable, and the back button works.

9. **How are mentor recommendations calculated?**
   For each mentor who is accepting students, score = number of the student's skills found in the mentor's skills + number of the student's career interests found in the mentor's categories. Mentors the student is already connected to are excluded. The top 4 are shown with the matching items. If nothing matches, the most experienced mentors are shown, and the UI says so honestly.

10. **What happens if the database goes down during the demo?**
    The Express server keeps running. `requireDb` answers every data request with 503 and a friendly message, and `/api/health` reports `db: disconnected`. The connection logic retries every 5 seconds and reconnects automatically. The React app shows a "cannot reach the server" banner and per-section error states with Retry buttons, and the contact form shows an error instead of a fake success.

**Bonus quick answers**
- *REST?* Resources as URLs (`/api/sessions/:id`) with HTTP verbs (GET read, POST create, PUT/PATCH update, DELETE remove) and meaningful status codes.
- *CORS?* A browser rule that blocks a page from reading responses from another origin unless the server allows it. We allow only `CLIENT_URL`.
- *Why Mongoose?* Schemas, validation, defaults, indexes and `populate()` (joins) on top of MongoDB.
- *Why rate limiting?* It slows password guessing (login) and spam (contact form). Over the limit, the API returns 429.
