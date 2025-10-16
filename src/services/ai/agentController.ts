/**
 * Agent Controller
 * Main orchestrator that connects intent classification with email operations
 */

import { classifyIntent, generateResponse, summarizeEmail, INTENTS } from './intentClassifier';
import { GmailService } from '../email/gmailService';
import type { 
    User, 
    EmailAccount, 
    ConversationContext, 
    IntentResult, 
    Email,
    PendingAction 
} from '../../types';

export class AgentController {
    private user: User;
    private emailAccount: EmailAccount;
    private emailService: GmailService;
    private context: ConversationContext;

    constructor(user: User, emailAccount: EmailAccount) {
        this.user = user;
        this.emailAccount = emailAccount;
        this.emailService = new GmailService(emailAccount);
        this.context = {
            current_email: null,
            last_search: null,
            pending_action: null,
            email_list: []
        };
    }

    /**
     * Process a user message and return response
     * @param message - User's message
     * @returns Response to send back
     */
    async processMessage(message: string): Promise<string> {
        try {
            // Classify intent
            const intent = await classifyIntent(message, this.context);
            
            console.log('Intent classified:', intent);

            // Route to appropriate handler
            switch (intent.intent) {
                case INTENTS.READ_EMAIL:
                    return await this.handleReadEmail(intent);
                
                case INTENTS.SEND_EMAIL:
                    return await this.handleSendEmail(intent);
                
                case INTENTS.REPLY_EMAIL:
                    return await this.handleReplyEmail(intent);
                
                case INTENTS.SEARCH_EMAIL:
                    return await this.handleSearchEmail(intent);
                
                case INTENTS.DELETE_EMAIL:
                    return await this.handleDeleteEmail(intent);
                
                case INTENTS.ARCHIVE_EMAIL:
                    return await this.handleArchiveEmail(intent);
                
                case INTENTS.CONFIRM:
                    return await this.handleConfirm(intent);
                
                case INTENTS.CANCEL:
                    return await this.handleCancel(intent);
                
                case INTENTS.HELP:
                    return this.handleHelp();
                
                default:
                    return "I didn't understand that. Text HELP for commands I support.";
            }

        } catch (error) {
            console.error('Error processing message:', error);
            return `Sorry, something went wrong: ${error instanceof Error ? error.message : 'Unknown error'}`;
        }
    }

    /**
     * Handle reading emails
     */
    private async handleReadEmail(intent: IntentResult): Promise<string> {
        try {
            const emails = await this.emailService.getUnreadEmails(5);

            if (emails.length === 0) {
                return "✅ Inbox zero! No unread emails.";
            }

            // Store in context for future reference
            this.context.email_list = emails;

            // Format response
            let response = `You have ${emails.length} unread email${emails.length > 1 ? 's' : ''}:\n\n`;

            for (let i = 0; i < emails.length; i++) {
                const email = emails[i];
                const summary = await summarizeEmail(email);
                response += `${i + 1}. ${email.from.split('<')[0].trim()}\n`;
                response += `   ${summary}\n\n`;
            }

            response += `Reply with number to read full email (e.g., "1")`;

            return response;

        } catch (error) {
            throw new Error('Could not fetch emails: ' + (error instanceof Error ? error.message : 'Unknown error'));
        }
    }

    /**
     * Handle sending emails
     */
    private async handleSendEmail(intent: IntentResult): Promise<string> {
        const { email_address, subject, content } = intent.entities;

        if (!email_address) {
            return "Who should I send this email to? Include their email address.";
        }

        if (!content && !subject) {
            return `What should I write to ${email_address}?`;
        }

        // Set up pending action for confirmation
        this.context.pending_action = {
            type: 'SEND_EMAIL',
            data: {
                to: email_address,
                subject: subject || 'Message from Emaily',
                body: content || subject || ''
            }
        };

        return `Send to: ${email_address}\nSubject: ${subject || 'Message from Emaily'}\nBody: ${content || subject}\n\nReply YES to send, or NO to cancel.`;
    }

    /**
     * Handle replying to emails
     */
    private async handleReplyEmail(intent: IntentResult): Promise<string> {
        if (!this.context.current_email) {
            return "I don't know which email to reply to. Please read an email first.";
        }

        const { content } = intent.entities;

        if (!content) {
            return "What should I say in the reply?";
        }

        this.context.pending_action = {
            type: 'REPLY_EMAIL',
            data: {
                threadId: this.context.current_email.threadId,
                body: content
            }
        };

        return `Reply to ${this.context.current_email.from}:\n"${content}"\n\nReply YES to send, or NO to cancel.`;
    }

