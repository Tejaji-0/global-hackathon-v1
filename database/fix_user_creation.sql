-- Fixed User Creation Function and Trigger
-- Run this to fix the database error when saving new users

-- First, drop the existing trigger and function if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Create improved function to handle user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert into profiles with better error handling
    INSERT INTO profiles (id, email, full_name, created_at, updated_at)
    VALUES (
        NEW.id,
        COALESCE(NEW.email, ''),
        COALESCE(NEW.raw_user_meta_data->>'full_name', 
                 NEW.raw_user_meta_data->>'name', 
                 split_part(COALESCE(NEW.email, ''), '@', 1)),
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        updated_at = NOW();
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error but don't fail the user creation
        RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Also create a function to manually create missing profiles
CREATE OR REPLACE FUNCTION create_missing_profiles()
RETURNS TABLE(user_id UUID, user_email TEXT, created BOOLEAN) AS $$
BEGIN
    RETURN QUERY
    INSERT INTO profiles (id, email, full_name, created_at, updated_at)
    SELECT 
        au.id,
        COALESCE(au.email, ''),
        COALESCE(au.raw_user_meta_data->>'full_name', 
                 au.raw_user_meta_data->>'name', 
                 split_part(COALESCE(au.email, ''), '@', 1)),
        NOW(),
        NOW()
    FROM auth.users au
    LEFT JOIN profiles p ON au.id = p.id
    WHERE p.id IS NULL
    ON CONFLICT (id) DO NOTHING
    RETURNING id, email, TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Run this to create profiles for any existing users that don't have them
SELECT * FROM create_missing_profiles();