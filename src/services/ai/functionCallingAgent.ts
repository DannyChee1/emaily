import dotenv from 'dotenv';
import OpenAI from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat';
import { GmailService } from '../email/gmailService';
import { EMAIL_TOOLS, ToolName } from './tools';
import type { User, EmailAccount } from '../../types';
import { generateToken } from '../../utils/encryption';

// Load environment variables
dotenv.config();

// Initialize OpenAI client
const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

interface PendingConfirmation {
    type: 'SEND_EMAIL' | 'REPLY_EMAIL' | 'BATCH_REPLY' | 'DELETE_EMAILS';
    data: any;
    preview: string;
}

export class FunctionCallingAgent {
    private _user: User;
    private _emailAccount: EmailAccount;
    private emailService: GmailService;
    public conversationHistory: ChatCompletionMessageParam[] = [];
    public pendingConfirmations: Map<string, PendingConfirmation> = new Map();

    constructor(user: User, emailAccount: EmailAccount) {
        this._user = user;
        this._emailAccount = emailAccount;
        this.emailService = new GmailService(emailAccount);
    }

    /**
     * Process a user message and execute the AI agent loop
     */
    async processMessage(message: string): Promise<string> {
        console.log('\nProcessing message:', message);

        // Check if this is a confirmation (YES/NO)
        if (this.isConfirmation(message)) {
            return await this.handleConfirmation(message);
        }

        // Add user message to history
        this.conversationHistory.push({
            role: 'user',
            content: message
        });

        // Run the agent loop
        const response = await this.runAgentLoop();
        
        return response;
    }


    private async runAgentLoop(): Promise<string> {
        const maxIterations = 15; // Prevent infinite loops
        let iteration = 0;

        console.log('\n Starting agent loop...\n');

        while (iteration < maxIterations) {
            iteration++;
            console.log(`--- Iteration ${iteration} ---`);

            try {
                const response = await client.chat.completions.create({
                    model: process.env.AI_MODEL || 'gpt-3.5-turbo',
                    messages: [
                        { 
                            role: 'system', 
                            content: this.getSystemPrompt()
                        },
                        ...this.conversationHistory
                    ],
                    tools: EMAIL_TOOLS,
                    tool_choice: 'auto',
                    temperature: 0.3
                });

                const assistantMessage = response.choices[0].message;
                
                // Check if AI wants to use tools
                if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
                    console.log(`Emaily wants to call ${assistantMessage.tool_calls.length} tool(s)`);
                    
                    // Execute all tool calls
                    const toolResults = await this.executeToolCalls(assistantMessage.tool_calls);
                    
                    // Add assistant message and tool results to history
                    this.conversationHistory.push({
                        role: 'assistant',
                        content: assistantMessage.content || '',
                        tool_calls: assistantMessage.tool_calls
                    });
                    
                    for (const result of toolResults) {
                        this.conversationHistory.push(result);
                    }
                    
                    // Continue loop - AI will see tool results and decide next steps
                    continue;
                }
                
                if (assistantMessage.content) {
                    console.log('Emaily has final response\n');
                    this.conversationHistory.push({
                        role: 'assistant',
                        content: assistantMessage.content
                    });
                    return assistantMessage.content;
                }
                
                // Shouldn't reach here, but handle gracefully
                console.log('No tool calls and no content');
                return "I've completed what I can. Anything else?";
                
            } catch (error) {
                console.error('Error in agent loop:', error);
                return `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}`;
            }
        }
        
