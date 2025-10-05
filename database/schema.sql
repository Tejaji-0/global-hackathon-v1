-- LinkHive Database Schema for Supabase PostgreSQL
-- Run these commands in your Supabase SQL editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE link_status AS ENUM ('active', 'archived', 'deleted');
CREATE TYPE collection_visibility AS ENUM ('private', 'public', 'shared');

-- 1. Profiles table (extends auth.users)
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    username TEXT UNIQUE,
    bio TEXT,
    website TEXT,
    location TEXT,
    is_premium BOOLEAN DEFAULT FALSE,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Collections table
CREATE TABLE collections (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    slug TEXT,
    color TEXT DEFAULT '#6366f1',
    icon TEXT DEFAULT 'folder',
    visibility collection_visibility DEFAULT 'private',
    is_featured BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT unique_user_collection_name UNIQUE(user_id, name),
    CONSTRAINT unique_user_collection_slug UNIQUE(user_id, slug)
);

-- 3. Links table
CREATE TABLE links (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    url TEXT NOT NULL,
    title TEXT,
    description TEXT,
    summary TEXT, -- AI-generated summary
    image_url TEXT,
    favicon_url TEXT,
    domain TEXT,
    platform TEXT, -- e.g., 'YouTube', 'Medium', 'GitHub'
    
    -- AI Classification
    category TEXT DEFAULT 'general',
    tags TEXT[] DEFAULT '{}',
    mood TEXT DEFAULT 'neutral',
    reading_time INTEGER, -- estimated reading time in minutes
    difficulty_level TEXT, -- 'beginner', 'intermediate', 'advanced'
    
    -- User metadata
    notes TEXT,
    is_favorite BOOLEAN DEFAULT FALSE,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    status link_status DEFAULT 'active',
    
    -- Social features
    is_public BOOLEAN DEFAULT FALSE,
    likes_count INTEGER DEFAULT 0,
    shares_count INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_accessed_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Indexes
    CONSTRAINT unique_user_url UNIQUE(user_id, url)
);

-- 4. Collection-Links junction table
CREATE TABLE collection_links (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    collection_id UUID REFERENCES collections(id) ON DELETE CASCADE NOT NULL,
    link_id UUID REFERENCES links(id) ON DELETE CASCADE NOT NULL,
    added_by UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    sort_order INTEGER DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT unique_collection_link UNIQUE(collection_id, link_id)
);

-- 5. Tags table
CREATE TABLE tags (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#6366f1',
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT unique_user_tag UNIQUE(user_id, name)
);

