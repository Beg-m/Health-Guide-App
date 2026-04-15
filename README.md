# Health Guide App

Health Guide App is a modern mobile health assistant built with Expo + React Native + TypeScript.
It helps users search medicines, review basic/medical details, get AI-assisted guidance, and personalize experience with health profile settings.

## Features

- First-launch onboarding flow
- Auth flow (login/register/guest continue)
- Medicine search with Turkish-aware filtering and alphabetical index
- Medicine detail page with Basic Mode and Medical Mode
- Drug interaction section on detail screen
- AI chat assistant for medicine-related questions
- Health profile preferences (vegan, diabetic, lactose-free, etc.)
- Local persistence with AsyncStorage

## Tech Stack

- React Native
- Expo
- Expo Router
- TypeScript
- AsyncStorage
- Expo Linear Gradient
- React Native Markdown Display
- Ionicons (`@expo/vector-icons`)

## Project Structure

```text
app/
  (tabs)/
  auth.tsx
  onboarding.tsx
  medicine/[id].tsx
constants/
  medicines.ts
  medicines_final.json
hooks/
lib/
```

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Run the app:

```bash
npx expo start --clear
```

## Environment Variables

Create a `.env` file in the project root:

```env
EXPO_PUBLIC_ANTHROPIC_API_KEY=your_api_key_here
```

## Data and Storage

- Medicine catalog is currently local JSON (`constants/medicines_final.json`).
- App/session/preferences are stored on-device via AsyncStorage.

## Notes

- No standalone backend/database service is required for core functionality.
- AI responses are generated via external API integration configured by env key.
