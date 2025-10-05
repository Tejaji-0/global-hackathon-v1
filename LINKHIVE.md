# LinkHive - AI-Powered Content Organizer

LinkHive is a React Native + Expo mobile app that serves as an AI-powered content organizer and discovery platform. Users can save, organize, and explore links from various platforms in one place.

*Built for the ACTA 24-hour Global Hackathon*

## 🎯 Core Features

### Smart Link Saving
- Share any URL to the app from any platform
- Automatically extract title, description, and preview image via OpenGraph scraping
- AI auto-tags each link by category and mood
- Option to add notes or custom tags manually
- Cloud storage via Supabase

### Feed & Discovery
- Personalized AI-powered feed
- Related link suggestions
- Trending public saves
- Feed ranked by relevance and AI interest score

### Search & Filters
- Natural language AI search
- Filter by platform, tag, or mood
- Sort by date, category, or popularity

### Collections / Boards
- Create collections like Pinterest boards
- Share collections publicly or privately
- Example collections: Design Ideas, Travel Vlogs, Coding Tutorials

### AI Features
- Auto-categorization and tagging
- Content summaries for articles/videos
- Mood detection (funny, educational, inspiring, etc.)
- Related content recommendations

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Expo CLI
- React Native development environment

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   Create a `.env` file in the root directory and add:
   ```env
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   OPENAI_API_KEY=your_openai_api_key
   ```

3. **Update configuration:**
   - Update `src/services/supabase.js` with your Supabase credentials
   - Update `src/services/aiService.js` with your OpenAI API key

4. **Start the development server:**
   ```bash
   npm start
   ```

5. **Run on device/simulator:**
   ```bash
   npm run ios     # For iOS
   npm run android # For Android
   npm run web     # For web
   ```

## 📱 Supported Platforms

The app can extract metadata from:
- Instagram: `https://www.instagram.com/p/xxxxx`
- YouTube: `https://youtu.be/xxxxx`
- Pinterest: `https://pin.it/xxxxx`
- Twitter (X): `https://x.com/user/status/xxxxx`
- LinkedIn: `https://www.linkedin.com/posts/...`
- Reddit: `https://reddit.com/r/...`
- Any website with OpenGraph metadata

## 🛠 Tech Stack

- **Frontend:** React Native (Expo)
- **Backend:** Supabase (auth, database, storage)
- **AI Layer:** OpenAI for classification and summaries
- **Metadata Extraction:** Custom OpenGraph scraper
- **Navigation:** React Navigation 6
- **UI Components:** React Native Elements, React Native Paper
- **Animations:** React Native Reanimated
- **Storage:** AsyncStorage

## 📁 Project Structure

```
├── App.js                 # Main app component
├── app.json              # Expo configuration
├── babel.config.js       # Babel configuration
├── package.json          # Dependencies and scripts
├── assets/               # Images, icons, fonts
├── src/
│   ├── screens/          # Screen components
│   │   ├── HomeScreen.js
│   │   ├── AddLinkScreen.js
│   │   ├── SearchScreen.js
│   │   ├── CollectionsScreen.js
│   │   ├── ProfileScreen.js
│   │   ├── LinkDetailScreen.js
│   │   └── CollectionDetailScreen.js
│   └── services/         # API and utility services
│       ├── supabase.js
│       ├── openGraphService.js
│       └── aiService.js
└── Test_api/             # Testing utilities
    ├── test_og.js
    ├── test_excel_links.js
    └── test_links.xlsx
```

## 🔧 Configuration

### Supabase Setup
1. Create a new Supabase project
2. Set up the following tables:
   - `links` - Store saved links
   - `collections` - User collections
   - `collection_links` - Link-to-collection relationships
   - `users` - User profiles
   - `tags` - Tag system
   - `link_tags` - Link-to-tag relationships

### OpenAI Setup
1. Get an OpenAI API key
2. Update the API key in `src/services/aiService.js`

## 🧪 Testing

The app includes testing utilities in the `Test_api/` directory:

- `test_og.js` - Test OpenGraph metadata extraction
- `test_excel_links.js` - Batch test multiple links from Excel file
- `test_links.xlsx` - Sample links for testing

To run tests:
```bash
node Test_api/test_og.js
node Test_api/test_excel_links.js
```

## 🤖 AI Features

### Content Classification
- Automatically categorizes links (tech, design, education, etc.)
- Detects mood/sentiment (educational, entertaining, inspiring)
- Generates smart tags based on content

### Recommendations
- Suggests related content based on saved links
- Trending collections and popular content
- Personalized feed ranking

## 🎨 UI/UX Features

- Modern, minimal design using Material Design principles
- Dark and light theme support
- Smooth animations and transitions
- Grid and list view options
- Floating action buttons
- Pull-to-refresh functionality

## 📝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Built for the ACTA 24-hour Global Hackathon
- Inspired by Pinterest, Notion, and Pocket
- Uses OpenGraph protocol for metadata extraction
- Powered by OpenAI for smart categorization

## 🚀 Future Roadmap

- [ ] Social features (follow users, like collections)
- [ ] Advanced AI summaries for video content
- [ ] Offline reading mode
- [ ] Browser extension for easy saving
- [ ] Integration with more platforms
- [ ] Collaborative collections
- [ ] Analytics and insights dashboard
- [ ] API for third-party integrations