        return `I've taken ${maxIterations} steps but need more to complete this task. Can you break it down into smaller requests?`;
    }

    /**
     * Execute tool calls from the AI
     */
    private async executeToolCalls(toolCalls: any[]): Promise<ChatCompletionMessageParam[]> {
        const results: ChatCompletionMessageParam[] = [];
        
        for (const toolCall of toolCalls) {
            const toolName = toolCall.function.name as ToolName;
            const args = JSON.parse(toolCall.function.arguments);
            
            console.log(`  → Executing: ${toolName}(${JSON.stringify(args).substring(0, 100)}...)`);
            
            let result: any;
            
            try {
                switch (toolName) {
                    case 'search_emails':
                        result = await this.tool_searchEmails(args);
                        break;
                    case 'read_email':
                        result = await this.tool_readEmail(args);
                        break;
                    case 'send_email':
                        result = await this.tool_sendEmail(args);
                        break;
                    case 'reply_to_email':
                        result = await this.tool_replyToEmail(args);
                        break;
                    case 'batch_reply_emails':
                        result = await this.tool_batchReplyEmails(args);
                        break;
                    case 'delete_emails':
                        result = await this.tool_deleteEmails(args);
                        break;
                    case 'archive_emails':
                        result = await this.tool_archiveEmails(args);
                        break;
                    case 'label_emails':
                        result = await this.tool_labelEmails(args);
                        break;
                    case 'star_emails':
                        result = await this.tool_starEmails(args);
                        break;
                    case 'mark_as_read':
                        result = await this.tool_markAsRead(args);
                        break;
                    case 'create_draft':
                        result = await this.tool_createDraft(args);
                        break;
                    default:
                        result = { error: `Unknown tool: ${toolName}` };
                }
                
                console.log(`  * Result:`, JSON.stringify(result).substring(0, 150));
                
            } catch (error) {
                console.error(`  * Error:`, error);
                result = { 
                    error: error instanceof Error ? error.message : 'Unknown error',
                    success: false
                };
            }
            
            // Add tool result to messages
            results.push({
                role: 'tool',
                tool_call_id: toolCall.id,
                content: JSON.stringify(result)
            });
        }
        
        return results;
    }

    // ==================== TOOL IMPLEMENTATIONS ====================

    private async tool_searchEmails(args: { query: string, max_results?: number }) {
        const emails = await this.emailService.searchEmails(args.query, args.max_results || 10);
        
        return {
            success: true,
            count: emails.length,
            emails: emails.map(e => ({
                id: e.id,
                from: e.from,
                subject: e.subject,
                date: e.date,
                snippet: e.snippet.substring(0, 100)
            }))
        };
    }

    private async tool_readEmail(args: { email_id: string }) {
        const email = await this.emailService.getEmailDetails(args.email_id);
        
        // Clean email body: remove excessive whitespace while preserving paragraphs
        const cleanedBody = email.body
            .trim()
            .replace(/\n{3,}/g, '\n\n')  // Max 2 consecutive newlines
            .replace(/[ \t]+/g, ' ')      // Collapse spaces/tabs
            .substring(0, 1000);
        
        return {
            success: true,
            email: {
                id: email.id,
                threadId: email.threadId,
                from: email.from,
                
                to: email.to,
                subject: email.subject,
                date: email.date,
                body: cleanedBody,
                snippet: email.snippet
            }
        };
    }

    private async tool_sendEmail(args: { to: string, subject: string, body: string, cc?: string, bcc?: string }) {
        // ALWAYS require confirmation for sends
        const confirmId = generateToken(8);
        
        this.pendingConfirmations.set(confirmId, {
            type: 'SEND_EMAIL',
            data: args,
            preview: `To: ${args.to}\nSubject: ${args.subject}\n${args.cc ? `CC: ${args.cc}\n` : ''}Body: ${args.body.substring(0, 100)}...`
        });
        
        return {
            success: false,
            status: 'REQUIRES_CONFIRMATION',
            confirm_id: confirmId,
            message: 'Email drafted. User must reply YES to send or NO to cancel.',
            preview: `To: ${args.to}\nSubject: ${args.subject}\n${args.cc ? `CC: ${args.cc}\n` : ''}Body: ${args.body.substring(0, 200)}...`
        };
    }

    private async tool_replyToEmail(args: { email_id: string, reply_body: string, cc?: string }) {
        // Get original email for context
        const email = await this.emailService.getEmailDetails(args.email_id);
        
        const confirmId = generateToken(8);
        
        this.pendingConfirmations.set(confirmId, {
            type: 'REPLY_EMAIL',
            data: { ...args, threadId: email.threadId },
            preview: `Reply to: ${email.from}\nRe: ${email.subject}\n${args.cc ? `CC: ${args.cc}\n` : ''}Body: ${args.reply_body.substring(0, 100)}...`
        });
        
        return {
            success: false,
            status: 'REQUIRES_CONFIRMATION',
            confirm_id: confirmId,
            message: 'Reply drafted. User must reply YES to send or NO to cancel.',
            preview: `Reply to: ${email.from}\nRe: ${email.subject}\nBody: ${args.reply_body.substring(0, 200)}...`
        };
    }

    private async tool_batchReplyEmails(args: { email_ids: string[], reply_body: string }) {
        // Get email subjects for preview
        const emailPreviews = await Promise.all(
            args.email_ids.slice(0, 5).map(async id => {
                const email = await this.emailService.getEmailDetails(id);
                return `  • ${email.from} - ${email.subject}`;
            })
        );
        
        const confirmId = generateToken(8);
        
        this.pendingConfirmations.set(confirmId, {
            type: 'BATCH_REPLY',
            data: args,
            preview: `Reply to ${args.email_ids.length} emails:\n${emailPreviews.join('\n')}\n\nMessage: ${args.reply_body.substring(0, 100)}...`
        });
        
        return {
            success: false,
            status: 'REQUIRES_CONFIRMATION',
            confirm_id: confirmId,
            message: `Prepared to reply to ${args.email_ids.length} emails. User must reply YES to send all or NO to cancel.`,
            preview: `Reply to ${args.email_ids.length} emails with:\n${args.reply_body.substring(0, 200)}...`
        };
    }

    private async tool_deleteEmails(args: { email_ids: string[] }) {
        const confirmId = generateToken(8);
        
        this.pendingConfirmations.set(confirmId, {
            type: 'DELETE_EMAILS',
            data: args,
            preview: `Delete ${args.email_ids.length} email(s)`
        });
        
        return {
            success: false,
            status: 'REQUIRES_CONFIRMATION',
            confirm_id: confirmId,
            message: `Prepared to delete ${args.email_ids.length} emails. User must reply YES to confirm or NO to cancel.`
        };
    }

    private async tool_archiveEmails(args: { email_ids: string[] }) {
        await this.emailService.archiveEmailsBatch(args.email_ids);
        
        return {
            success: true,
            message: `Archived ${args.email_ids.length} email(s)`
        };
    }

    private async tool_labelEmails(args: { email_ids: string[], label_name: string }) {
        await this.emailService.labelEmails(args.email_ids, args.label_name);
        
        return {
            success: true,
            message: `Applied label "${args.label_name}" to ${args.email_ids.length} email(s)`
        };
    }

    private async tool_starEmails(args: { email_ids: string[] }) {
        await this.emailService.starEmails(args.email_ids);
        
        return {
            success: true,
            message: `Starred ${args.email_ids.length} email(s)`
        };
    }

    private async tool_markAsRead(args: { email_ids: string[] }) {
        await this.emailService.markAsReadBatch(args.email_ids);
        
        return {
            success: true,
            message: `Marked ${args.email_ids.length} email(s) as read`
        };
    }

    private async tool_createDraft(args: { to: string, subject?: string, body: string }) {
        const result = await this.emailService.createDraft({
            to: args.to,
            subject: args.subject || '(no subject)',
            body: args.body
        });
        
        return {
            success: true,
            draft_id: result.id,
            message: result.message
        };
    }

    // ==================== CONFIRMATION HANDLING ====================

    private isConfirmation(message: string): boolean {
        const msg = message.trim().toLowerCase();
        return ['yes', 'y', 'confirm', 'ok', 'no', 'n', 'cancel', 'nope'].includes(msg);
    }

    private async handleConfirmation(message: string): Promise<string> {
        const isYes = ['yes', 'y', 'confirm', 'ok'].includes(message.trim().toLowerCase());
        
        if (!isYes) {
            // User said NO
            this.pendingConfirmations.clear();
            return "Cancelled. Nothing was sent or changed.";
        }
        
        // User said YES - execute all pending confirmations
        if (this.pendingConfirmations.size === 0) {
            return "I don't have anything waiting for confirmation. What would you like to do?";
        }
        
        const results: string[] = [];
        
        for (const [_confirmId, confirmation] of this.pendingConfirmations) {
            try {
                switch (confirmation.type) {
                    case 'SEND_EMAIL':
                        await this.emailService.sendEmail(confirmation.data);
                        results.push(`Sent email to ${confirmation.data.to}`);
                        break;
                        
                    case 'REPLY_EMAIL':
                        await this.emailService.replyToEmail(
                            confirmation.data.threadId,
                            confirmation.data.reply_body
                        );
                        results.push(`Reply sent`);
                        break;
                        
                    case 'BATCH_REPLY':
                        const { email_ids, reply_body } = confirmation.data;
                        for (const email_id of email_ids) {
                            const email = await this.emailService.getEmailDetails(email_id);
                            await this.emailService.replyToEmail(email.threadId, reply_body);
                        }
                        results.push(`Sent ${email_ids.length} replies`);
                        break;
                        
                    case 'DELETE_EMAILS':
                        await this.emailService.deleteEmailsBatch(confirmation.data.email_ids);
                        results.push(`Deleted ${confirmation.data.email_ids.length} emails`);
                        break;
                }
            } catch (error) {
                results.push(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }
        
        // Clear confirmations
        this.pendingConfirmations.clear();
        
        return results.join('\n');
    }

    // ==================== SYSTEM PROMPT ====================

    private getSystemPrompt(): string {
        return `You are Emaily, an AI email assistant accessible via SMS.

You have access to powerful email tools that let you search, read, send, reply, organize, and manage emails.

IMPORTANT RULES:
1. When user asks to act on multiple emails (e.g., "reply to all X emails"), use the batch tools efficiently
2. For sending/replying, ALWAYS use the appropriate tool - it will automatically require user confirmation
3. Search before acting - don't assume you know which emails to act on
4. For complex tasks, break them into steps: search → read → act
5. Be concise in your responses (SMS has character limits)
6. Confirm destructive actions

AVAILABLE TOOLS:
- search_emails: Find emails matching criteria
- read_email: Get full email content
- send_email: Send new email (requires confirmation)
- reply_to_email: Reply to specific email (requires confirmation)
- batch_reply_emails: Reply to multiple emails with same message (requires confirmation)
- delete_emails: Delete emails (requires confirmation)
- archive_emails: Archive emails
- label_emails: Apply labels (creates if needed)
- star_emails: Star important emails
- mark_as_read: Mark as read
- create_draft: Create draft for later

WORKFLOW EXAMPLE:
User: "reply to all linkedin emails with thanks"
1. search_emails(query: "linkedin")
2. For each result: reply_to_email() or use batch_reply_emails()
3. System will ask user to confirm with YES/NO

Be smart about using tools efficiently. Use batch operations when possible.`;
    }

    /**
     * Get current user
     */
    getUser(): User {
        return this._user;
    }

    /**
     * Get email account
     */
    getEmailAccount(): EmailAccount {
        return this._emailAccount;
    }

    /**
     * Reset conversation history
     */
    resetConversation(): void {
        this.conversationHistory = [];
        this.pendingConfirmations.clear();
    }
}

