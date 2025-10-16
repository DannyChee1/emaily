# Emaily - Setup Guide

This guide will walk you through setting up the AI email agent locally.

## Prerequisites

- Node.js 18+ installed
- An OpenAI API key
- A Gmail account (for testing)
- Optional: Twilio account (for SMS later)

---

## Step 1: Install Dependencies

```bash
npm install
```

---

## Step 2: Set Up Environment Variables

1. Copy the example env file:
```bash
copy .env.example .env
```

2. **Required Variables** (minimum to test):

Edit `.env` and add:

```env
# REQUIRED: Get from https://platform.openai.com/api-keys
OPENAI_API_KEY=sk-your_openai_key_here

# REQUIRED: Any random 32+ character string
ENCRYPTION_KEY=make_this_a_long_random_string_at_least_32_chars

# Optional for now (for logging)
LOG_LEVEL=info
```

---

## Step 3: Test the AI Agent (Without Email)

You can test the AI intent classification without setting up Gmail:

```bash
npm run test:agent
```

This will let you chat with the agent and see how it classifies your intents!

Try commands like:
- "show me my emails"
- "send email to john@company.com about the project"
- "find emails from Sarah"
- "help"

**Note**: Actual email operations won't work yet (we need Gmail OAuth), but you'll see the AI understanding your commands!

---

## Step 4: Set Up Gmail OAuth (For Full Email Testing)

To actually read/send emails, you need Google OAuth credentials:

### 4.1 Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (e.g., "Emaily Dev")
3. Enable the Gmail API:
   - Go to "APIs & Services" > "Library"
   - Search for "Gmail API"
   - Click "Enable"

### 4.2 Create OAuth Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Configure consent screen (if prompted):
   - User Type: External (for testing)
   - App name: "Emaily Dev"
   - User support email: your email
   - Developer contact: your email
   - Save
4. Create OAuth client ID:
   - Application type: Web application
   - Name: "Emaily Local"
   - Authorized redirect URIs: `http://localhost:3000/auth/gmail/callback`
   - Click "Create"
5. Copy the **Client ID** and **Client Secret**

### 4.3 Add to .env

```env
GMAIL_CLIENT_ID=your_client_id.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=your_client_secret
GMAIL_REDIRECT_URI=http://localhost:3000/auth/gmail/callback
```

### 4.4 Get OAuth Tokens

**Quick Method** - Use Google's OAuth Playground:

1. Go to [OAuth 2.0 Playground](https://developers.google.com/oauthplayground/)
2. Click the gear icon (top right)
3. Check "Use your own OAuth credentials"
4. Enter your Client ID and Client Secret
5. In "Step 1", find "Gmail API v1"
6. Select these scopes:
   - `https://www.googleapis.com/auth/gmail.modify`
   - `https://www.googleapis.com/auth/gmail.send`
7. Click "Authorize APIs"
8. Sign in with your Google account
9. Click "Exchange authorization code for tokens"
10. Copy the **Access token** and **Refresh token**

Add to `.env`:
```env
TEST_ACCESS_TOKEN=your_access_token
TEST_REFRESH_TOKEN=your_refresh_token
```

---

## Step 5: Test Full Email Operations

Now you can test with real email operations:

```bash
npm run test:agent
```

Try:
- "show me my unread emails" - Should list your actual emails!
- "send email to yourself@gmail.com test from emaily"
- "search emails from someone@email.com"

---

## Step 6: Understanding the Code

The agent is built with these key components:

### 📁 File Structure

```
src/
├── services/
│   ├── ai/
│   │   ├── intentClassifier.js  ← AI that understands commands
│   │   └── agentController.js   ← Main orchestrator
│   ├── email/
│   │   └── gmailService.js      ← Gmail API wrapper
│   └── utils/
│       ├── encryption.js        ← Security utilities
│       └── logger.js            ← Logging
test-agent.js                     ← Test interface
```

### 🔄 How It Works

1. **User sends message** → `test-agent.js`
2. **Intent classification** → `intentClassifier.js` (uses GPT-4)
3. **Route to handler** → `agentController.js`
4. **Email operation** → `gmailService.js` (Gmail API)
5. **Response generated** → Back to user

---

## Troubleshooting

### "OPENAI_API_KEY not found"
- Make sure you have a `.env` file (not `.env.example`)
- Check that `OPENAI_API_KEY=sk-...` is set correctly
- Make sure you have credits in your OpenAI account

### "ENCRYPTION_KEY not found"
- Add any random string (32+ characters) to your `.env`:
  ```env
  ENCRYPTION_KEY=my_super_secret_encryption_key_123456789
  ```

### "Failed to decrypt data"
- Your tokens might be in the wrong format
- Make sure `TEST_ACCESS_TOKEN` and `TEST_REFRESH_TOKEN` are the actual tokens (not encrypted)
- The encryption happens automatically in the code

### "invalid_grant" error
- Your OAuth tokens expired (they expire after ~1 hour)
- Go back to OAuth Playground and get fresh tokens
- The refresh token should work longer, but may need to be refreshed

### Gmail API quota exceeded
- Google has rate limits (250 quota units/user/second, 1 billion/day)
- For testing, this should be plenty
- If you hit limits, wait a few minutes

---

## Next Steps

Once the agent works locally:

1. **Add Database** - Set up PostgreSQL for user management
2. **Add SMS** - Integrate Twilio for text message interface
3. **Add Auth** - Build user registration and OAuth flow
4. **Deploy** - Deploy to Railway/Render/AWS

See `PROJECT_FRAMEWORK.md` for the complete roadmap!

---

## Cost Tracking

Current costs for testing:
- **OpenAI**: ~$0.03 per conversation (GPT-4)
- **Gmail API**: Free (within limits)
- **Total**: ~$1-5 for extensive testing

---

## Questions?

Check the main `PROJECT_FRAMEWORK.md` for architecture details, or review the code comments in each file.

Happy building! 🚀

