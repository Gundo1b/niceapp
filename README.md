# Life OS - Personal Operating System for 9-5 Professionals

A comprehensive React Native mobile application built with Expo that helps professionals optimize their productivity, track habits, achieve 90-day goals, and receive AI-powered insights.

## Features

### Daily Planner & Time Blocking
- Pre-structured daily schedule with 12 time blocks
- Real-time progress tracking with completion percentages
- Date navigation to plan future days or review past performance
- Task editing and customization
- Visual progress indicators

### Weekly Strategic Planner
- Strategic weekly overview with theme and focus areas
- Individual planning sections for each day of the week
- Auto-save functionality
- Week-by-week navigation
- Quick access to current week

### 90-Day Goal System
- Set and track multiple goals across 5 categories:
  - Primary Goal
  - Skill Development
  - Health & Fitness
  - Financial
  - Relationship/Personal
- Visual progress tracking with percentage completion
- Quick progress updates (+/- 10%)
- Days remaining countdown
- Goal categorization and prioritization

### Habit & Streak Tracking
- Create and track daily habits
- Automatic streak calculation
- Current and best streak tracking
- Daily completion checklist
- Visual progress indicators
- Category organization

### AI-Powered Insights
- Daily personalized motivation using Llama 3.3 via OpenRouter
- Real-time statistics dashboard:
  - Today's task completion rate
  - Habit completion progress
  - Longest streak tracking
  - Active goals count
- Weekly overview and trends
- Context-aware advice and encouragement
- Offline fallback messages

### Life Management Suite
- Mood & energy tracking (1-10 scale)
- Gratitude journal with multiple daily entries
- Health metrics (sleep, water intake)
- Quick note capture
- Data export functionality
- Theme customization (Light/Dark/Auto)

## Tech Stack

- **Framework:** Expo (React Native)
- **Language:** TypeScript
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth (Email/Password)
- **AI Integration:** OpenRouter API (Llama 3.3 70B Instruct)
- **Icons:** Lucide React Native
- **Navigation:** Expo Router with Tabs
- **State Management:** React Context API
- **Styling:** React Native StyleSheet

## Prerequisites

- Node.js 18+ and npm
- Expo CLI
- Supabase account
- OpenRouter API account (optional, for AI features)

## Installation

1. Clone the repository
```bash
git clone <repository-url>
cd <project-directory>
```

2. Install dependencies
```bash
npm install
```

3. Configure environment variables

The `.env` file contains your Supabase credentials. To enable AI features, update the OpenRouter API key:

```
EXPO_PUBLIC_SUPABASE_URL=https://fpikswvcrfewrkqwyxkx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<your-key-here>
EXPO_PUBLIC_OPENROUTER_API_KEY=your_openrouter_api_key_here
```

### Setting up OpenRouter API (Optional)

