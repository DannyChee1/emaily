/**
 * Gmail Service
 * Handles all Gmail API interactions
 */

import { google } from 'googleapis';
import { decrypt } from '../../utils/encryption';
import type { Email, EmailAccount, SendEmailData, EmailOperationResult, GmailMessage } from '../../types';

export class GmailService {
    private _account: EmailAccount;
    private oauth2Client: any;
    private gmail: any;

    constructor(emailAccount: EmailAccount) {
        this._account = emailAccount;
        this.oauth2Client = new google.auth.OAuth2(
            process.env.GMAIL_CLIENT_ID,
            process.env.GMAIL_CLIENT_SECRET,
            process.env.GMAIL_REDIRECT_URI
        );

        // Set credentials
        this.oauth2Client.setCredentials({
            access_token: decrypt(emailAccount.encrypted_access_token),
            refresh_token: emailAccount.encrypted_refresh_token 
                ? decrypt(emailAccount.encrypted_refresh_token) 
                : undefined
        });

        // Auto-refresh tokens
        this.oauth2Client.on('tokens', (tokens: any) => {
            if (tokens.refresh_token) {
                // Update refresh token in database
                console.log('New refresh token received');
            }
        });

        this.gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
    }

    /**
     * Get recent unread emails
     * @param maxResults - Maximum number of emails to fetch
     * @returns Array of email objects
     */
    async getUnreadEmails(maxResults: number = 5): Promise<Email[]> {
        try {
            const response = await this.gmail.users.messages.list({
                userId: 'me',
                maxResults,
                q: 'is:unread',
                labelIds: ['INBOX']
            });

            const messages = response.data.messages || [];
            
            if (messages.length === 0) {
                return [];
            }

            // Fetch details for each email
            const detailedMessages = await Promise.all(
                messages.map((msg: { id: string }) => this.getEmailDetails(msg.id))
            );

            return detailedMessages;

        } catch (error) {
            console.error('Error fetching unread emails:', error);
            throw new Error('Failed to fetch emails from Gmail');
        }
    }

    /**
     * Get email details by ID
     * @param messageId - Gmail message ID
     * @returns Parsed email object
     */
    async getEmailDetails(messageId: string): Promise<Email> {
        try {
            const response = await this.gmail.users.messages.get({
                userId: 'me',
                id: messageId,
                format: 'full'
            });

            return this.parseEmail(response.data);

        } catch (error) {
            console.error(`Error fetching email ${messageId}:`, error);
            throw error;
        }
    }

    /**
     * Parse Gmail API email format into clean object
     * @param message - Raw Gmail message
     * @returns Parsed email
     */
    private parseEmail(message: GmailMessage): Email {
        const headers = message.payload.headers;
        
        const getHeader = (name: string): string => {
            const header = headers.find(h => h.name.toLowerCase() === name.toLowerCase());
            return header ? header.value : '';
        };

        const subject = getHeader('Subject');
        const from = getHeader('From');
        const to = getHeader('To');
        const date = getHeader('Date');
        const messageId = getHeader('Message-ID');

        // Extract email body
        let body = '';
        let htmlBody = '';

        const extractBody = (payload: any): void => {
            if (payload.body?.data) {
                const text = Buffer.from(payload.body.data, 'base64').toString('utf-8');
                if (payload.mimeType === 'text/plain') {
                    body = text;
                } else if (payload.mimeType === 'text/html') {
                    htmlBody = text;
                }
            }

            if (payload.parts) {
                payload.parts.forEach((part: any) => {
                    if (part.mimeType === 'text/plain' && part.body?.data) {
                        body = Buffer.from(part.body.data, 'base64').toString('utf-8');
                    } else if (part.mimeType === 'text/html' && part.body?.data) {
                        htmlBody = Buffer.from(part.body.data, 'base64').toString('utf-8');
                    } else if (part.parts) {
                        extractBody(part);
                    }
                });
            }
        };

        extractBody(message.payload);

        // Clean up body text
        const cleanBody = body || this.stripHtml(htmlBody) || message.snippet;

        return {
            id: message.id,
            threadId: message.threadId,
            messageId,
            subject,
            from,
            to,
            date,
            body: cleanBody,
            snippet: message.snippet,
            isUnread: message.labelIds?.includes('UNREAD') || false,
            labels: message.labelIds || []
        };
    }

    /**
     * Strip HTML tags from text
     * @param html - HTML content
     * @returns Plain text
     */
    private stripHtml(html: string): string {
        if (!html) return '';
        return html
            .replace(/<style[^>]*>.*?<\/style>/gi, '')
            .replace(/<script[^>]*>.*?<\/script>/gi, '')
            .replace(/<[^>]+>/g, '')
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .trim();
    }

