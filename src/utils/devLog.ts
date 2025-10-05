export type LogCategory = 'SECURITY' | 'RPC' | 'AGENT' | 'CLI' | 'WORKFLOW' | 'ERROR';

interface LogEntry {
  timestamp: string;
  category: LogCategory;
  message: string;
  data?: any;
}

const sanitizeData = (data: any): any => {
  if (typeof data === 'string') {
    // Remove potential private keys, mnemonics, and sensitive data
    return data.replace(/0x[a-fA-F0-9]{64}/g, '0x[REDACTED]')
               .replace(/\b[a-z]+\s+[a-z]+\s+[a-z]+\s+[a-z]+\s+[a-z]+\s+[a-z]+\s+[a-z]+\s+[a-z]+\s+[a-z]+\s+[a-z]+\s+[a-z]+\s+[a-z]+\b/gi, '[MNEMONIC_REDACTED]');
  }

  if (typeof data === 'object' && data !== null) {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(data)) {
      if (key.toLowerCase().includes('private') ||
          key.toLowerCase().includes('secret') ||
          key.toLowerCase().includes('key') ||
          key.toLowerCase().includes('mnemonic')) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = sanitizeData(value);
      }
    }
    return sanitized;
  }

  return data;
};

export const devLog = {
  log: (category: LogCategory, message: string, data?: any) => {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      category,
      message,
      data: data ? sanitizeData(data) : undefined
    };

    // In production, only log essential information
    const isProduction = process.env.NODE_ENV === 'production';

    if (isProduction && category !== 'ERROR' && category !== 'SECURITY') {
      return;
    }

    console.log(`[${entry.timestamp}] [${category}] ${message}`, entry.data ? entry.data : '');
  },

  security: (message: string, data?: any) => devLog.log('SECURITY', message, data),
  rpc: (message: string, data?: any) => devLog.log('RPC', message, data),
  agent: (message: string, data?: any) => devLog.log('AGENT', message, data),
  cli: (message: string, data?: any) => devLog.log('CLI', message, data),
  workflow: (message: string, data?: any) => devLog.log('WORKFLOW', message, data),
  error: (message: string, data?: any) => devLog.log('ERROR', message, data)
};