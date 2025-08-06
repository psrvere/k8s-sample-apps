// Guestbook entry type
export interface GuestbookEntry {
  name: string;
  message: string;
  timestamp: string;
}

// Health check response type
export interface HealthResponse {
  status: 'ok' | 'error';
  redis: boolean;
  timestamp: string;
}

// API response types
export interface ApiResponse<T = any> {
  success?: boolean;
  error?: string;
  data?: T;
}

// Redis client interface
export interface RedisClient {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  lPush(key: string, value: string): Promise<number>;
  lRange(key: string, start: number, stop: number): Promise<string[]>;
  lTrim(key: string, start: number, stop: number): Promise<'OK'>;
  on(event: 'connect', listener: () => void): void;
  on(event: 'error', listener: (error: Error) => void): void;
}

// Express request with body
export interface GuestbookRequest {
  name: string;
  message: string;
}

// Environment variables interface
export interface Environment {
  PORT: string;
  REDIS_HOST: string;
  REDIS_PORT: string;
} 