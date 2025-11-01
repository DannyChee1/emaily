/**
 * SMS Server for Emaily
 * Receives SMS via Twilio webhook and processes with AI agent
 */

import express from 'express';
import twilio from 'twilio';
import dotenv from 'dotenv';
import { FunctionCallingAgent } from './services/ai/functionCallingAgent';
import { encrypt } from './utils/encryption';
import type { User, EmailAccount } from './types';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.urlencoded({ extended: false })); // Twilio sends form data
app.use(express.json());

// In-memory session storage (for single user testing)
const conversationHistory = new Map<string, any[]>();
const pendingConfirmations = new Map<string, any>();

// Your hardcoded user (replace with your actual tokens)
const mockUser: User = {
    id: 'local-user-1',
    phone_number: process.env.YOUR_PHONE_NUMBER || '+1234567890', // Your actual phone
    created_at: new Date(),
    subscription_tier: 'free'
};

const mockEmailAccount: EmailAccount = {
    id: 'local-email-1',
    user_id: 'local-user-1',
    email_address: process.env.GMAIL_ADDRESS || 'officialjoebrabs@gmail.com',
    provider: 'gmail',
    encrypted_access_token: encrypt(process.env.TEST_ACCESS_TOKEN || ''),
    encrypted_refresh_token: encrypt(process.env.TEST_REFRESH_TOKEN || ''),
    is_primary: true,
    connected_at: new Date()
};

// Health check endpoint
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Twilio SMS webhook endpoint
app.post('/webhooks/sms', async (req, res) => {
    try {
        console.log('\n* Received SMS webhook');
        
        const { From, Body } = req.body;
        console.log(`From: ${From}`);
        console.log(`Message: ${Body}`);

        // Verify Twilio signature (optional for local testing, required for production)
        if (process.env.TWILIO_AUTH_TOKEN && process.env.NODE_ENV === 'production') {
            const twilioSignature = req.headers['x-twilio-signature'] as string;
            const url = `${process.env.BASE_URL}/webhooks/sms`;
            
            const isValid = twilio.validateRequest(
                process.env.TWILIO_AUTH_TOKEN,
                twilioSignature,
                url,
                req.body
            );
            
            if (!isValid) {
                console.error('* Invalid Twilio signature');
                return res.status(403).send('Forbidden');
            }
        }

        // Load or create conversation history for this phone number
        let history = conversationHistory.get(From) || [];
        let savedConfirmations = pendingConfirmations.get(From);
        
        // Create agent instance
        const agent = new FunctionCallingAgent(mockUser, mockEmailAccount);
        
        // Restore conversation history
        if (history.length > 0) {
            agent.conversationHistory = history;
            console.log(`* Restored ${history.length} messages from history`);
        }

        // Restore pending confirmations
        if (savedConfirmations) {
            agent.pendingConfirmations = savedConfirmations;
            console.log(`* Restored ${savedConfirmations.size} pending confirmations`);
        }

        // Process the message
        console.log('* Processing with AI agent...');
        const response = await agent.processMessage(Body);
        console.log(`* Response: ${response.substring(0, 100)}...`);

        // Save updated conversation history
        conversationHistory.set(From, agent.conversationHistory);
        
        // Save updated pending confirmations
        pendingConfirmations.set(From, agent.pendingConfirmations);

        // Send SMS response
        const twiml = new twilio.twiml.MessagingResponse();
        
        // Split long messages (SMS limit is 160 chars, but Twilio handles 1600)
        if (response.length > 1600) {
            twiml.message(response.substring(0, 1597) + '...');
        } else {
            twiml.message(response);
        }

        res.type('text/xml');
        return res.send(twiml.toString());

    } catch (error) {
        console.error('* Error processing SMS:', error);
        
        const twiml = new twilio.twiml.MessagingResponse();
        twiml.message('Sorry, I encountered an error. Please try again.');
        
        res.type('text/xml');
        return res.send(twiml.toString());
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`\n* SMS Server running on port ${PORT}`);
    console.log(`* Webhook URL: http://localhost:${PORT}/webhooks/sms`);
    console.log(`\n* To test with Twilio:`);
    console.log(`   1. Run: npx localtunnel --port ${PORT}`);
    console.log(`   2. Copy the localtunnel URL`);
    console.log(`   3. Set Twilio webhook to: https://YOUR-URL.loca.lt/webhooks/sms`);
    console.log(`\n* Server ready to receive SMS!\n`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n* Shutting down server...');
    process.exit(0);
});

