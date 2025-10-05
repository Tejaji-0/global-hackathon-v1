-- Fix for missing INSERT policy on profiles table
-- Run this in your Supabase SQL editor

-- Add INSERT policy for profiles table
CREATE POLICY "Users can insert their own profile" ON profiles
    FOR INSERT 
    WITH CHECK (auth.uid() = id);

-- Also, let's create a function to safely create profiles
CREATE OR REPLACE FUNCTION create_user_profile(
    user_id UUID,
    user_email TEXT,
    user_full_name TEXT DEFAULT 'User'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
BEGIN
    -- Insert the profile
    INSERT INTO profiles (id, email, full_name, created_at, updated_at)
    VALUES (user_id, user_email, user_full_name, NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        updated_at = NOW();
    
    -- Return success
    SELECT json_build_object(
        'success', true,
        'user_id', user_id,
        'message', 'Profile created or updated successfully'
    ) INTO result;
    
    RETURN result;
EXCEPTION WHEN OTHERS THEN
    -- Return error details
    SELECT json_build_object(
        'success', false,
        'error', SQLERRM,
        'user_id', user_id
    ) INTO result;
    
    RETURN result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_user_profile TO authenticated;