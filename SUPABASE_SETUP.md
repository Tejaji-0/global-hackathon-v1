# LinkHive Supabase Setup Guide

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create an account
2. Click "New Project"
3. Choose your organization
4. Fill in project details:
   - **Project name**: `linkhive`
   - **Database password**: Generate a strong password and save it
   - **Region**: Choose closest to your users
5. Click "Create new project"

## 2. Database Setup

### Run the Schema

1. Go to your Supabase dashboard
2. Navigate to **SQL Editor** in the sidebar
3. Click "New query"
4. Copy and paste the entire contents of `database/schema.sql`
5. Click "Run" to execute the schema

### Verify Tables Created

Go to **Table Editor** and verify these tables exist:
- `profiles`
- `collections`
- `links`
- `collection_links`
- `tags`
- `link_tags`
- `link_analytics`
- `follows`
- `likes`
- `search_history`
- `ai_classifications`

### Troubleshooting Database Setup

**Common Issues and Solutions:**

**❌ Error: "permission denied to set parameter"**
- **Solution**: This line has been removed from the schema. If you see this error, skip this command and continue with the rest of the schema.

**❌ Error: "extension 'uuid-ossp' already exists"**
- **Solution**: This is normal. Supabase may have this extension enabled by default.

**❌ Error: "relation already exists"**
- **Solution**: If tables already exist, you can either:
  - Drop existing tables first: `DROP TABLE table_name CASCADE;`
  - Or skip the table creation and just run the policies and functions

**❌ Error: "function does not exist"**
- **Solution**: Make sure to run the entire schema in order. Some functions depend on tables being created first.

**✅ Success Indicators:**
- All 11 tables appear in Table Editor
- No red error messages in SQL Editor
- Policies show up in Authentication > Policies
- You can insert test data without errors

## 3. Authentication Setup

### Enable Email Authentication

1. Go to **Authentication > Settings**
2. Under **Auth Providers**, ensure **Email** is enabled
3. Configure email settings:
   - **Enable email confirmations**: Toggle as needed
   - **Secure email change**: Recommended to enable

### Configure OAuth Providers (Optional)

To enable social login:

#### Google OAuth
1. Go to **Authentication > Settings**
2. Find **Google** under Auth Providers
3. Enable Google provider
4. Add your Google OAuth credentials:
   - **Client ID**: From Google Cloud Console
   - **Client Secret**: From Google Cloud Console

#### GitHub OAuth
1. Find **GitHub** under Auth Providers
2. Enable GitHub provider
3. Add your GitHub OAuth credentials

### Email Templates (Optional)

Customize email templates in **Authentication > Email Templates**:
- Confirm signup
- Magic link
- Change email address
- Reset password

## 4. Row Level Security (RLS)

The schema already includes RLS policies. Verify they're active:

1. Go to **Authentication > Policies**
2. Check that policies exist for all tables
3. Key policies include:
   - Users can only access their own data
   - Public content is visible to all authenticated users
   - Proper social feature permissions

## 5. Environment Configuration

### Get Your Supabase Credentials

1. Go to **Settings > API**
2. Copy these values:
   - **Project URL** (anon key URL)
   - **anon public** key
   - **service_role** key (keep this secret!)

### Update Your App

Create `.env.local` file in your project root:

```env
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional: AI Service Keys
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
```

### Update Supabase Service

Replace the mock configuration in `src/services/supabase.js`:

```javascript
// Replace this:
const SUPABASE_URL = 'https://demo.supabase.co';
const SUPABASE_ANON_KEY = 'demo-key';

// With this:
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Remove or comment out the mock client section
```

## 6. Storage Setup (Optional)

For user avatars and link thumbnails:

### Create Storage Buckets

1. Go to **Storage**
2. Create new bucket: `avatars`
   - **Public**: Yes
   - **File size limit**: 2MB
   - **Allowed MIME types**: `image/*`
3. Create new bucket: `thumbnails`
   - **Public**: Yes
   - **File size limit**: 5MB
   - **Allowed MIME types**: `image/*`

### Storage Policies

Add RLS policies for storage:

```sql
-- Avatar policies
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Thumbnail policies
CREATE POLICY "Thumbnails are publicly accessible" ON storage.objects
FOR SELECT USING (bucket_id = 'thumbnails');

CREATE POLICY "Users can upload thumbnails" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'thumbnails' AND auth.uid()::text = (storage.foldername(name))[1]);
```

## 7. API Endpoints (Optional)

### Edge Functions

For AI processing and web scraping, create Edge Functions:

1. Install Supabase CLI:
```bash
npm install -g supabase
```

2. Login and link project:
```bash
supabase login
supabase link --project-ref your-project-ref
```

3. Create functions:
```bash
supabase functions new ai-classify-link
supabase functions new scrape-metadata
```

## 8. Testing the Setup

### Test Authentication

1. Start your app: `npm start`
2. Try creating an account
3. Check if user appears in **Authentication > Users**
4. Verify profile created in `profiles` table

### Test Data Operations

1. Create a link in the app
2. Check if it appears in the `links` table
3. Create a collection
4. Add link to collection
5. Verify relationships in database

### Test Real-time Features

1. Open app on multiple devices/browsers
2. Add a link on one device
3. Verify it appears on other devices instantly

## 9. Production Considerations

### Security Checklist

- [ ] Enable email confirmations
- [ ] Set up proper CORS origins
- [ ] Review and test all RLS policies
- [ ] Use environment variables for all secrets
- [ ] Enable database backups
- [ ] Set up monitoring and alerts

### Performance Optimization

- [ ] Add additional indexes for common queries
- [ ] Set up read replicas if needed
- [ ] Configure connection pooling
- [ ] Monitor query performance

### Backup Strategy

1. Go to **Settings > Database**
2. Enable **Point in Time Recovery**
3. Set up regular backups
4. Test backup restoration process

## 10. Troubleshooting

### Common Issues

**"Failed to fetch" errors:**
- Check your Supabase URL and keys
- Verify network connectivity
- Check CORS settings

**RLS policy errors:**
- Verify user is authenticated
- Check policy conditions
- Test policies in SQL editor

**Real-time not working:**
- Check if RLS policies allow SELECT
- Verify channel subscriptions
- Check network connectivity

### Debug Mode

Enable debug logging in your app:

```javascript
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    debug: __DEV__
  }
});
```

### Support Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Discord Community](https://discord.supabase.com)
- [GitHub Issues](https://github.com/supabase/supabase/issues)

---

## Quick Setup Commands

For developers who want to get started quickly:

```bash
# 1. Install dependencies (if not already done)
npm install @supabase/supabase-js @react-native-async-storage/async-storage

# 2. Create environment file
echo "EXPO_PUBLIC_SUPABASE_URL=your_url_here" > .env.local
echo "EXPO_PUBLIC_SUPABASE_ANON_KEY=your_key_here" >> .env.local

# 3. Update supabase.js to use real credentials
# 4. Run the schema.sql in Supabase dashboard
# 5. Test the app
npm start
```

Your LinkHive app should now be fully connected to Supabase with authentication, real-time sync, and cloud storage! 🚀