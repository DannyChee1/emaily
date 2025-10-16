# Emaily - AI-Powered SMS Email Manager

Text your way to inbox zero. Emaily is an AI agent that lets you manage your email through simple text messages.

> **👉 NEW HERE? Start with [START_HERE.md](./START_HERE.md) - Get running in 5 minutes!**

## 🎯 What It Does

- **Read emails** - "Show me my unread emails"
- **Send emails** - "Email john@company.com about the meeting"
- **Search emails** - "Find emails from Sarah last week"
- **Organize** - "Archive all newsletters"
- **Smart lookup** - "Find the contact info for the recruiter at Google"

## 🚀 Quick Start

**Get started in 2 minutes!**

### Minimal Setup (Test the AI Agent)

1. **Install dependencies**
```bash
npm install
```

2. **Create `.env` file**
```env
OPENAI_API_KEY=sk-your_key_here
ENCRYPTION_KEY=any_random_32_character_string
```

3. **Test the agent**
```bash
npm run test:agent
```

That's it! You can now chat with the AI agent locally.

**For full email integration**, see [QUICKSTART.md](./QUICKSTART.md) or [SETUP_GUIDE.md](./SETUP_GUIDE.md)

### Full Production Setup

See [PROJECT_FRAMEWORK.md](./PROJECT_FRAMEWORK.md) for:
- Database setup (PostgreSQL)
- SMS integration (Twilio)
- Email OAuth (Gmail/Outlook)
- Deployment options

## 📱 How to Use

1. **Register**: Text "START" to your Twilio number
2. **Connect email**: Follow the link to connect your Gmail/Outlook
3. **Start managing**: Text commands like:
   - "Any new emails?"
   - "Send email to boss@company.com: I'll be late tomorrow"
   - "Find emails about project alpha"
   - "Delete all emails from newsletter@spam.com"

## 🏗️ Architecture

See [PROJECT_FRAMEWORK.md](./PROJECT_FRAMEWORK.md) for complete architecture details.

```
SMS (Twilio) → Backend (Node.js/Python) → AI (GPT-4) → Email APIs (Gmail/Outlook)
                    ↓
              Database (PostgreSQL) + Cache (Redis)
```

## 📚 Documentation

- [PROJECT_FRAMEWORK.md](./PROJECT_FRAMEWORK.md) - Complete feature set, architecture, and implementation guide
- [API_DOCS.md](./API_DOCS.md) - API endpoints and integration details (coming soon)
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Production deployment guide (coming soon)

## 🛣️ Roadmap

- [x] Project planning and architecture
- [ ] Week 1-2: Basic SMS handling + user auth
- [ ] Week 3-4: Gmail integration + basic email ops
- [ ] Week 5-6: AI agent with intent classification
- [ ] Week 7-8: Advanced email operations
- [ ] Week 9-10: Web intelligence and contact lookup
- [ ] Week 11-12: Testing and polish
- [ ] Week 13+: Production launch

## 🔐 Security

- All email credentials encrypted at rest (AES-256)
- OAuth 2.0 for email provider access
- TLS for all API communications
- Rate limiting to prevent abuse
- GDPR/CCPA compliant

## 💰 Pricing

- **Free**: 5 SMS/month - Perfect for trying it out
- **Pro**: $9.99/month - Unlimited SMS, priority support, advanced features, multiple email accounts

## 🤝 Contributing

This is currently a private project. Contact the maintainer for collaboration opportunities.

## 📄 License

Proprietary - All rights reserved

## 📧 Contact

Questions? Email: [your-email]

