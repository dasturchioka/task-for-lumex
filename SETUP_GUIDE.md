# Quick Setup Guide

This guide will help you get the job application form running locally in minutes.

## 📦 Quick Start (5 minutes)

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project (choose a region close to you)
3. Wait for the project to be created (~2 minutes)
4. Go to **SQL Editor** in the left sidebar
5. Copy and paste the contents of `supabase-schema.sql` into the editor
6. Click **Run** to create all tables
7. Go to **Settings** > **API** and copy:
   - Project URL (looks like `https://xxxxx.supabase.co`)
   - `anon public` key
   - `service_role` key (click "Reveal" to see it)

### 3. Get Google Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Click "Create API Key"
3. Choose "Create API key in new project" or select an existing project
4. Copy the API key

### 4. Configure Environment

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
GEMINI_API_KEY=your-gemini-api-key-here
NEXT_PUBLIC_APP_URL=http://localhost:3000
SESSION_SECRET=generate-a-random-32-character-string-here
```

**Generate SESSION_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 5. Start the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) - you should see the app!

## 🎯 Testing the Application

### Test Authentication Flow

1. Go to [http://localhost:3000](http://localhost:3000)
2. You'll be redirected to `/login`
3. Enter any email (e.g., `test@example.com`)
4. Click "Send Magic Link"
5. A magic link will appear on the screen (since we can't send emails)
6. Click the magic link to authenticate
7. You'll be redirected to the form

### Test Form Features

1. **Step 1 - Import from Resume**:
   - Click "Import from Resume"
   - Paste this sample resume:
   ```
   John Doe
   john.doe@example.com
   +1 (555) 123-4567
   San Francisco, CA

   SENIOR SOFTWARE ENGINEER
   Tech Corp - 2020 to Present

   - Led development of microservices architecture serving 10M+ users
   - Reduced API response time by 60% through optimization
   - Mentored team of 5 junior developers

   SKILLS:
   JavaScript, Python, Java, Go
   React, Node.js, Django, Kubernetes
   Strong expertise in distributed systems and cloud architecture
   ```
   - Click "Extract Information"
   - Review extracted data and click "Accept"
   - Form fields will be populated automatically!

2. **Test AI Text Improvement**:
   - Go to Step 2 (Work Experience)
   - In "Key Achievements", type something simple like:
     ```
     I built some features and helped my team
     ```
   - Click "Improve with AI"
   - Watch as AI transforms it into professional text!

3. **Test Auto-Save**:
   - Fill out Step 1 and click "Next"
   - Notice "Saving..." appears
   - Close your browser tab
   - Open [http://localhost:3000](http://localhost:3000) again
   - Login with the same email
   - Your progress is automatically restored!

4. **Complete the Form**:
   - Fill all 4 steps
   - Review on Step 5
   - Click "Submit Application"
   - See success page!

### Test Rate Limiting

1. Use the AI features (resume import or text improvement)
2. After 10 requests within 5 minutes, you'll see:
   ```
   Rate limit exceeded. Try again after [time]
   ```
3. Wait 5 minutes or check remaining requests in the UI

## 🔍 Verify Database

Check that data is being saved:

1. Go to your Supabase project
2. Click **Table Editor** in the sidebar
3. Check these tables:
   - **users** - Should have your test user
   - **sessions** - Should have an active session
   - **form_progress** - Should show your saved form data
   - **form_submissions** - Should show completed submissions
   - **ai_usage** - Should show AI request history

## ⚠️ Common Issues

### "Missing environment variables" error

**Solution**: Make sure `.env.local` exists and all variables are set correctly. Restart the dev server after creating the file.

### Magic link says "Invalid or expired token"

**Solution**: 
- Check that your Supabase URL and keys are correct
- Make sure you ran the `supabase-schema.sql` script
- Magic links expire after 15 minutes - generate a new one

### AI features not working

**Solution**:
- Verify your `GEMINI_API_KEY` is correct
- Check you haven't exceeded rate limits (wait 5 minutes)
- Make sure you're authenticated (logged in)

### "Failed to connect to database"

**Solution**:
- Check your Supabase project is running (not paused)
- Verify the Supabase URL and keys are correct
- Check your internet connection

### Session immediately expires

**Solution**:
- Make sure `SESSION_SECRET` is at least 32 characters
- Clear your browser cookies
- Check browser console for errors

## 📱 Next Steps

Once everything is working locally:

1. **Customize the form**: Edit field labels and validation in `lib/schemas.ts`
2. **Adjust AI prompts**: Modify prompts in `lib/gemini.ts`
3. **Change styling**: Update Tailwind classes in components
4. **Deploy to production**: Follow the deployment guide in `README.md`

## 🆘 Need Help?

If you're stuck:

1. Check the browser console (F12) for error messages
2. Check the terminal where `npm run dev` is running
3. Review the full `README.md` for detailed documentation
4. Open an issue on GitHub with:
   - What you tried
   - Error messages
   - Screenshots

## 🎉 Success!

If you can:
- ✅ Login with magic link
- ✅ Fill out the multi-step form
- ✅ Import data from a resume
- ✅ Improve text with AI
- ✅ Submit the form successfully

**Congratulations! Your application is working perfectly!** 🚀

Now you can customize it for your needs or deploy it to production.

