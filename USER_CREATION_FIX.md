# 🔧 Database Error Fix: User Creation Issues

## Quick Fix Steps

### Step 1: Run the Diagnostic Script
1. Go to your Supabase dashboard → **SQL Editor**
2. Copy and paste the contents of `database/diagnose_user_issues.sql`
3. Click **Run** to identify the specific issue

### Step 2: Apply the Fix
1. Copy and paste the contents of `database/fix_user_creation.sql`
2. Click **Run** to fix the user creation function

### Step 3: Test User Creation
Try creating a new user account in your app to verify the fix works.

## Common Issues and Solutions

### Issue 1: Trigger Function Missing or Broken
**Symptoms**: Error when creating new users, profiles not created automatically

**Solution**: The `fix_user_creation.sql` file contains an improved trigger function with better error handling.

### Issue 2: Constraint Violations
**Symptoms**: "duplicate key value violates unique constraint" errors

**Possible Causes**:
- `email` field conflicts (multiple users with same email)
- `username` field conflicts (trying to set duplicate usernames)

**Solution**: The improved function uses `ON CONFLICT` clauses to handle duplicates gracefully.

### Issue 3: Missing Profiles for Existing Users
**Symptoms**: Users exist in `auth.users` but not in `profiles` table

**Solution**: Run the `create_missing_profiles()` function to create profiles for existing users.

### Issue 4: RLS (Row Level Security) Issues
**Symptoms**: Users can create accounts but can't access their data

**Solution**: Ensure RLS policies are properly set up (they should be from the main schema).

## Manual User Creation (Temporary Workaround)

If the automatic trigger still doesn't work, you can manually create user profiles:

```sql
-- Replace 'USER_ID_HERE' and 'EMAIL_HERE' with actual values
INSERT INTO profiles (id, email, full_name, created_at, updated_at)
VALUES (
    'USER_ID_HERE'::UUID,
    'EMAIL_HERE',
    'User Name',
    NOW(),
    NOW()
)
ON CONFLICT (id) DO NOTHING;
```

## Verification Steps

After applying the fix:

1. **Check Trigger**: Run this query to verify the trigger exists:
   ```sql
   SELECT trigger_name FROM information_schema.triggers 
   WHERE trigger_name = 'on_auth_user_created';
   ```

2. **Test User Creation**: Try creating a new user in your app

3. **Check Profiles**: Verify the profile was created:
   ```sql
   SELECT * FROM profiles ORDER BY created_at DESC LIMIT 5;
   ```

## Prevention

To prevent future issues:

1. **Always run the complete schema** including triggers and functions
2. **Test user creation** after any database changes
3. **Monitor Supabase logs** for any constraint violations
4. **Keep backups** of your database schema

## Still Having Issues?

If you're still experiencing problems:

1. **Share the specific error message** you're seeing
2. **Run the diagnostic script** and share the results
3. **Check Supabase dashboard logs** for detailed error information
4. **Verify your app's authentication code** is handling errors properly

The most common cause is missing or incorrectly configured trigger functions, which the `fix_user_creation.sql` script should resolve.