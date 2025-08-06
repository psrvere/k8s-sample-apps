import express, { Request, Response } from 'express';
import { createClient, RedisClientType } from 'redis';
import bodyParser from 'body-parser';
import { GuestbookEntry, HealthResponse, GuestbookRequest, ApiResponse } from './types';
import { getHtmlTemplate } from './template';
import logger from './logger';

const app = express();
const PORT: string = process.env['PORT'] || '3000';
const REDIS_HOST: string = process.env['REDIS_HOST'] || 'redis-service';
const REDIS_PORT: string = process.env['REDIS_PORT'] || '6379';

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));

// Redis client
let redisClient: RedisClientType | null = null;
let redisConnected: boolean = false;

async function connectToRedis(): Promise<void> {
    try {
        redisClient = createClient({
            socket: {
                host: REDIS_HOST,
                port: parseInt(REDIS_PORT, 10)
            }
        });

        redisClient.on('error', (err: Error) => {
            logger.error('Redis Client Error', err);
            redisConnected = false;
        });

        redisClient.on('connect', () => {
            logger.info('Connected to Redis');
            redisConnected = true;
        });

        await redisClient.connect();
    } catch (error) {
        logger.error('Failed to connect to Redis', error as Error);
        redisConnected = false;
    }
}

// Initialize Redis connection
connectToRedis();

// Routes
app.get('/', (_req: Request, res: Response) => {
    logger.info('GET / - Serving guestbook page');
    res.send(getHtmlTemplate(redisConnected));
});

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
    logger.info('GET /health - Health check requested');
    const healthResponse: HealthResponse = {
        status: 'ok',
        redis: redisConnected,
        timestamp: new Date().toISOString()
    };
    res.json(healthResponse);
});

// Get all entries
app.get('/entries', async (_req: Request, res: Response) => {
    try {
        if (!redisConnected || !redisClient) {
            logger.warn('GET /entries - Redis not connected');
            return res.status(503).json({ error: 'Redis not connected' });
        }
        
        const entries = await redisClient.lRange('guestbook:entries', 0, -1);
        const parsedEntries: GuestbookEntry[] = entries.map((entry: string) => JSON.parse(entry));
        
        logger.info(`GET /entries - Retrieved ${parsedEntries.length} entries`);
        return res.json(parsedEntries);
    } catch (error) {
        logger.error('GET /entries - Failed to get entries', error as Error);
        return res.status(500).json({ error: 'Failed to get entries' });
    }
});

// Add new entry
app.post('/sign', async (req: Request, res: Response) => {
    try {
        if (!redisConnected || !redisClient) {
            logger.warn('POST /sign - Redis not connected');
            return res.status(503).json({ error: 'Redis not connected' });
        }
        
        const { name, message }: GuestbookRequest = req.body;
        
        if (!name || !message) {
            logger.warn('POST /sign - Missing required fields');
            return res.status(400).json({ error: 'Name and message are required' });
        }
        
        const entry: GuestbookEntry = {
            name: name.trim(),
            message: message.trim(),
            timestamp: new Date().toISOString()
        };
        
        // Add to Redis list (keep only last 100 entries)
        await redisClient.lPush('guestbook:entries', JSON.stringify(entry));
        await redisClient.lTrim('guestbook:entries', 0, 99);
        
        const response: ApiResponse<GuestbookEntry> = { 
            success: true, 
            data: entry 
        };
        
        logger.info(`POST /sign - Added new entry from ${entry.name}`);
        return res.json(response);
    } catch (error) {
        logger.error('POST /sign - Failed to add entry', error as Error);
        return res.status(500).json({ error: 'Failed to add entry' });
    }
});

// Start server
app.listen(parseInt(PORT, 10), () => {
    logger.info(`Guestbook frontend running on port ${PORT}`);
    logger.info(`Redis host: ${REDIS_HOST}:${REDIS_PORT}`);
}); 