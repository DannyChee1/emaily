/**
 * Gmail Service
 * Handles all Gmail API interactions
 */

import { google } from 'googleapis';
import { decrypt } from '../../utils/encryption';
import type { Email, EmailAccount, SendEmailData, EmailOperationResult, GmailMessage } from '../../types';

export class GmailService {
    private account: EmailAccount;
    private oauth2Client: any;
    private gmail: any;

    constructor(emailAccount: EmailAccount) {
        this.account = emailAccount;
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
            
            const email = [
                `To: ${to}`,
                cc ? `Cc: ${cc}` : '',
                bcc ? `Bcc: ${bcc}` : '',
                `Subject: ${subject}`,
                'Content-Type: text/plain; charset=utf-8',
                '',
                body
            ].filter(line => line !== '').join('\n');

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
}

