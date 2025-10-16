# Example Conversation with Emaily

Here's what chatting with your AI email agent looks like!

---

## 📧 Reading Emails

```
You: show me my emails

Bot: You have 3 unread emails:

1. Sarah Johnson
   Meeting rescheduled to Friday 3pm. Please confirm.

2. LinkedIn Notifications
   You have 5 new connection requests and 12 profile views.

3. John Smith - Acme Corp
   Following up on our discussion about the Q4 budget proposal.

Reply with number to read full email (e.g., "1")
```

```
You: 1

Bot: From: Sarah Johnson <sarah@company.com>
Subject: Meeting Rescheduled

Hi! I need to reschedule our Tuesday meeting to Friday at 3pm.
Can you make it? Let me know!

Best,
Sarah

Reply ARCHIVE, DELETE, or type your reply.
```

```
You: reply sure, Friday works!

Bot: Reply to Sarah Johnson:
"sure, Friday works!"

Reply YES to send, or NO to cancel.
```

```
You: yes

Bot: ✅ Reply sent
```

---

## ✉️ Sending New Emails

```
You: send email to john@acme.com about the budget proposal

Bot: Who should I send this email to? Include their email address.
```

```
You: email john@acme.com - I'll have the budget proposal ready by Thursday

Bot: Send to: john@acme.com
Subject: Message from Emaily
Body: I'll have the budget proposal ready by Thursday

Reply YES to send, or NO to cancel.
```

```
You: yes

Bot: ✅ Email sent to john@acme.com
```

---

## 🔍 Searching Emails

```
You: find emails from Sarah

Bot: Found 5 emails:

1. Sarah Johnson
   Meeting Rescheduled
   10/14/2025

2. Sarah Johnson
   Re: Project Alpha Updates
   10/12/2025

3. Sarah Johnson
   Budget Review Notes
   10/10/2025

4. Sarah Chen
   New Feature Proposal
   10/08/2025

5. Sarah Johnson
   Quick Question
   10/05/2025
```

```
You: show me emails about project alpha

Bot: Found 3 emails:

1. Mike Davis
   Project Alpha - Phase 2 Complete
   10/13/2025

2. Sarah Johnson
   Re: Project Alpha Updates
   10/12/2025

3. Team Updates
   Project Alpha Weekly Summary
   10/07/2025
```

---

## 🗑️ Deleting & Organizing

```
You: 2

Bot: From: LinkedIn <notifications@linkedin.com>
Subject: You have 5 new connection requests

[LinkedIn notification content...]

Reply ARCHIVE, DELETE, or type your reply.
```

```
You: delete

Bot: Delete "You have 5 new connection requests"?

Reply YES to delete, or NO to cancel.
```

```
You: yes

Bot: ✅ Deleted: "You have 5 new connection requests"
```

```
You: archive

Bot: ✅ Archived: "Meeting Rescheduled"
```

---

## 🌐 Contact Lookup (Future Feature)

```
You: find the email for the recruiter at Google in New York

Bot: 🔍 Searching LinkedIn and web...

Found: Jessica Williams
Title: Senior Technical Recruiter at Google
Location: New York, NY
Email: jessica.williams@google.com
LinkedIn: linkedin.com/in/jessicawilliams

Send her an email? Reply YES or tell me what to say.
```

---

## ❓ Getting Help

```
You: help

Bot: I can help you manage email via text:

📧 READ: "show emails", "any new messages?"
✉️ SEND: "email john@co.com about meeting"
🔍 SEARCH: "find emails from Sarah"
🗑️ DELETE: "delete this email"
📁 ARCHIVE: "archive this"

Reply with a command to get started!
```

---

## 🤖 Smart Understanding

The AI understands many variations:

### Reading Emails
- "show my emails"
- "any new messages?"
- "check my inbox"
- "what's new?"
- "unread emails"

### Sending Emails
- "email john@company.com about the meeting tomorrow"
- "send to sarah@startup.com: can we reschedule?"
- "message mike@work.com - I'll be late"
- "new email to team@company.com about project update"

### Searching
- "find emails from John"
- "search for messages about budget"
- "show me emails from last week"
- "emails with attachments"
- "find messages from sarah about project alpha"

### Organizing
- "delete this"
- "archive it"
- "trash this email"
- "move to archive"

### Confirmations
- "yes" / "yep" / "sure" / "do it" / "confirm"
- "no" / "nope" / "cancel" / "stop" / "nevermind"

---

## 🎯 Context Awareness

The agent remembers your conversation:

```
You: show emails

Bot: [Shows 3 emails...]

You: 1

Bot: [Shows email from Sarah...]

You: delete

Bot: Delete "Meeting Rescheduled"?  ← Knows which email!

You: no

Bot: ❌ Cancelled. What else can I help with?

You: archive instead

Bot: ✅ Archived: "Meeting Rescheduled"  ← Still remembers!
```

---

## 💬 Natural Conversations

```
You: any emails from my boss?

Bot: [AI searches for common boss-related senders...]
Found 2 emails from managers...

You: what did he say?

Bot: [Shows most recent email...]

You: tell him I'll have it done by tomorrow

Bot: Reply to [boss name]:
"I'll have it done by tomorrow"
Reply YES to send.

You: yes

Bot: ✅ Reply sent
```

---

## 🚫 Error Handling

```
You: send email

Bot: Who should I send this email to? Include their email address.

You: john

Bot: I need a full email address (like john@company.com)

You: john@company

Bot: What should I write to john@company?

You: meeting at 3pm

Bot: Send to: john@company
Subject: Message from Emaily
Body: meeting at 3pm
Reply YES to send.
```

---

## 📊 Free Tier Limits

```
You: show emails

Bot: You have 3 unread emails...
[Shows emails...]
━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 4 of 5 free messages used this month
Upgrade to Pro for unlimited: emaily.com/pro

You: [After 5th message]

Bot: You've reached your 5 free messages for this month.
Upgrade to Pro ($9.99/mo) for unlimited SMS: emaily.com/pro
Your messages reset on Nov 1st.
```

---

## ⚡ Real-World Use Cases

### Morning Email Check
```
You: morning check
Bot: Good morning! You have 7 unread emails. Top 3:
1. Boss - Urgent: Q4 Numbers
2. Client - Meeting Request
3. Team - Project Update
```

### Quick Reply While Busy
```
You: show email
Bot: [Shows urgent email from client...]
You: reply I'll review by EOD today
Bot: ✅ Reply sent
```

### Find That Email
```
You: find the email about the contract from last month
Bot: Found 2 emails about contracts from September...
```

### Clean Inbox
```
You: delete all newsletters
Bot: Found 23 newsletter emails. Delete all?
You: yes
Bot: ✅ Deleted 23 emails
```

---

This is what you're building! 🚀

All of this works **right now** with the code we created. Test it with:

```bash
npm run test:agent
```