    /**
     * Send an email
     * @param emailData - Email data with to, subject, body, etc.
     * @returns Sent email info
     */
    async sendEmail(emailData: SendEmailData): Promise<EmailOperationResult> {
        try {
            const { to, subject, body, cc = '', bcc = '' } = emailData;
            
            // Build email headers
            const headers = [
                `To: ${to}`,
                cc ? `Cc: ${cc}` : null,
                bcc ? `Bcc: ${bcc}` : null,
                `Subject: ${subject}`,
                'Content-Type: text/plain; charset=utf-8'
            ].filter(line => line !== null).join('\n');
            
            // Email format requires blank line between headers and body
            const email = headers + '\n\n' + body;

            const encodedEmail = Buffer.from(email)
                .toString('base64')
                .replace(/\+/g, '-')
                .replace(/\//g, '_')
                .replace(/=+$/, '');

            const response = await this.gmail.users.messages.send({
                userId: 'me',
                requestBody: {
                    raw: encodedEmail
                }
            });

            return {
                id: response.data.id,
                threadId: response.data.threadId,
                success: true
            };

        } catch (error) {
            console.error('Error sending email:', error);
            throw new Error('Failed to send email');
        }
    }

    /**
     * Reply to an email
     * @param threadId - Thread ID to reply to
     * @param body - Reply body
     * @returns Sent reply info
     */
    async replyToEmail(threadId: string, body: string): Promise<EmailOperationResult> {
        try {
            // Get original email to extract headers
            const thread = await this.gmail.users.threads.get({
                userId: 'me',
                id: threadId
            });

            const originalMessage = thread.data.messages[0];
            const headers = originalMessage.payload.headers;

            const getHeader = (name: string): string => {
                const header = headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase());
                return header ? header.value : '';
            };

            const to = getHeader('From');
            const subject = getHeader('Subject');
            const messageId = getHeader('Message-ID');
            const references = getHeader('References');

            const replySubject = subject.startsWith('Re:') ? subject : `Re: ${subject}`;

            const email = [
                `To: ${to}`,
                `Subject: ${replySubject}`,
                `In-Reply-To: ${messageId}`,
                `References: ${references ? references + ' ' : ''}${messageId}`,
                'Content-Type: text/plain; charset=utf-8',
                '',
                body
            ].join('\n');

            const encodedEmail = Buffer.from(email)
                .toString('base64')
                .replace(/\+/g, '-')
                .replace(/\//g, '_')
                .replace(/=+$/, '');

            const response = await this.gmail.users.messages.send({
                userId: 'me',
                requestBody: {
                    raw: encodedEmail,
                    threadId: threadId
                }
            });

            return {
                id: response.data.id,
                threadId: response.data.threadId,
                success: true
            };

        } catch (error) {
            console.error('Error replying to email:', error);
            throw new Error('Failed to send reply');
        }
    }

    /**
     * Search emails
     * @param query - Gmail search query
     * @param maxResults - Max results
     * @returns Array of emails
     */
    async searchEmails(query: string, maxResults: number = 10): Promise<Email[]> {
        try {
            const response = await this.gmail.users.messages.list({
                userId: 'me',
                q: query,
                maxResults
            });

            const messages = response.data.messages || [];

            if (messages.length === 0) {
                return [];
            }

            const detailedMessages = await Promise.all(
                messages.map((msg: { id: string }) => this.getEmailDetails(msg.id))
            );

            return detailedMessages;

        } catch (error) {
            console.error('Error searching emails:', error);
            throw new Error('Failed to search emails');
        }
    }

    /**
     * Delete an email
     * @param messageId - Gmail message ID
     * @returns Success status
     */
    async deleteEmail(messageId: string): Promise<boolean> {
        try {
            await this.gmail.users.messages.trash({
                userId: 'me',
                id: messageId
            });

            return true;

        } catch (error) {
            console.error('Error deleting email:', error);
            throw new Error('Failed to delete email');
        }
    }

    /**
     * Archive an email (remove from inbox)
     * @param messageId - Gmail message ID
     * @returns Success status
     */
    async archiveEmail(messageId: string): Promise<boolean> {
        try {
            await this.gmail.users.messages.modify({
                userId: 'me',
                id: messageId,
                requestBody: {
                    removeLabelIds: ['INBOX']
                }
            });

            return true;

        } catch (error) {
            console.error('Error archiving email:', error);
            throw new Error('Failed to archive email');
        }
    }

    /**
     * Mark email as read
     * @param messageId - Gmail message ID
     * @returns Success status
     */
    async markAsRead(messageId: string): Promise<boolean> {
        try {
            await this.gmail.users.messages.modify({
                userId: 'me',
                id: messageId,
                requestBody: {
                    removeLabelIds: ['UNREAD']
                }
            });

            return true;

        } catch (error) {
            console.error('Error marking email as read:', error);
            throw new Error('Failed to mark email as read');
        }
    }

    /**
     * Get the email account
     * @returns Email account
     */
    getAccount(): EmailAccount {
        return this._account;
    }

    /**
     * Create or get label ID
     * @param labelName - Label name
     * @returns Label ID
     */
    async getOrCreateLabel(labelName: string): Promise<string> {
        try {
            // List existing labels
            const response = await this.gmail.users.labels.list({
                userId: 'me'
            });

            const labels = response.data.labels || [];
            const existingLabel = labels.find((l: any) => l.name === labelName);

            if (existingLabel) {
                return existingLabel.id!;
            }

            // Create new label
            const createResponse = await this.gmail.users.labels.create({
                userId: 'me',
                requestBody: {
                    name: labelName,
                    labelListVisibility: 'labelShow',
                    messageListVisibility: 'show'
                }
            });

            return createResponse.data.id!;

        } catch (error) {
            console.error('Error managing label:', error);
            throw new Error('Failed to manage label');
        }
    }

    /**
     * Apply label to emails
     * @param messageIds - Array of message IDs
     * @param labelName - Label name
     * @returns Success status
     */
    async labelEmails(messageIds: string[], labelName: string): Promise<boolean> {
        try {
            const labelId = await this.getOrCreateLabel(labelName);

            // Gmail API supports batch modify
            await this.gmail.users.messages.batchModify({
                userId: 'me',
                requestBody: {
                    ids: messageIds,
                    addLabelIds: [labelId]
                }
            });

            return true;

        } catch (error) {
            console.error('Error labeling emails:', error);
            throw new Error('Failed to label emails');
        }
    }

    /**
     * Star emails
     * @param messageIds - Array of message IDs
     * @returns Success status
     */
    async starEmails(messageIds: string[]): Promise<boolean> {
        try {
            await this.gmail.users.messages.batchModify({
                userId: 'me',
                requestBody: {
                    ids: messageIds,
                    addLabelIds: ['STARRED']
                }
            });

            return true;

        } catch (error) {
            console.error('Error starring emails:', error);
            throw new Error('Failed to star emails');
        }
    }

    /**
     * Mark emails as read
     * @param messageIds - Array of message IDs
     * @returns Success status
     */
    async markAsReadBatch(messageIds: string[]): Promise<boolean> {
        try {
            await this.gmail.users.messages.batchModify({
                userId: 'me',
                requestBody: {
                    ids: messageIds,
                    removeLabelIds: ['UNREAD']
                }
            });

            return true;

        } catch (error) {
            console.error('Error marking emails as read:', error);
            throw new Error('Failed to mark emails as read');
        }
    }

    /**
     * Archive multiple emails
     * @param messageIds - Array of message IDs
     * @returns Success status
     */
    async archiveEmailsBatch(messageIds: string[]): Promise<boolean> {
        try {
            await this.gmail.users.messages.batchModify({
                userId: 'me',
                requestBody: {
                    ids: messageIds,
                    removeLabelIds: ['INBOX']
                }
            });

            return true;

        } catch (error) {
            console.error('Error archiving emails:', error);
            throw new Error('Failed to archive emails');
        }
    }

    /**
     * Delete multiple emails
     * @param messageIds - Array of message IDs
     * @returns Success status
     */
    async deleteEmailsBatch(messageIds: string[]): Promise<boolean> {
        try {
            // Gmail API doesn't have batch delete, so we do sequential
            await Promise.all(
                messageIds.map(id => this.gmail.users.messages.trash({
                    userId: 'me',
                    id
                }))
            );

            return true;

        } catch (error) {
            console.error('Error deleting emails:', error);
            throw new Error('Failed to delete emails');
        }
    }

    /**
     * Create an email draft
     * @param emailData - Email data
     * @returns Draft info
     */
    async createDraft(emailData: SendEmailData): Promise<{ id: string; message: string }> {
        try {
            const { to, subject, body, cc = '', bcc = '' } = emailData;
            
            // Build email headers
            const headers = [
                `To: ${to}`,
                cc ? `Cc: ${cc}` : null,
                bcc ? `Bcc: ${bcc}` : null,
                `Subject: ${subject || '(no subject)'}`,
                'Content-Type: text/plain; charset=utf-8'
            ].filter(line => line !== null).join('\n');
            
            // Email format requires blank line between headers and body
            const email = headers + '\n\n' + body;

            const encodedEmail = Buffer.from(email)
                .toString('base64')
                .replace(/\+/g, '-')
                .replace(/\//g, '_')
                .replace(/=+$/, '');

            const response = await this.gmail.users.drafts.create({
                userId: 'me',
                requestBody: {
                    message: {
                        raw: encodedEmail
                    }
                }
            });

            return {
                id: response.data.id!,
                message: `Draft created: ${subject || '(no subject)'}`
            };

        } catch (error) {
            console.error('Error creating draft:', error);
            throw new Error('Failed to create draft');
        }
    }
}

