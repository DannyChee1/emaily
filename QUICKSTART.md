# Emaily - Quick Start (5 Minutes)

Get the AI email agent running in under 5 minutes!

## 1. Install Dependencies

```bash
npm install
```

## 2. Create `.env` File

Create a file called `.env` in the root directory:

```env
# Get from https://platform.openai.com/api-keys
OPENAI_API_KEY=sk-proj-your_key_here

# Any random 32+ character string
ENCRYPTION_KEY=change_this_to_a_random_string_at_least_32_characters_long

# Optional
LOG_LEVEL=info
```

**That's it for basic testing!**

## 3. Test the Agent

```bash
npm run test:agent
```

You should see:
```
🤖 Emaily AI Agent - Test Mode
============================================
Testing the AI agent locally without SMS
Type your commands below (or "exit" to quit)
============================================
```

## 4. Try Some Commands

Type these commands to see the AI in action:

```
You: show me my emails
```

```
You: send email to john@company.com about tomorrow's meeting
```

```
You: find emails from Sarah about the project
```

```
You: help
```

The AI will understand your intent and extract the relevant information!

## What's Working Now?

- ✅ **TypeScript** - Full type safety and autocomplete
- ✅ **Intent Classification** - AI understands your commands
- ✅ **Entity Extraction** - Pulls out emails, names, subjects
- ✅ **Conversation Flow** - Handles confirmations and cancellations
- ⏳ **Email Operations** - Need Gmail OAuth (see SETUP_GUIDE.md)

## Next Steps

1. **To test actual email operations**: Follow `SETUP_GUIDE.md` to set up Gmail OAuth
2. **To add SMS**: Set up Twilio (coming soon)
3. **To deploy**: See `PROJECT_FRAMEWORK.md` for deployment options

## Troubleshooting

**"OPENAI_API_KEY not found"**
- Make sure you created a `.env` file (not `.env.example`)
- Copy your OpenAI API key from https://platform.openai.com/api-keys

**"Module not found"**
- Run `npm install` again
- Make sure you're in the `EMAILY` directory

**Want to see what the AI is thinking?**
- Set `LOG_LEVEL=debug` in your `.env` file

---

## Cost for Testing

- **OpenAI API**: ~$0.03 per conversation (GPT-4)
- **Gmail API**: Free
- **Total**: ~$1-2 for a full day of testing

---

That's it! You now have a working AI email agent. 🎉

For full email functionality, see `SETUP_GUIDE.md`.
For the complete roadmap, see `PROJECT_FRAMEWORK.md`.

