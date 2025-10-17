# AI-Powered Job Application Form

A production-ready, multi-step job application form built with Next.js 15, featuring AI-assisted resume parsing and text improvement capabilities. Designed for deployment on Cloudflare Workers.

## 🚀 Features

- **Magic Link Authentication** - Secure, passwordless authentication system
- **Multi-Step Form** - Intuitive 5-step application process with auto-save
- **AI Resume Parsing** - Extract structured data from resumes using Google Gemini AI
- **AI Text Improvement** - Enhance application responses with AI suggestions
- **Rate Limiting** - Smart rate limiting (10 AI requests per 5 minutes)
- **Progress Persistence** - Automatic form progress saving and restoration
- **Modern UI** - Beautiful, responsive design with Tailwind CSS 4
- **Type-Safe** - Full TypeScript with strict mode
- **Production-Ready** - Built for Cloudflare Workers deployment

## 📋 Technology Stack

- **Framework**: Next.js 15 (App Router) + React 19
- **Language**: TypeScript (Strict Mode)
- **Styling**: Tailwind CSS 4
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Custom Magic Link + Database Sessions
- **AI**: Google Gemini 1.5 Flash
- **Validation**: Zod
- **Forms**: React Hook Form
- **State**: Zustand
- **Testing**: Playwright
- **Deployment**: Cloudflare Workers

## 🏗️ Architecture Overview

This application follows a modern serverless architecture with clear separation of concerns:

### Authentication Flow

1. **Magic Link Generation**: User enters email → Server generates unique token → Token stored in database with 15-minute expiry
2. **Link Verification**: User clicks link → Server validates token → Creates session with 7-day expiry → Sets HTTP-only cookie
3. **Session Management**: Each request checks session cookie → Validates against database → Updates last activity timestamp
4. **Security**: Tokens are single-use, sessions use SHA-256 hashing, cookies are HTTP-only with SameSite=strict

### Database Architecture

**Choice: Supabase (PostgreSQL)**

**Why Supabase?**
- ✅ PostgreSQL is battle-tested and ACID-compliant
- ✅ Built-in Row Level Security (RLS) for data isolation
- ✅ Real-time capabilities (future enhancement)
- ✅ Generous free tier (500MB, 50k MAU)
- ✅ Automatic backups and point-in-time recovery
- ✅ Fast setup with managed infrastructure

**Alternative Considered: MongoDB**
- ❌ Overkill for structured form data
- ❌ Less mature type safety
- ❌ RLS not as robust

### Database Schema Design

**6 Core Tables:**

1. **users** - User accounts with email
   - Simple, email-only identification
   - UUID primary keys for security
   - Auto-updating timestamps

2. **sessions** - Active user sessions
   - Token hashed with SHA-256 before storage
   - Includes IP and user agent for security tracking
   - Indexed on token and expiry for fast lookups
   - 7-day expiry with automatic cleanup

3. **magic_link_tokens** - One-time authentication tokens
   - 15-minute expiry window
   - Single-use enforcement via `used_at` timestamp
   - Automatic cleanup of expired tokens

4. **form_progress** - Draft form data (auto-save)
   - JSONB for flexible schema
   - One draft per user (UNIQUE constraint)
   - Stores current step for navigation
   - Auto-updates `last_saved_at` timestamp

5. **form_submissions** - Completed applications
   - JSONB for form data (immutable after submission)
   - Multiple submissions allowed per user
   - Indexed for fast user query

6. **ai_usage** - AI request tracking
   - Token usage tracking (prompt + response)
   - Feature type categorization
   - Success/error logging
   - Enables rate limiting and analytics

**Design Decisions:**
- JSONB for form data: Allows schema evolution without migrations
- Separate progress/submissions: Clear draft vs final distinction
- Token hashing: Never store raw tokens
- Indexes on hot paths: Token lookups, user queries, time-based cleanup

Full schema with indexes and RLS policies available in `supabase-schema.sql` and `SCHEMA.md`.

### API Design

