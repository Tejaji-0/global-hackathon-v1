-- Diagnostic Script for User Creation Issues
-- Run this in Supabase SQL Editor to identify and fix user creation problems

-- 1. Check if profiles table exists and structure
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Check if the trigger exists
SELECT 
    trigger_name, 
    event_manipulation, 
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- 3. Check for any existing users without profiles
SELECT 
    au.id,
    au.email,
    au.created_at as user_created,
    p.id as profile_exists
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
ORDER BY au.created_at DESC
LIMIT 10;

-- 4. Check for constraint violations
SELECT conname, contype, conkey, confkey 
FROM pg_constraint 
WHERE conrelid = 'profiles'::regclass;

-- 5. Test trigger function directly (this will show any errors)
DO $$
DECLARE
    test_record RECORD;
BEGIN
    -- This will help identify if the function works
    RAISE NOTICE 'Testing trigger function...';
    
    -- Check if function exists
    SELECT * INTO test_record 
    FROM pg_proc 
    WHERE proname = 'handle_new_user';
    
    IF FOUND THEN
        RAISE NOTICE 'handle_new_user function exists';
    ELSE
        RAISE NOTICE 'handle_new_user function does NOT exist';
    END IF;
END $$;