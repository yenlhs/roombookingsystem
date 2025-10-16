# Prerequisites Setup Status

**Last Checked:** October 15, 2025
**Status:** Ready to Start Development! ✅

---

## ✅ Installed & Verified

### Development Tools

| Tool | Version | Status | Notes |
|------|---------|--------|-------|
| Node.js | v23.10.0 | ✅ Installed | Required: v18+ |
| npm | 11.6.0 | ✅ Installed | Package manager |
| pnpm | 10.17.1 | ✅ Installed | Monorepo package manager |
| Git | 2.49.0 | ✅ Installed | Version control |
| Xcode CLI Tools | Installed | ✅ Installed | Required for iOS development |

### Git Configuration
| Setting | Value | Status |
|---------|-------|--------|
| User Name | Adrian Li-Hung-Shun | ✅ Configured |
| User Email | yenlhs@gmail.com | ✅ Configured |

---

## 📋 Accounts to Create (Action Required)

### 1. Supabase Account
**Purpose:** Backend, database, and authentication

**Steps:**
1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign up with GitHub (recommended) or email
4. Verify your email
5. You'll create the actual project in Phase 1, Task 1.2.1

**Cost:** Free tier includes:
- 500MB database space
- 5GB bandwidth
- 50,000 monthly active users
- Unlimited API requests

---

### 2. Expo Account
**Purpose:** Mobile app development and deployment