**RESTful Design Principles:**
- Resource-based URLs (`/api/forms/progress`)
- HTTP methods match intent (GET=read, POST=write)
- Consistent error responses (JSON with status codes)
- Authentication via HTTP-only cookies

**API Routes:**

**Authentication** (`/api/auth/*`)
- `POST /api/auth/start` - Generate magic link and send to email
  - Input: `{ email: string }`
  - Output: `{ success: boolean }`
  - Creates token, stores in DB (15min expiry)
  
- `POST /api/auth/verify` - Verify magic link token and create session
  - Input: `{ token: string }`
  - Output: `{ success: boolean, redirectUrl: string }`
  - Validates token, creates session, sets cookie
  
- `GET /api/auth/session` - Check current authentication status
  - Output: `{ authenticated: boolean, user?: { id, email } }`
  - Used by client for auth state management
  
- `POST /api/auth/logout` - Destroy current session
  - Output: `{ success: boolean }`
  - Deletes session from DB, clears cookie

**Forms** (`/api/forms/*`)
- `GET /api/forms/progress` - Retrieve saved draft
  - Requires auth
  - Returns: `{ formData: object, currentStep: number }`
  
- `POST /api/forms/save` - Auto-save form progress
  - Input: `{ formData: object, currentStep: number }`
  - Upserts to form_progress table
  - Called on step navigation and periodically
  
- `POST /api/forms/submit` - Submit completed form
  - Input: Complete form data (validated with Zod)
  - Creates immutable submission record
  - Clears draft from form_progress
  
- `GET /api/forms/submissions` - List user's submissions
  - Returns array of submissions with timestamps

**AI Features** (`/api/ai/*`)
- `POST /api/ai/autofill` - Parse resume and extract structured data
  - Input: `{ resumeText: string }`
  - Uses Gemini 1.5 Flash with structured output
  - Rate limited (10 req/5min per user)
  
- `POST /api/ai/improve` - Enhance text professionally
  - Input: `{ text: string, fieldName: string }`
  - Context-aware prompting based on field
  - Rate limited
  
- `GET /api/ai/usage` - Check rate limit status
  - Returns: `{ remaining: number, resetAt: string }`
  - Used to show rate limit UI

## 🔧 Setup Instructions

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account
- Google Gemini API key

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the schema from `supabase-schema.sql`
3. Get your project URL and API keys from Settings > API

### 3. Get Google Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create an API key for Gemini API
3. Copy the API key

### 4. Configure Environment Variables

Copy `.env.local.example` to `.env.local` and fill in the values:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Google Gemini AI
GEMINI_API_KEY=your-gemini-api-key

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
SESSION_SECRET=your-random-32-char-secret
```

Generate a secure `SESSION_SECRET`:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🧪 Testing

Run E2E tests with Playwright:

```bash
# Run tests
npm run test:e2e

