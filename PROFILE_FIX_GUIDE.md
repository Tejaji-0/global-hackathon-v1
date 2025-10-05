# Fix for Profile Creation Issue

## Problem
Your Supabase database is missing an INSERT policy for the `profiles` table, causing a "403 Forbidden - row-level security policy" error when trying to create user profiles.

## Solution

### Step 1: Run the Database Fix
1. Open your Supabase dashboard
2. Go to the SQL Editor
3. Copy and paste the contents of `database/fix_profile_insert_policy.sql`
4. Run the SQL commands

### Step 2: Test the Fix
1. The app will now automatically create missing profiles using a secure RPC function
2. Try adding a link again - it should work without errors

### What the Fix Does
1. **Adds INSERT Policy**: Allows authenticated users to insert their own profile records
2. **Creates RPC Function**: A secure function that can create profiles even with RLS enabled
3. **Handles Conflicts**: Uses `ON CONFLICT` to update existing profiles instead of failing

### Manual Profile Creation (Alternative)
If you prefer to create the profile manually for your current user:

```sql
INSERT INTO profiles (id, email, full_name, created_at, updated_at)
VALUES (
    'e2022f4a-3fad-4fdc-93e6-28b0a2325cd5',  -- Your user ID
    'psntejaji@gmail.com',                    -- Your email
    'tejaji',                                 -- Your full name
    NOW(),
    NOW()
);
```

### Why This Happened
- The auth trigger should automatically create profiles when users sign up
- Either the trigger wasn't set up properly or failed for your account
- The missing INSERT policy prevented manual profile creation

After running the SQL fix, your app should work perfectly!