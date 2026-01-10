import { Client } from 'ssh2';

export interface SSHCredentials {
  host: string;
  port?: number;
  username: string;
  password?: string;
  privateKey?: string;
}

export interface CommandResult {
  stdout: string;
  stderr: string;
  code: number | null;
}

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function executeCommand(
  credentials: SSHCredentials,
  command: string
): Promise<CommandResult> {
  let lastError: any;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await new Promise<CommandResult>((resolve, reject) => {
        const conn = new Client();
        
        conn.on('ready', () => {
          conn.exec(command, (err, stream) => {
            if (err) {
              conn.end();
              return reject(err);
            }
            
            let stdout = '';
            let stderr = '';
            
            stream.on('close', (code: any, signal: any) => {
              conn.end();
              resolve({ stdout, stderr, code: typeof code === 'number' ? code : null });
            }).on('data', (data: any) => {
              stdout += data.toString();
            }).stderr.on('data', (data: any) => {
              stderr += data.toString();
            });
          });
        }).on('error', (err) => {
          // Reject immediately for invalid auth, otherwise let outer loop handle retry
          if ((err as any).level === 'client-authentication') {
             // Treat auth errors as fatal, no retry
             (err as any).isFatal = true;
          }
          reject(err);
        }).connect({
          host: credentials.host,
          port: credentials.port || 22,
          username: credentials.username,
          password: credentials.password,
          privateKey: credentials.privateKey,
          // Add timeouts
          readyTimeout: 10000,
          keepaliveInterval: 0 
        });
      });
    } catch (error) {
      lastError = error;
      
      // Check if fatal error (like auth failure)
      if ((error as any).isFatal) {
        throw error;
      }

      console.warn(`SSH Attempt ${attempt} failed: ${(error as Error).message}`);

      if (attempt < MAX_RETRIES) {
        await sleep(RETRY_DELAY * attempt); // Exponential-ish backoff
        continue;
      }
    }
  }

  throw lastError || new Error('SSH command failed after retries');
}
