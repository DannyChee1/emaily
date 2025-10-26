/**
 * Tool definitions for AI function calling
 * These define what actions the AI agent can take
 */

export const EMAIL_TOOLS = [
    {
        type: "function" as const,
        function: {
            name: "search_emails",
            description: "Search for emails using Gmail search syntax. Returns email IDs, subjects, and snippets. Use this to find emails matching criteria before reading or acting on them.",
            parameters: {
                type: "object",
                properties: {
                    query: {
                        type: "string",
                        description: "Gmail search query. Examples: 'from:john@example.com', 'subject:meeting', 'is:unread', 'in:inbox', 'after:2024/01/01'"
                    },
                    max_results: {
                        type: "number",
                        description: "Maximum number of emails to return",
                        default: 10
                    }
                },
                required: ["query"]
            }
        }
    },
    {
        type: "function" as const,
        function: {
            name: "read_email",
            description: "Read the full content of a specific email by ID. Use this to get complete email details including body, attachments info, etc.",
            parameters: {
                type: "object",
                properties: {
                    email_id: {
                        type: "string",
                        description: "Email ID from search results"
                    }
                },
                required: ["email_id"]
            }
        }
    },
    {
        type: "function" as const,
        function: {
            name: "send_email",
            description: "Send a new email. REQUIRES USER CONFIRMATION. Can CC/BCC recipients. Returns confirmation ID that user must approve.",
            parameters: {
                type: "object",
                properties: {
                    to: {
                        type: "string",
                        description: "Recipient email address"
                    },
                    subject: {
                        type: "string",
                        description: "Email subject line"
                    },
                    body: {
                        type: "string",
                        description: "Email body content"
                    },
                    cc: {
                        type: "string",
                        description: "CC recipients (comma-separated)"
                    },
                    bcc: {
                        type: "string",
                        description: "BCC recipients (comma-separated)"
                    }
                },
                required: ["to", "subject", "body"]
            }
        }
    },
    {
        type: "function" as const,
        function: {
            name: "reply_to_email",
            description: "Reply to a specific email thread. REQUIRES USER CONFIRMATION. Maintains thread continuity.",
            parameters: {
                type: "object",
                properties: {
                    email_id: {
                        type: "string",
                        description: "ID of email to reply to"
                    },
                    reply_body: {
                        type: "string",
                        description: "Reply message content"
                    },
                    cc: {
                        type: "string",
                        description: "Additional CC recipients (comma-separated)"
                    }
                },
                required: ["email_id", "reply_body"]
            }
        }
    },
    {
        type: "function" as const,
        function: {
            name: "batch_reply_emails",
            description: "Reply to multiple emails with the same message. REQUIRES USER CONFIRMATION. Use when user wants to reply to multiple emails with identical content.",
            parameters: {
                type: "object",
                properties: {
                    email_ids: {
                        type: "array",
                        items: { type: "string" },
                        description: "Array of email IDs to reply to"
                    },
                    reply_body: {
                        type: "string",
                        description: "Reply message (same for all)"
                    }
                },
                required: ["email_ids", "reply_body"]
            }
        }
    },
    {
        type: "function" as const,
        function: {
            name: "delete_emails",
            description: "Move emails to trash. REQUIRES USER CONFIRMATION. Can delete multiple emails at once.",
            parameters: {
                type: "object",
                properties: {
                    email_ids: {
                        type: "array",
                        items: { type: "string" },
                        description: "Array of email IDs to delete"
                    }
                },
                required: ["email_ids"]
            }
        }
    },
    {
        type: "function" as const,
        function: {
            name: "archive_emails",
            description: "Archive emails (remove from inbox, keep in All Mail). Can archive multiple at once.",
            parameters: {
                type: "object",
                properties: {
                    email_ids: {
                        type: "array",
                        items: { type: "string" },
                        description: "Array of email IDs to archive"
                    }
                },
                required: ["email_ids"]
            }
        }
    },
    {
        type: "function" as const,
        function: {
            name: "label_emails",
            description: "Apply labels to emails. Creates label if it doesn't exist. Can label multiple emails at once.",
            parameters: {
                type: "object",
                properties: {
                    email_ids: {
                        type: "array",
                        items: { type: "string" },
                        description: "Array of email IDs to label"
                    },
                    label_name: {
                        type: "string",
                        description: "Label name (will be created if doesn't exist)"
                    }
                },
                required: ["email_ids", "label_name"]
            }
        }
    },
    {
        type: "function" as const,
        function: {
            name: "star_emails",
            description: "Star (mark as important) emails. Can star multiple at once.",
            parameters: {
                type: "object",
                properties: {
                    email_ids: {
                        type: "array",
                        items: { type: "string" },
                        description: "Array of email IDs to star"
                    }
                },
                required: ["email_ids"]
            }
        }
    },
    {
        type: "function" as const,
        function: {
            name: "mark_as_read",
            description: "Mark emails as read. Can mark multiple at once.",
            parameters: {
                type: "object",
                properties: {
                    email_ids: {
                        type: "array",
                        items: { type: "string" },
                        description: "Array of email IDs to mark as read"
                    }
                },
                required: ["email_ids"]
            }
        }
    },
    {
        type: "function" as const,
        function: {
            name: "create_draft",
            description: "Create an email draft for later editing/sending. Does NOT send immediately.",
            parameters: {
                type: "object",
                properties: {
                    to: {
                        type: "string",
                        description: "Recipient email address"
                    },
                    subject: {
                        type: "string",
                        description: "Email subject"
                    },
                    body: {
                        type: "string",
                        description: "Email body"
                    }
                },
                required: ["to", "body"]
            }
        }
    }
];

export type ToolName = 
    | "search_emails"
    | "read_email"
    | "send_email"
    | "reply_to_email"
    | "batch_reply_emails"
    | "delete_emails"
    | "archive_emails"
    | "label_emails"
    | "star_emails"
    | "mark_as_read"
    | "create_draft";