**Steps:**
1. Go to [https://expo.dev](https://expo.dev)
2. Click "Sign Up"
3. Create account (GitHub login recommended)
4. Install Expo CLI globally:
   ```bash
   npm install -g expo-cli
   ```
5. Login via CLI:
   ```bash
   npx expo login
   ```

**Cost:** Free tier includes:
- Unlimited projects
- 15 builds/month (EAS)
- Development builds

---

### 3. Vercel Account (Optional but Recommended)
**Purpose:** Deploy Next.js web app

**Steps:**
1. Go to [https://vercel.com](https://vercel.com)
2. Click "Sign Up"
3. Sign up with GitHub (recommended)
4. Authorize Vercel to access your GitHub repos

**Cost:** Free tier includes:
- Unlimited deployments
- 100GB bandwidth/month
- Automatic SSL
- Preview deployments

**Note:** You can also use Netlify, Railway, or other platforms

---

### 4. GitHub Account
**Purpose:** Code hosting and version control

**Steps:**
1. Go to [https://github.com](https://github.com)
2. Sign up for free account
3. Set up 2FA (recommended)
4. Create personal access token (for CLI operations)

**Status:** Appears to be set up (git configured with email)

---

## 🔧 Development Environment Setup

### Code Editor Setup
**Recommended:** Visual Studio Code

**VS Code Extensions to Install:**
```bash
# Open VS Code and install these extensions:
1. ESLint (dbaeumer.vscode-eslint)
2. Prettier (esbenp.prettier-vscode)
3. TypeScript Vue Plugin (Vue.vscode-typescript-vue-plugin)
4. Tailwind CSS IntelliSense (bradlc.vscode-tailwindcss)
5. GitLens (eamodio.gitlens)
6. Error Lens (usernamehw.errorlens)
7. Auto Rename Tag (formulahendry.auto-rename-tag)
8. ES7+ React/Redux/React-Native snippets (dsznajder.es7-react-js-snippets)
```

**Alternative Editors:**
- WebStorm (JetBrains)
- Cursor
- Zed

---

### Mobile Development Setup

#### iOS Development (macOS only)
✅ **Xcode Command Line Tools** - Already installed!

**Additional iOS Setup:**
1. Install Xcode from App Store (optional, but recommended)
   - Size: ~15GB
   - Used for iOS Simulator
2. Install iOS Simulator:
   ```bash
   xcode-select --install
   ```
3. Install Watchman (optional, improves performance):
   ```bash
   brew install watchman
   ```

**To run iOS simulator:**
```bash
# Will be used later in the project
npx expo start --ios
```

---

#### Android Development (Optional for macOS)
**Required:** Android Studio

**Steps:**
1. Download Android Studio from [https://developer.android.com/studio](https://developer.android.com/studio)
2. Install Android Studio
3. Open Android Studio → Preferences → Appearance & Behavior → System Settings → Android SDK
4. Install Android SDK Platform 33 (or latest)
5. Install Android SDK Build-Tools
6. Install Android Emulator
7. Create virtual device (AVD)

**Environment Variables:**
```bash
# Add to ~/.zshrc or ~/.bash_profile
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

**Note:** You can develop and test on physical Android device via Expo Go app instead

---

## 📱 Mobile Testing Options

### Option 1: Expo Go App (Easiest)
**Pros:** No setup required, instant testing
**Cons:** Limited native modules

**Steps:**
1. Install Expo Go on your phone:
   - iOS: [App Store](https://apps.apple.com/app/expo-go/id982107779)
   - Android: [Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)
2. Scan QR code when running `npx expo start`

---

### Option 2: iOS Simulator (Mac only)
**Pros:** Full native features, debugging
**Cons:** Requires Xcode

**Status:** ✅ Ready to use (Xcode CLI Tools installed)

---

### Option 3: Android Emulator
**Pros:** Full native features, debugging
**Cons:** Requires Android Studio setup

**Status:** ⏳ Needs Android Studio installation (optional)

---

### Option 4: Physical Device
**Pros:** Real performance testing
**Cons:** Requires USB debugging setup

**iOS:** Requires Apple Developer account ($99/year) for device testing
**Android:** Free, just enable Developer Mode + USB Debugging

---

## 🛠️ Additional Tools (Install as Needed)

### Optional but Useful

1. **Homebrew** (macOS package manager) - Likely already installed
   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```

2. **Watchman** (File watcher for React Native)
   ```bash
   brew install watchman
   ```

3. **Supabase CLI** (Local development)
   ```bash
   brew install supabase/tap/supabase
   ```

4. **PostgreSQL** (Local database testing - optional)
   ```bash
   brew install postgresql@15
   ```

5. **Postman** or **Insomnia** (API testing)
   - Download from respective websites

---

## ✅ Prerequisites Checklist

### Must Have (Before Starting)
- [x] Node.js v18+ installed (v23.10.0 ✅)
- [x] pnpm installed (10.17.1 ✅)
- [x] Git installed and configured (2.49.0 ✅)
- [x] Code editor installed (VS Code recommended)
- [x] Xcode CLI Tools (for iOS - installed ✅)
- [ ] Supabase account created
- [ ] Expo account created
- [ ] GitHub repository created (will do in Task 1.1.1)

### Recommended (Can set up during development)
- [ ] Vercel account created
- [ ] VS Code extensions installed
- [ ] Expo Go app installed on phone
- [ ] Watchman installed
- [ ] Supabase CLI installed

### Optional (For advanced features)
- [ ] Android Studio installed (if targeting Android)
- [ ] PostgreSQL installed locally
- [ ] API testing tool (Postman/Insomnia)

---

## 🚀 Next Steps

### You are ready to start! Here's what to do next:

1. **Create Accounts** (15 minutes)
   - [ ] Create Supabase account
   - [ ] Create Expo account
   - [ ] Create Vercel account (optional)

2. **Install Expo CLI** (2 minutes)
   ```bash
   npm install -g expo-cli
   npx expo login
   ```

3. **Install VS Code Extensions** (5 minutes)
   - Open VS Code
   - Go to Extensions (Cmd+Shift+X)
   - Search and install recommended extensions

4. **Start Building!** (Now)
   - Open BUILD_PLAN.md
   - Begin with **Task 1.1.1: Initialize Monorepo Structure**
   - Follow the sequential tasks

---

## 🆘 Troubleshooting

### Node.js Issues
```bash
# Check node version
node --version

# If wrong version, use nvm to manage versions
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18
```

### pnpm Issues
```bash
# Reinstall pnpm
npm install -g pnpm

# Or via homebrew
brew install pnpm
```

### iOS Simulator Issues
```bash
# Open simulator manually
open -a Simulator

# Reset Xcode CLI tools path
sudo xcode-select --reset
```

### Git Configuration Issues
```bash
# Set git username and email
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

---

## 📚 Useful Resources

### Documentation
- [Node.js Docs](https://nodejs.org/docs/)
- [pnpm Docs](https://pnpm.io/)
- [Expo Docs](https://docs.expo.dev/)
- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Turborepo Docs](https://turbo.build/repo/docs)

### Learning Resources
- [React Native Tutorial](https://reactnative.dev/docs/tutorial)
- [Next.js Learn](https://nextjs.org/learn)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [Supabase Quickstart](https://supabase.com/docs/guides/getting-started)

---

## 💬 Support

If you run into issues during setup:
1. Check the error message carefully
2. Search the official documentation
3. Search Stack Overflow
4. Check GitHub issues for the specific tool
5. Ask in relevant Discord/Slack communities:
   - [Supabase Discord](https://discord.supabase.com)
   - [Expo Discord](https://chat.expo.dev)
   - [Reactiflux Discord](https://www.reactiflux.com/)

---

## Summary

### ✅ What's Ready
- Development environment (Node.js, pnpm, Git)
- iOS development tools (Xcode CLI)
- Git configuration

### 📝 What You Need to Do
1. Create Supabase account (5 min)
2. Create Expo account (5 min)
3. Install Expo CLI (2 min)
4. Install VS Code extensions (5 min)
5. Create Vercel account - optional (5 min)

### ⏱️ Total Setup Time Remaining
**~20-30 minutes** to complete all account creations and final setup

---

**After completing the above steps, you'll be 100% ready to start Task 1.1.1!** 🎉