-- 6. Link-Tags junction table
CREATE TABLE link_tags (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    link_id UUID REFERENCES links(id) ON DELETE CASCADE NOT NULL,
    tag_id UUID REFERENCES tags(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT unique_link_tag UNIQUE(link_id, tag_id)
);

-- 7. Link Analytics table
CREATE TABLE link_analytics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    link_id UUID REFERENCES links(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    event_type TEXT NOT NULL, -- 'view', 'click', 'share', 'favorite'
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Social features tables
CREATE TABLE follows (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    follower_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    following_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT unique_follow UNIQUE(follower_id, following_id),
    CONSTRAINT no_self_follow CHECK(follower_id != following_id)
);

CREATE TABLE likes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    link_id UUID REFERENCES links(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT unique_like UNIQUE(user_id, link_id)
);

-- 9. Search and AI tables
CREATE TABLE search_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    query TEXT NOT NULL,
    filters JSONB DEFAULT '{}',
    results_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE ai_classifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    link_id UUID REFERENCES links(id) ON DELETE CASCADE NOT NULL,
    model_version TEXT NOT NULL,
    classification_data JSONB NOT NULL,
    confidence_score REAL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_links_user_id ON links(user_id);
CREATE INDEX idx_links_created_at ON links(created_at DESC);
CREATE INDEX idx_links_category ON links(category);
CREATE INDEX idx_links_tags ON links USING GIN(tags);
CREATE INDEX idx_links_domain ON links(domain);
CREATE INDEX idx_links_is_favorite ON links(is_favorite) WHERE is_favorite = TRUE;
CREATE INDEX idx_links_status ON links(status);

CREATE INDEX idx_collections_user_id ON collections(user_id);
CREATE INDEX idx_collections_visibility ON collections(visibility);

CREATE INDEX idx_collection_links_collection_id ON collection_links(collection_id);
CREATE INDEX idx_collection_links_link_id ON collection_links(link_id);

CREATE INDEX idx_tags_user_id ON tags(user_id);
CREATE INDEX idx_tags_usage_count ON tags(usage_count DESC);

CREATE INDEX idx_link_analytics_link_id ON link_analytics(link_id);
CREATE INDEX idx_link_analytics_created_at ON link_analytics(created_at DESC);

-- Create full-text search indexes
CREATE INDEX idx_links_search ON links USING GIN(
    to_tsvector('english', COALESCE(title, '') || ' ' || COALESCE(description, '') || ' ' || COALESCE(notes, ''))
);

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE links ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE link_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE link_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_classifications ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view public profiles" ON profiles
    FOR SELECT USING (true); -- Allow viewing public profile info

-- Collections policies
CREATE POLICY "Users can manage their own collections" ON collections
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view public collections" ON collections
    FOR SELECT USING (visibility = 'public' OR auth.uid() = user_id);

-- Links policies
CREATE POLICY "Users can manage their own links" ON links
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view public links" ON links
    FOR SELECT USING (is_public = TRUE OR auth.uid() = user_id);

-- Collection-Links policies
CREATE POLICY "Users can manage links in their collections" ON collection_links
    FOR ALL USING (
        auth.uid() IN (
            SELECT user_id FROM collections WHERE id = collection_id
        )
    );

-- Tags policies
CREATE POLICY "Users can manage their own tags" ON tags
    FOR ALL USING (auth.uid() = user_id);

-- Link-Tags policies
CREATE POLICY "Users can manage tags on their links" ON link_tags
    FOR ALL USING (
        auth.uid() IN (
            SELECT user_id FROM links WHERE id = link_id
        )
    );

-- Analytics policies
CREATE POLICY "Users can view their own analytics" ON link_analytics
    FOR ALL USING (auth.uid() = user_id);

-- Social feature policies
CREATE POLICY "Users can manage their follows" ON follows
    FOR ALL USING (auth.uid() = follower_id OR auth.uid() = following_id);

CREATE POLICY "Users can manage their likes" ON likes
    FOR ALL USING (auth.uid() = user_id);

-- Search history policies
CREATE POLICY "Users can manage their search history" ON search_history
    FOR ALL USING (auth.uid() = user_id);

-- AI classifications policies
CREATE POLICY "Users can view AI classifications for their links" ON ai_classifications
    FOR SELECT USING (
        auth.uid() IN (
            SELECT user_id FROM links WHERE id = link_id
        )
    );

-- Functions and Triggers

-- Function to handle user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, email, full_name)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_collections_updated_at BEFORE UPDATE ON collections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_links_updated_at BEFORE UPDATE ON links
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to increment tag usage count
CREATE OR REPLACE FUNCTION increment_tag_usage()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE tags SET usage_count = usage_count + 1 WHERE id = NEW.tag_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_link_tag_created
    AFTER INSERT ON link_tags
    FOR EACH ROW EXECUTE FUNCTION increment_tag_usage();

-- Function to decrement tag usage count
CREATE OR REPLACE FUNCTION decrement_tag_usage()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE tags SET usage_count = GREATEST(0, usage_count - 1) WHERE id = OLD.tag_id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_link_tag_deleted
    AFTER DELETE ON link_tags
    FOR EACH ROW EXECUTE FUNCTION decrement_tag_usage();

-- Function to update link counts
CREATE OR REPLACE FUNCTION update_link_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE links SET likes_count = likes_count + 1 WHERE id = NEW.link_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE links SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.link_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_like_change
    AFTER INSERT OR DELETE ON likes
    FOR EACH ROW EXECUTE FUNCTION update_link_counts();

-- Create views for common queries

-- View for user dashboard stats
CREATE VIEW user_dashboard_stats AS
SELECT 
    p.id as user_id,
    p.email,
    p.full_name,
    COUNT(DISTINCT l.id) as total_links,
    COUNT(DISTINCT c.id) as total_collections,
    COUNT(DISTINCT l.id) FILTER (WHERE l.is_favorite = TRUE) as favorite_links,
    COUNT(DISTINCT l.id) FILTER (WHERE l.created_at >= NOW() - INTERVAL '7 days') as links_this_week,
    COUNT(DISTINCT f1.follower_id) as followers_count,
    COUNT(DISTINCT f2.following_id) as following_count
FROM profiles p
LEFT JOIN links l ON p.id = l.user_id AND l.status = 'active'
LEFT JOIN collections c ON p.id = c.user_id
LEFT JOIN follows f1 ON p.id = f1.following_id
LEFT JOIN follows f2 ON p.id = f2.follower_id
GROUP BY p.id, p.email, p.full_name;

-- View for popular tags
CREATE VIEW popular_tags AS
SELECT 
    t.id,
    t.name,
    t.color,
    t.usage_count,
    COUNT(DISTINCT l.user_id) as used_by_users_count
FROM tags t
JOIN link_tags lt ON t.id = lt.tag_id
JOIN links l ON lt.link_id = l.id
WHERE l.status = 'active'
GROUP BY t.id, t.name, t.color, t.usage_count
ORDER BY t.usage_count DESC;

-- View for trending links (based on recent activity)
CREATE VIEW trending_links AS
SELECT 
    l.*,
    COUNT(la.id) as activity_score,
    MAX(la.created_at) as last_activity
FROM links l
JOIN link_analytics la ON l.id = la.link_id
WHERE l.is_public = TRUE 
    AND l.status = 'active' 
    AND la.created_at >= NOW() - INTERVAL '7 days'
GROUP BY l.id
ORDER BY activity_score DESC, last_activity DESC;

-- Grant permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;