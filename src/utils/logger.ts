/**
 * Simple logger utility
 */

enum LogLevel {
    ERROR = 0,
    WARN = 1,
    INFO = 2,
    DEBUG = 3
}

const LOG_LEVELS: Record<string, LogLevel> = {
    ERROR: LogLevel.ERROR,
    WARN: LogLevel.WARN,
    INFO: LogLevel.INFO,
    DEBUG: LogLevel.DEBUG
};

const CURRENT_LEVEL: LogLevel = LOG_LEVELS[process.env.LOG_LEVEL?.toUpperCase() || 'INFO'] ?? LogLevel.INFO;

function formatMessage(level: string, message: string, data: any = null): string {
    const timestamp = new Date().toISOString();
    const dataStr = data ? ' ' + JSON.stringify(data) : '';
    return `[${timestamp}] ${level}: ${message}${dataStr}`;
}

export function error(message: string, data: any = null): void {
    if (CURRENT_LEVEL >= LogLevel.ERROR) {
        console.error(formatMessage('ERROR', message, data));
    }
}

export function warn(message: string, data: any = null): void {
    if (CURRENT_LEVEL >= LogLevel.WARN) {
        console.warn(formatMessage('WARN', message, data));
    }
}

export function info(message: string, data: any = null): void {
    if (CURRENT_LEVEL >= LogLevel.INFO) {
        console.log(formatMessage('INFO', message, data));
    }
}

export function debug(message: string, data: any = null): void {
    if (CURRENT_LEVEL >= LogLevel.DEBUG) {
        console.log(formatMessage('DEBUG', message, data));
    }
}

export default {
    error,
    warn,
    info,
    debug
};

