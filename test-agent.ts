/**
 * Test script for the AI agent
 * Run this to test your agent locally without SMS
 * 
 * Usage: npm run test:agent
 */

import dotenv from 'dotenv';
import readline from 'readline';
import { AgentController } from './src/services/ai/agentController';
import { encrypt } from './src/utils/encryption';
import type { User, EmailAccount } from './src/types';

// Load environment variables
dotenv.config();

// Mock user and email account for testing
const mockUser: User = {
    id: 'test-user-1',
    phone_number: '+1234567890',
    created_at: new Date(),
    subscription_tier: 'free'
};

const mockEmailAccount: EmailAccount = {
    id: 'test-email-1',
    user_id: 'test-user-1',
    email_address: 'your-email@gmail.com', // Replace with your email
    provider: 'gmail',
    // You'll need to get these tokens from Gmail OAuth
    encrypted_access_token: encrypt(process.env.TEST_ACCESS_TOKEN || ''),
    encrypted_refresh_token: encrypt(process.env.TEST_REFRESH_TOKEN || ''),
    is_primary: true,
    connected_at: new Date()
};

async function main() {
    console.log('🤖 Emaily AI Agent - Test Mode\n');
    console.log('============================================');
    console.log('Testing the AI agent locally without SMS');
    console.log('Type your commands below (or "exit" to quit)');
    console.log('============================================\n');

    // Check for required env vars
    if (!process.env.OPENAI_API_KEY) {
        console.error('❌ Error: OPENAI_API_KEY not found in environment');
        console.log('Please add it to your .env file');
        process.exit(1);
    }

    if (!process.env.ENCRYPTION_KEY) {
        console.error('❌ Error: ENCRYPTION_KEY not found in environment');
        console.log('Please add it to your .env file (any 32+ character string)');
        process.exit(1);
    }

    // Initialize agent
    let agent: AgentController | { processMessage: (msg: string) => Promise<string> };
    try {
        agent = new AgentController(mockUser, mockEmailAccount);
        console.log('✅ Agent initialized successfully\n');
    } catch (error) {
        console.error('❌ Failed to initialize agent:', error instanceof Error ? error.message : error);
        console.log('\nNote: You need to set up Gmail OAuth tokens to test email operations.');
        console.log('For now, you can test the AI intent classification.\n');
        
        // Continue without email service for testing
        const { classifyIntent } = await import('./src/services/ai/intentClassifier');
        agent = {
            processMessage: async (message: string): Promise<string> => {
                const intent = await classifyIntent(message);
                return `Intent: ${intent.intent}\nConfidence: ${intent.confidence}\nEntities: ${JSON.stringify(intent.entities, null, 2)}`;
            }
        };
    }

    console.log('Sample commands to try:');
    console.log('  - "show me my emails"');
    console.log('  - "send email to john@company.com about the meeting tomorrow"');
    console.log('  - "find emails from Sarah"');
    console.log('  - "delete this email"');
    console.log('  - "help"\n');

    // Set up readline interface
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: 'You: '
    });

    rl.prompt();

    rl.on('line', async (input: string) => {
        const message = input.trim();

        if (!message) {
            rl.prompt();
            return;
        }

        if (message.toLowerCase() === 'exit' || message.toLowerCase() === 'quit') {
            console.log('\n👋 Goodbye!');
            rl.close();
            process.exit(0);
        }

        try {
            console.log('\n🤔 Processing...\n');
            const response = await agent.processMessage(message);
            console.log('Bot:', response);
            console.log('\n' + '─'.repeat(50) + '\n');
        } catch (error) {
            console.error('❌ Error:', error instanceof Error ? error.message : error);
            console.log('\n' + '─'.repeat(50) + '\n');
        }

        rl.prompt();
    });

    rl.on('close', () => {
        console.log('\n👋 Goodbye!');
        process.exit(0);
    });
}

main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});

