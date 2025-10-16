/**
 * AI Intent Classifier
 * Uses OpenAI to understand user commands and extract relevant information
 */

import OpenAI from 'openai';
import type { IntentResult, IntentType, ConversationContext, Email } from '../../types';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Intent types the AI can identify
export const INTENTS: Record<string, IntentType> = {
    READ_EMAIL: 'READ_EMAIL',
    SEND_EMAIL: 'SEND_EMAIL',
    REPLY_EMAIL: 'REPLY_EMAIL',
    SEARCH_EMAIL: 'SEARCH_EMAIL',
    DELETE_EMAIL: 'DELETE_EMAIL',
    ARCHIVE_EMAIL: 'ARCHIVE_EMAIL',
    LOOKUP_CONTACT: 'LOOKUP_CONTACT',
    HELP: 'HELP',
    CONFIRM: 'CONFIRM',
    CANCEL: 'CANCEL',
    OTHER: 'OTHER'
};

const SYSTEM_PROMPT = `You are an intent classifier for an email management assistant.
Analyze the user's message and determine their intent.

Available intents:
- READ_EMAIL: User wants to read/check emails
- SEND_EMAIL: User wants to send a new email (must include recipient)
- REPLY_EMAIL: User wants to reply to an email (needs prior context)
- SEARCH_EMAIL: User wants to search for specific emails
- DELETE_EMAIL: User wants to delete email(s)
- ARCHIVE_EMAIL: User wants to archive email(s)
- LOOKUP_CONTACT: User wants to find contact information online
- HELP: User needs help or wants to know what you can do
- CONFIRM: User is confirming an action (yes, ok, do it, confirm)
- CANCEL: User is canceling an action (no, cancel, stop, nevermind)
- OTHER: Anything else

Extract entities like:
- email_address: Any email addresses mentioned
- person_name: Person's name
- subject: Email subject
- content: Email body content
- search_query: Search terms
- company: Company name
- time_range: Time periods (today, last week, etc.)

Respond ONLY with valid JSON in this exact format:
{
  "intent": "INTENT_NAME",
  "confidence": 0.95,
  "entities": {
    "email_address": "example@email.com",
    "person_name": "John Doe",
    "subject": "Meeting Tomorrow",
    "content": "Let's meet at 3pm"
  },
  "needs_context": false
}`;

/**
 * Classify user intent from their message
 * @param message - User's message
 * @param context - Conversation context (previous emails, pending actions, etc.)
 * @returns Intent classification result
 */
export async function classifyIntent(
    message: string,
    context: Partial<ConversationContext> = {}
): Promise<IntentResult> {
    try {
        const contextString = JSON.stringify({
            has_current_email: !!context.current_email,
            pending_action: context.pending_action || null,
            last_search: context.last_search || null
        });

        const response = await openai.chat.completions.create({
            model: process.env.OPENAI_MODEL || 'gpt-4',
            messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                { 
                    role: 'user', 
                    content: `Message: "${message}"\nContext: ${contextString}` 
                }
            ],
            response_format: { type: 'json_object' },
            temperature: 0.3,
            max_tokens: 300
        });

        const result = JSON.parse(response.choices[0].message.content || '{}') as IntentResult;
        
        // Validate intent
        if (!INTENTS[result.intent]) {
            console.warn(`Unknown intent: ${result.intent}, defaulting to OTHER`);
            result.intent = 'OTHER';
        }

        return result;

    } catch (error) {
        console.error('Intent classification error:', error);
        return {
            intent: 'OTHER',
            confidence: 0,
            entities: {},
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

/**
 * Generate a natural language response
 * @param prompt - What to generate a response for
 * @param data - Data to include in response
 * @returns Generated response
 */
export async function generateResponse(prompt: string, data: Record<string, any> = {}): Promise<string> {
    try {
        const response = await openai.chat.completions.create({
            model: process.env.OPENAI_MODEL || 'gpt-4',
            messages: [
                { 
                    role: 'system', 
                    content: `You are Emaily, an AI assistant for managing email via SMS.
Be concise (SMS has 160 char limits, break into multiple if needed).
Be helpful and friendly.
Use clear, simple language.` 
                },
                { 
                    role: 'user', 
                    content: `${prompt}\n\nData: ${JSON.stringify(data)}` 
                }
            ],
            temperature: 0.7,
            max_tokens: 150
        });

        return response.choices[0].message.content?.trim() || "Sorry, I had trouble processing that. Please try again.";

    } catch (error) {
        console.error('Response generation error:', error);
        return "Sorry, I had trouble processing that. Please try again.";
    }
}

/**
 * Summarize an email for SMS display
 * @param email - Email object with subject, from, body
 * @returns Concise summary
 */
export async function summarizeEmail(email: Email): Promise<string> {
    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo', // Cheaper model for summaries
            messages: [
                { 
                    role: 'system', 
                    content: 'Summarize emails in 1-2 sentences (under 100 chars). Focus on key points and action items.' 
                },
                { 
                    role: 'user', 
                    content: `From: ${email.from}\nSubject: ${email.subject}\n\n${email.body.substring(0, 1000)}` 
                }
            ],
            temperature: 0.5,
            max_tokens: 60
        });

        return response.choices[0].message.content?.trim() || 
               `${email.subject.substring(0, 80)}${email.subject.length > 80 ? '...' : ''}`;

    } catch (error) {
        console.error('Email summarization error:', error);
        // Fallback to simple truncation
        return `${email.subject.substring(0, 80)}${email.subject.length > 80 ? '...' : ''}`;
    }
}