    /**
     * Handle searching emails
     */
    private async handleSearchEmail(intent: IntentResult): Promise<string> {
        const { person_name, email_address, subject, search_query } = intent.entities;

        // Build Gmail search query
        let query = '';
        if (email_address) query += `from:${email_address} `;
        if (person_name) query += `from:${person_name} `;
        if (subject) query += `subject:${subject} `;
        if (search_query) query += search_query;

        if (!query.trim()) {
            return "What should I search for? (e.g., 'emails from John' or 'subject:meeting')";
        }

        try {
            const emails = await this.emailService.searchEmails(query.trim(), 5);

            if (emails.length === 0) {
                return `No emails found for: ${query.trim()}`;
            }

            this.context.email_list = emails;
            this.context.last_search = query.trim();

            let response = `Found ${emails.length} email${emails.length > 1 ? 's' : ''}:\n\n`;

            for (let i = 0; i < emails.length; i++) {
                const email = emails[i];
                response += `${i + 1}. ${email.from.split('<')[0].trim()}\n`;
                response += `   ${email.subject}\n`;
                response += `   ${new Date(email.date).toLocaleDateString()}\n\n`;
            }

            return response;

        } catch (error) {
            throw new Error('Search failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
        }
    }

    /**
     * Handle deleting emails
     */
    private async handleDeleteEmail(intent: IntentResult): Promise<string> {
        if (!this.context.current_email) {
            return "Which email should I delete? Read an email first, or specify.";
        }

        this.context.pending_action = {
            type: 'DELETE_EMAIL',
            data: {
                messageId: this.context.current_email.id,
                subject: this.context.current_email.subject
            }
        };

        return `Delete "${this.context.current_email.subject}"?\n\nReply YES to delete, or NO to cancel.`;
    }

    /**
     * Handle archiving emails
     */
    private async handleArchiveEmail(intent: IntentResult): Promise<string> {
        if (!this.context.current_email) {
            return "Which email should I archive? Read an email first.";
        }

        try {
            await this.emailService.archiveEmail(this.context.current_email.id);
            const subject = this.context.current_email.subject;
            this.context.current_email = null;

            return `✅ Archived: "${subject}"`;

        } catch (error) {
            throw new Error('Archive failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
        }
    }

    /**
     * Handle confirmation (YES)
     */
    private async handleConfirm(intent: IntentResult): Promise<string> {
        if (!this.context.pending_action) {
            return "Nothing to confirm. What would you like to do?";
        }

        const action = this.context.pending_action;
        this.context.pending_action = null;

        try {
            switch (action.type) {
                case 'SEND_EMAIL':
                    await this.emailService.sendEmail({
                        to: action.data.to!,
                        subject: action.data.subject!,
                        body: action.data.body!
                    });
                    return `✅ Email sent to ${action.data.to}`;

                case 'REPLY_EMAIL':
                    await this.emailService.replyToEmail(action.data.threadId!, action.data.body!);
                    return `✅ Reply sent`;

                case 'DELETE_EMAIL':
                    await this.emailService.deleteEmail(action.data.messageId!);
                    this.context.current_email = null;
                    return `✅ Deleted: "${action.data.subject}"`;

                default:
                    return "Action not recognized.";
            }

        } catch (error) {
            throw new Error('Action failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
        }
    }

    /**
     * Handle cancellation (NO)
     */
    private async handleCancel(intent: IntentResult): Promise<string> {
        if (!this.context.pending_action) {
            return "Nothing to cancel.";
        }

        this.context.pending_action = null;
        return "❌ Cancelled. What else can I help with?";
    }

    /**
     * Handle help request
     */
    private handleHelp(): string {
        return `I can help you manage email via text:\n\n` +
               `📧 READ: "show emails", "any new messages?"\n` +
               `✉️ SEND: "email john@co.com about meeting"\n` +
               `🔍 SEARCH: "find emails from Sarah"\n` +
               `🗑️ DELETE: "delete this email"\n` +
               `📁 ARCHIVE: "archive this"\n\n` +
               `Reply with a command to get started!`;
    }

    /**
     * Get current context
     */
    getContext(): ConversationContext {
        return this.context;
    }

    /**
     * Set context (for restoring sessions)
     */
    setContext(context: Partial<ConversationContext>): void {
        this.context = { ...this.context, ...context };
    }
}