1. Visit [OpenRouter](https://openrouter.ai/) and create an account
2. Navigate to [API Keys](https://openrouter.ai/keys)
3. Generate a new API key
4. Copy the key and replace `your_openrouter_api_key_here` in the `.env` file

**Note:** AI features will work with fallback motivational messages if no API key is configured.

## Database Setup

The Supabase database is already configured with all required tables:

- `user_profiles` - User preferences and settings
- `daily_tasks` - Time-blocked daily schedules
- `weekly_plans` - Strategic weekly planning
- `goals` - 90-day goal tracking
- `habits` - Habit definitions
- `habit_completions` - Daily habit check-ins
- `streaks` - Comprehensive streak tracking
- `mood_entries` - Daily mood and energy levels
- `gratitude_entries` - Daily gratitude journal
- `health_metrics` - Sleep, water, exercise tracking
- `reflections` - Daily/weekly reflections
- `decision_journal` - Decision tracking and outcomes
- `ai_insights` - AI-generated insights cache
- `quick_notes` - Quick capture notes

All tables have Row Level Security (RLS) enabled, ensuring users can only access their own data.

## Running the App

### Development Mode

```bash
npm run dev
```

This will start the Expo development server. You can then:

- Press `w` to open in web browser
- Scan the QR code with Expo Go app (iOS/Android)
- Press `i` for iOS simulator (macOS only)
- Press `a` for Android emulator

### Web Build

```bash
npm run build:web
```

Exports the app as a static web application.

### Type Checking

```bash
npm run typecheck
```

## Project Structure

```
├── app/
│   ├── (auth)/          # Authentication screens
│   │   └── index.tsx    # Login/Signup
│   ├── (tabs)/          # Main app tabs
│   │   ├── index.tsx    # Today (Daily Planner)
│   │   ├── week.tsx     # Weekly Strategic Planner
│   │   ├── goals.tsx    # 90-Day Goals
│   │   ├── habits.tsx   # Habits & Streaks
│   │   ├── insights.tsx # AI Insights
│   │   └── more.tsx     # Life Management & Settings
│   └── _layout.tsx      # Root layout with providers
├── contexts/
│   ├── AuthContext.tsx  # Authentication state
│   └── ThemeContext.tsx # Theme management
├── lib/
│   ├── supabase.ts      # Supabase client config
│   └── openrouter.ts    # AI integration
├── types/
│   └── env.d.ts         # Environment variable types
└── hooks/
    └── useFrameworkReady.ts # Framework initialization
```

## Key Features Explained

### Authentication
- Email/password authentication via Supabase
- Automatic session persistence
- Protected routes with auth guards
- Seamless sign-in/sign-up experience

### Data Persistence
- All data stored in Supabase PostgreSQL
- Real-time sync across devices
- Automatic conflict resolution
- Offline-capable with local caching

### AI Integration
- Uses OpenRouter API for flexible AI model access
- Currently configured with Llama 3.3 70B Instruct (free tier)
- Generates personalized daily motivation
- Context-aware insights based on user progress
- Intelligent fallback system when API unavailable

### Theme System
- Three modes: Light, Dark, Auto
- Auto mode follows system preferences
- Smooth transitions between themes
- Consistent color system across all screens

### Progress Tracking
- Real-time completion percentages
- Visual progress bars and indicators
- Streak calculations with best records
- Historical data analysis

## Usage Guide

### First Time Setup

1. **Create an Account**: Launch the app and sign up with your email
2. **Set Your Goals**: Navigate to the Goals tab and create your 90-day goals
3. **Create Habits**: Add daily habits you want to track in the Habits tab
4. **Plan Your Day**: Use the Today tab to check off time blocks as you complete them
5. **Weekly Planning**: Set your weekly theme and focus areas in the Week tab

### Daily Routine

1. **Morning**: Check Today tab, review your schedule
2. **Throughout the Day**: Check off time blocks as you complete them
3. **Evening**:
   - Log your mood and energy in More tab
   - Write gratitude entries
   - Plan tomorrow's tasks
   - Check AI Insights for personalized motivation

### Weekly Routine

1. Review weekly progress in Insights tab
2. Update goal progress
3. Plan next week's theme and priorities
4. Adjust habits based on performance

## Data Export

Export all your data anytime:

1. Go to More tab
2. Tap "Export Data"
3. Data will be logged to console (future: download as JSON)

## Troubleshooting

### "Cannot connect to Supabase"
- Check your internet connection
- Verify `.env` file has correct Supabase credentials
- Ensure Supabase project is active

### "AI features not working"
- Verify OpenRouter API key in `.env` file
- Check API key is valid at openrouter.ai
- App will use fallback messages if API unavailable

### "App won't load"
- Clear Expo cache: `npx expo start -c`
- Reinstall dependencies: `rm -rf node_modules && npm install`
- Check for TypeScript errors: `npm run typecheck`

## Security & Privacy

- All user data is encrypted in transit (HTTPS)
- Row Level Security ensures data isolation between users
- No data sharing with third parties
- AI API calls only send aggregated statistics, not personal details
- You own your data and can export it anytime

## Future Enhancements

- [ ] Push notifications for reminders
- [ ] Data visualization and analytics
- [ ] Social features and accountability partners
- [ ] Integration with calendar apps
- [ ] Voice input for quick capture
- [ ] Pomodoro timer integration
- [ ] Advanced AI coaching features
- [ ] Mobile app store deployment

## License

This project is private and proprietary.

## Support

For issues or questions, please contact the development team.

## Credits

Built with:
- Expo and React Native
- Supabase for backend services
- OpenRouter for AI integration
- Lucide for beautiful icons

---

**Life OS** - Your personal operating system for a more productive, intentional life.
