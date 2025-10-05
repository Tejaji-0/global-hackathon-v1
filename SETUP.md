# LinkHive Setup Guide

This guide will help you set up LinkHive on your local development environment.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
- **npm** or **yarn** package manager
- **Expo CLI** - Install globally with `npm install -g @expo/cli`
- **Git** - [Download](https://git-scm.com/)

For mobile development:
- **iOS Simulator** (macOS only) - Comes with Xcode
- **Android Studio** with Android SDK - [Download](https://developer.android.com/studio)
- **Expo Go** app on your physical device (iOS/Android)

## Step-by-Step Setup

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/linkhive.git
cd linkhive
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Copy the example environment file:
```bash
cp .env.example .env
```

Edit the `.env` file with your credentials:

#### Supabase Setup
1. Go to [Supabase](https://supabase.com/) and create a new project
2. In your project dashboard, go to Settings → API
3. Copy your Project URL and Anon Key
4. Update the `.env` file:
   ```env
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your-anon-key-here
   ```

#### OpenAI Setup
1. Go to [OpenAI](https://platform.openai.com/api-keys)
2. Create a new API key
3. Update the `.env` file:
   ```env
   OPENAI_API_KEY=sk-your-openai-key-here
   ```

### 4. Configure Supabase Database

Create the following tables in your Supabase project:

#### Links Table
```sql
CREATE TABLE links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  title TEXT,
  description TEXT,
  image TEXT,
  platform TEXT,
  domain TEXT,
  notes TEXT,
  category TEXT,
  mood TEXT,
  summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Collections Table
```sql
CREATE TABLE collections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#6366f1',
  icon TEXT DEFAULT 'bookmark',
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Collection Links Table
```sql
CREATE TABLE collection_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  collection_id UUID REFERENCES collections(id) ON DELETE CASCADE,
  link_id UUID REFERENCES links(id) ON DELETE CASCADE,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(collection_id, link_id)
);
```

#### Tags Table
```sql
CREATE TABLE tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Link Tags Table
```sql
CREATE TABLE link_tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  link_id UUID REFERENCES links(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  UNIQUE(link_id, tag_id)
);
```

### 5. Update Service Configuration

Update the service files with your credentials:

#### Update `src/services/supabase.js`
```javascript
const supabaseUrl = 'https://your-project.supabase.co';
const supabaseAnonKey = 'your-anon-key-here';
```

#### Update `src/services/aiService.js`
```javascript
const openai = new OpenAI({
  apiKey: 'sk-your-openai-key-here',
});
```

### 6. Start the Development Server

```bash
npm start
```

This will start the Expo development server and show you a QR code.

### 7. Run on Device/Simulator

#### Option 1: Physical Device
1. Download the **Expo Go** app from App Store or Google Play
2. Scan the QR code shown in your terminal
3. The app will load on your device

#### Option 2: iOS Simulator (macOS only)
```bash
npm run ios
```

#### Option 3: Android Emulator
```bash
npm run android
```

#### Option 4: Web Browser
```bash
npm run web
```

## Testing the Setup

### Test OpenGraph Scraping
```bash
node Test_api/test_og.js
```

### Test Batch Link Processing
```bash
node Test_api/test_excel_links.js
```

## Troubleshooting

### Common Issues

#### 1. Metro bundler issues
```bash
npm start -- --clear
```

#### 2. iOS build issues
```bash
cd ios && pod install && cd ..
npm run ios
```

#### 3. Android build issues
```bash
npm run android -- --reset-cache
```

#### 4. Dependency conflicts
```bash
rm -rf node_modules package-lock.json
npm install
```

### Environment Issues

#### Supabase Connection Issues
- Verify your Supabase URL and key are correct
- Check that your Supabase project is active
- Ensure RLS policies are set up correctly

#### OpenAI API Issues
- Verify your API key is correct and has credits
- Check rate limits if requests are failing
- Ensure you're using the correct model (gpt-3.5-turbo)

### Development Tips

1. **Use Expo Go for quick testing** - Fastest way to see changes
2. **Enable hot reloading** - Shake your device and enable "Fast Refresh"
3. **Check console logs** - Use React Native debugger or browser console
4. **Test on multiple platforms** - iOS and Android may behave differently

## Next Steps

Once you have the app running:

1. Try adding a link using the "+" button
2. Test the search functionality
3. Create a collection
4. Explore the AI features

## Need Help?

- Check the main [README.md](./README.md) for feature documentation
- Review the [Test_api/](./Test_api/) folder for example usage
- Open an issue on GitHub if you encounter problems

Happy coding! 🚀