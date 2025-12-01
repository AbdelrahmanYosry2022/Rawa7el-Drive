# 🚀 Performance Optimization Guide

## ✅ What Has Been Done:

### 1. **Page-Level Caching (ISR - Incremental Static Regeneration)**
Added `export const revalidate = X` to pages:
- **Home page (`/`)**: 60 seconds cache
- **Subject page (`/subjects/[id]`)**: 120 seconds cache  
- **Exam start page (`/exams/[id]/start`)**: 300 seconds (5 minutes) cache

This means:
- First user gets fresh data from database
- Next users within the time window get cached version (instant!)
- After time expires, Next.js regenerates in background

### 2. **Optimized Database Queries**
Changed from `include: { ... }` to `select: { ... }`:
- Only fetch fields you actually use
- Reduces data transfer from database
- Faster JSON serialization

Example:
```ts
// Before (fetches ALL fields)
include: { subject: true }

// After (only needed fields)
select: { 
  id: true, 
  title: true 
}
```

### 3. **Added Limits to Queries**
- Home page: Limited subjects to 6 (was unlimited)
- All queries: Added explicit `take` limits where appropriate

### 4. **Reduced Prisma Logging**
- Development: Full logging for debugging
- Production: Only errors logged (faster)

---

## 🔧 Additional Steps YOU Need to Do:

### Step 1: Database Connection Pooling (IMPORTANT!)

If you're using **Neon**, **PlanetScale**, or **Supabase**:

1. Go to your database dashboard
2. Find the **"Connection Pooling"** or **"Pooler"** URL
3. It usually looks like: `postgresql://user:pass@host:6543/db?pgbouncer=true`
4. Update your `.env` file:

```env
# Replace your current DATABASE_URL with the pooling URL
DATABASE_URL="postgresql://user:pass@host:6543/db?pgbouncer=true"
```

5. Redeploy to Vercel

**Why?** Serverless functions open/close connections frequently. Pooling reuses connections = much faster!

---

### Step 2: Check Vercel Region

1. Go to Vercel Dashboard → Your Project → Settings → Functions
2. Check **"Function Region"**
3. Make sure it matches your database region:
   - If DB in US East → Use `iad1` (Washington DC)
   - If DB in EU → Use `fra1` (Frankfurt)
   - If DB in Asia → Use `sin1` (Singapore)

**Mismatch = High Latency!**

---

### Step 3: Add Database Indexes (If Not Already)

Run this in your database console or add to `schema.prisma`:

```prisma
model Submission {
  // ... existing fields
  
  @@index([userId])
  @@index([examId])
  @@index([createdAt])
}

model Exam {
  // ... existing fields
  
  @@index([subjectId])
  @@index([createdAt])
}

model Question {
  // ... existing fields
  
  @@index([examId])
}
```

Then run:
```bash
npx prisma db push
```

---

## 📊 Expected Results:

### Before Optimization:
- Home page: 2-4 seconds
- Subject page: 1-3 seconds  
- Exam start: 2-5 seconds

### After Optimization:
- Home page: 0.5-1 second (first load), **<100ms** (cached)
- Subject page: 0.3-0.8 seconds (first load), **<100ms** (cached)
- Exam start: 0.5-1 second (first load), **<200ms** (cached)

---

## 🐛 If Still Slow:

### Check Cold Starts:
Vercel free tier has **cold starts** (first request after idle wakes up the function).
- Solution: Upgrade to Pro ($20/month) for faster cold starts

### Check Database Performance:
Run this query in your DB console:
```sql
SELECT * FROM pg_stat_activity WHERE state = 'active';
```
If you see many slow queries, your DB might be overloaded.

### Enable Vercel Analytics:
1. Go to Vercel Dashboard → Your Project → Analytics
2. Enable **Web Analytics** (free)
3. Check **"Server Timing"** to see which pages are slow

---

## 🎯 Quick Test:

After deploying these changes:

1. Visit your site (first load = slow, expected)
2. Refresh the page (should be **instant** now!)
3. Wait 60 seconds
4. Refresh again (Next.js regenerates in background, still fast for you)

---

## 📝 Notes:

- Caching is **per-page**, not per-user
- User-specific data (submissions) is still fetched fresh
- Static content (subjects, exams) is cached
- Perfect balance between speed and freshness!