# Run tests with UI
npm run test:e2e:ui
```

## 🚀 Deployment

### Deploy to Cloudflare Workers

1. Install Wrangler CLI:
```bash
npm install -g wrangler
```

2. Login to Cloudflare:
```bash
wrangler login
```

3. Set secrets:
```bash
wrangler secret put NEXT_PUBLIC_SUPABASE_URL
wrangler secret put NEXT_PUBLIC_SUPABASE_ANON_KEY
wrangler secret put SUPABASE_SERVICE_ROLE_KEY
wrangler secret put GEMINI_API_KEY
wrangler secret put SESSION_SECRET
```

4. Build and deploy:
```bash
npm run pages:build
npm run pages:deploy
```

## 📖 User Guide

### For Applicants

1. **Login**: Enter your email to receive a magic link
2. **Step 1 - Personal Info**: Fill in basic details or import from resume
3. **Step 2 - Experience**: Describe your work history, use AI to improve text
4. **Step 3 - Skills**: List technical skills and languages
5. **Step 4 - Motivation**: Explain your interest and availability
6. **Step 5 - Review**: Review all information and submit

### AI Features

**Resume Import**
- Click "Import from Resume" on Step 1
- Paste your resume text
- AI extracts structured data automatically
- Review and accept to populate form fields

**Text Improvement**
- Enter your text in any textarea field
- Click "Improve with AI" button
- AI enhances your text professionally
- Review and accept the improved version

**Rate Limits**
- 10 AI requests per 5-minute window
- Remaining requests shown in UI
- Resets automatically after 5 minutes

## 🏗️ Project Structure

```
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── auth/              # Auth pages
│   ├── form/              # Form page
│   ├── login/             # Login page
│   └── success/           # Success page
├── components/            # React components
│   └── forms/            # Form step components
├── lib/                   # Utilities and config
│   ├── auth.ts           # Auth utilities
│   ├── gemini.ts         # AI integration
│   ├── rate-limit.ts     # Rate limiting
│   ├── schemas.ts        # Zod schemas
│   ├── store.ts          # Zustand stores
│   ├── supabase.ts       # Supabase client
│   └── types.ts          # TypeScript types
├── tests/                 # Playwright tests
├── supabase-schema.sql   # Database schema
└── wrangler.toml         # Cloudflare config
```

## 🔐 Security Features

- **HTTP-only cookies** - Session tokens inaccessible to JavaScript
- **Secure tokens** - SHA-256 hashed session storage
- **Row Level Security** - Database-level access control
- **Input validation** - Server-side Zod validation
- **Rate limiting** - Prevents AI API abuse
- **CSRF protection** - SameSite cookie policy

## 🐛 Troubleshooting

### Magic Link Not Working

- Check that `NEXT_PUBLIC_APP_URL` matches your deployment URL
- Verify Supabase connection and credentials
- Check database for expired tokens

### AI Features Not Working

- Verify `GEMINI_API_KEY` is set correctly
- Check rate limit status at `/api/ai/usage`
- Review browser console for errors

### Form Not Saving

- Check authentication status
- Verify Supabase connection
- Check browser console for API errors

## 🤔 Trade-offs & Design Decisions

### 1. **Magic Link vs Password Authentication**

**Chose: Magic Link**
- ✅ Better UX (no password to remember)
- ✅ More secure (no weak passwords, no password reuse)
- ✅ Simpler implementation (no password hashing, reset flows)
- ❌ Requires email delivery (could fail)
- ❌ Slight inconvenience (need to check email)

**Trade-off**: Prioritized security and UX over instant access

### 2. **Supabase vs Custom Backend**

**Chose: Supabase**
- ✅ Faster development (managed PostgreSQL)
- ✅ Built-in RLS security
- ✅ Free tier suitable for MVP
- ❌ Vendor lock-in
- ❌ Less control over infrastructure

**Trade-off**: Speed to market over full control

### 3. **JSONB for Form Data**

**Chose: JSONB over normalized tables**
- ✅ Schema flexibility (easy to add fields)
- ✅ Simpler queries (one table lookup)
- ✅ Perfect for unstructured form data
- ❌ Harder to query individual fields
- ❌ Less type safety at DB level

**Trade-off**: Flexibility and speed over strict structure

### 4. **Direct API Calls vs Gemini SDK**

**Chose: Direct REST API calls**
- ✅ No version compatibility issues
- ✅ Full control over requests
- ✅ Better error handling
- ✅ Easier debugging
- ❌ More boilerplate code
- ❌ Manual request construction

**Trade-off**: Stability and control over convenience

### 5. **Client-Side State (Zustand) vs Server State Only**

**Chose: Hybrid approach**
- ✅ Optimistic UI updates
- ✅ Instant navigation between steps
- ✅ Better UX during auto-save
- ❌ More complex state synchronization
- ❌ Potential for state drift

**Trade-off**: UX responsiveness over simplicity

### 6. **Rate Limiting in Database vs Redis**

**Chose: Database (PostgreSQL)**
- ✅ No additional infrastructure
- ✅ Persistent tracking
- ✅ Free tier sufficient
- ❌ Slower than Redis
- ❌ More DB queries

**Trade-off**: Simplicity over extreme performance

### 7. **E2E Tests Only (No Unit Tests)**

**Chose: Playwright E2E tests**
- ✅ Tests real user flows
- ✅ Catches integration issues
- ✅ Faster to write for this scale
- ❌ Slower test execution
- ❌ Less coverage of edge cases

**Trade-off**: Practical testing over comprehensive coverage

## 🚀 What I Would Improve With More Time

### High Priority (Production Essentials)

1. **Email Delivery Service**
   - Currently: Console logs magic links
   - Needed: SendGrid/Resend integration
   - Impact: Required for real users
   - Time: 2-3 hours

2. **Error Monitoring**
   - Currently: Console.log only
   - Needed: Sentry or similar
   - Impact: Critical for debugging production
   - Time: 1-2 hours

3. **Admin Dashboard**
   - View submissions
   - User management
   - Analytics
   - Impact: Essential for HR teams
   - Time: 1-2 days

4. **File Upload for Resume**
   - Currently: Paste text only
   - Needed: PDF/DOCX parsing
   - Impact: Much better UX
   - Time: 1 day

### Medium Priority (Enhanced Features)

5. **Real-time Auto-Save Indicator**
   - Show "Saving..." / "Saved" status
   - Conflict resolution if multiple tabs
   - Impact: Better user confidence
   - Time: 4-6 hours

6. **Form Validation Preview**
   - Show errors before submission
   - Highlight incomplete fields
   - Impact: Reduces failed submissions
   - Time: 4 hours

7. **AI Usage Analytics Dashboard**
   - Token usage over time
   - Cost tracking
   - Most used features
   - Impact: Better AI cost management
   - Time: 1 day

8. **Resume Templates**
   - Pre-fill with example data
   - Industry-specific templates
   - Impact: Helps users get started
   - Time: 1 day

### Low Priority (Nice to Have)

9. **Multi-language Support**
   - i18n with next-intl
   - Impact: Broader accessibility
   - Time: 2-3 days

10. **Dark Mode**
    - System preference detection
    - Toggle in UI
    - Impact: User preference
    - Time: 1 day

11. **Progressive Enhancement**
    - Works without JavaScript
    - Impact: Accessibility
    - Time: 2-3 days

12. **WebSocket Real-time Updates**
    - Live form collaboration
    - Real-time AI responses
    - Impact: Modern UX
    - Time: 3-4 days

### Technical Debt

13. **Component Testing**
    - Unit tests for complex components
    - Test AI text improvement logic
    - Impact: Confidence in refactoring
    - Time: 2-3 days

14. **Performance Optimization**
    - Code splitting
    - Image optimization
    - Bundle size reduction
    - Impact: Faster loads
    - Time: 1-2 days

15. **Accessibility Audit**
    - WCAG 2.1 AA compliance
    - Screen reader testing
    - Keyboard navigation
    - Impact: Legal requirement
    - Time: 2-3 days

16. **CI/CD Pipeline**
    - Automated testing on PR
    - Staging environment
    - Automatic deployments
    - Impact: Development velocity
    - Time: 1 day

## 📝 Development Notes

### Adding New Form Fields

1. Update `FormData` type in `lib/types.ts`
2. Add field to relevant step schema in `lib/schemas.ts`
3. Update form component in `components/forms/`
4. Update review display in `Step5Review.tsx`

### Customizing AI Prompts

Edit prompts in `lib/gemini.ts`:
- `extractResumeData()` - Resume parsing prompt
- `improveText()` - Text improvement prompt

### Adjusting Rate Limits

Modify constants in `lib/rate-limit.ts`:
- `RATE_LIMIT_WINDOW_MINUTES` - Time window
- `MAX_REQUESTS_PER_WINDOW` - Request limit

## 📄 License

MIT License - feel free to use this project for your own applications.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 💬 Support

For issues or questions, please open an issue on GitHub.

---

**Built with ❤️ using Next.js 15, React 19, and Google Gemini AI**
