# Emaily

An autonomous AI agent leveraging OpenAI function calling and agentic workflows to manage email operations through natural language. Built with TypeScript, OpenAI integration, Gmail API, Google OAuth, and implements dynamic tool orchestration with context-aware decision making.

## Architecture

**Structure:**
- **Agent:** Stateful loop with dynamic tool selection
- **Function Calling Protocol:** LLM chains Gmail API operations based on conversational context
- **Context:** Email retrieval with semantic understanding (search → read → analyze → act)
- **OAuth 2.0:** Secure authentication with encrypted token management
- **Batch Processing:** Grouping of similar operations with unique header preservation per recipient

The agent implements a **self-correcting execution loop** where the LLM observes tool outputs and organizes its function calling, enabling complex multi-step workflows from single natural language commands.

**Example Single-shot operations:**
```
"Reply to all linkedin emails with 'thanks for reaching out'"
→ Search orchestration → Parallel email retrieval → Context analysis → Batch reply drafting → User confirmation → Execution
```

### Some tools:
- `search_emails`: Gmail API query orchestration with advanced filtering
- `read_email`: Context retrieval with thread awareness
- `send_email`: Async email dispatch with confirmation
- `reply_to_email`: Thread-preserving reply with header injection
- `batch_reply_emails`: Parallelized reply operations with unique recipient handling
- `delete_emails`: Multi-entity deletion with confirmation gates
- `archive_emails`: Bulk labelling via Gmail API
- `label_emails`: Dynamic label creation and application
- `star_emails`: Priority flagging operations
- `mark_as_read`: Batch read state modification
- `create_draft`: Deferred send with draft API

## Setup

1. **Install dependencies:**
```bash
npm install
```

2. **Configure local environment:**
```env
OPENAI_API_KEY=your_openai_key          # GPT-4/3.5-turbo

# Security
ENCRYPTION_KEY=your_32_char_key         # AES-256-GCM token encryption

# Google OAuth 2.0
GMAIL_CLIENT_ID=your_google_client_id
GMAIL_CLIENT_SECRET=your_google_secret
GMAIL_REDIRECT_URI=http://localhost:3000/auth/callback

# Test Credentials (optional)
TEST_ACCESS_TOKEN=your_test_token
TEST_REFRESH_TOKEN=your_refresh_token
```

3. **Run**
```bash
npm run test:agent
```

Current implementation runs standalone without requiring Twilio SMS infrastructure or PostgreSQL.

## Project Structure

```
src/
├── services/
│   ├── ai/
│   │   ├── functionCallingAgent.ts
│   │   └── tools.ts
│   │
│   ├── email/
│   │   └── gmailService.ts
│   │
│   └── utils/
│       ├── encryption.ts
│       └── logger.ts
│
├── types/
│   └── index.ts
│
test-agent.ts
```

## Docker

```bash
docker-compose up -d  #PostgreSQL + Redis + PGAdmin
```

Services:
- PostgreSQL 15 (port 5432)
- Redis 7 (port 6379)
- PGAdmin (port 5050, optional)
- Redis Commander (port 8081, optional)
- OAuth 2.0

## Commands

```bash
npm run dev
npm run build
npm run test:agent
```



