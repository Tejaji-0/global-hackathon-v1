-- Test script to verify LinkHive database schema works correctly
-- Run this AFTER running the main schema.sql file

-- Test 1: Verify all tables exist
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name IN (
        'profiles', 'collections', 'links', 'collection_links', 
        'tags', 'link_tags', 'link_analytics', 'follows', 
        'likes', 'search_history', 'ai_classifications'
    )
ORDER BY table_name;

-- Test 2: Check if RLS is enabled on all tables
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN (
        'profiles', 'collections', 'links', 'collection_links', 
        'tags', 'link_tags', 'link_analytics', 'follows', 
        'likes', 'search_history', 'ai_classifications'
    )
ORDER BY tablename;

-- Test 3: Verify custom types exist
SELECT 
    typname as type_name,
    typtype as type_type
FROM pg_type 
WHERE typname IN ('link_status', 'collection_visibility');

-- Test 4: Check if functions exist
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
    AND routine_name IN (
        'handle_new_user', 
        'update_updated_at_column',
        'increment_tag_usage',
        'decrement_tag_usage',
        'update_link_counts'
    );

-- Test 5: Verify views exist
SELECT 
    table_name,
    table_type
FROM information_schema.views 
WHERE table_schema = 'public' 
    AND table_name IN (
        'user_dashboard_stats',
        'popular_tags',
        'trending_links'
    );

-- Test 6: Count policies (should be more than 10)
SELECT 
    COUNT(*) as total_policies
FROM pg_policies 
WHERE schemaname = 'public';

-- If all tests return results, your schema is correctly installed! 🎉