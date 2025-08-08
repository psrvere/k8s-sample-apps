import express, { Request, Response } from 'express';
import cors from 'cors';
import logger from './logger';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// CPU-intensive function for testing HPA
function cpuIntensiveTask(duration: number): number {
  const start = Date.now();
  let result = 0;
  
  while (Date.now() - start < duration) {
    result += Math.sqrt(Math.random() * 1000000);
  }
  
  return result;
}

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    pod: process.env.HOSTNAME || 'unknown'
  });
});

// CPU-intensive endpoint for testing HPA
app.get('/cpu-load', (req: Request, res: Response) => {
  const duration = parseInt(req.query.duration as string) || 1000; // Default 1 second
  const result = cpuIntensiveTask(duration);
  
  res.json({
    message: 'CPU-intensive task completed',
    duration: `${duration}ms`,
    result: result.toFixed(2),
    pod: process.env.HOSTNAME || 'unknown',
    timestamp: new Date().toISOString()
  });
});

// Endpoint to simulate different load levels
app.get('/load/:level', (req: Request, res: Response) => {
  const level = req.params.level;
  let duration = 1000; // Default 1 second
  
  switch (level) {
    case 'low':
      duration = 500;
      break;
    case 'medium':
      duration = 2000;
      break;
    case 'high':
      duration = 5000;
      break;
    case 'extreme':
      duration = 10000;
      break;
    default:
      duration = 1000;
  }
  
  const result = cpuIntensiveTask(duration);
  
  res.json({
    message: `Load test completed - ${level} intensity`,
    duration: `${duration}ms`,
    result: result.toFixed(2),
    pod: process.env.HOSTNAME || 'unknown',
    timestamp: new Date().toISOString()
  });
});

// Metrics endpoint for monitoring
app.get('/metrics', (req: Request, res: Response) => {
  const memUsage = process.memoryUsage();
  const cpuUsage = process.cpuUsage();
  
  res.json({
    memory: {
      rss: Math.round(memUsage.rss / 1024 / 1024), // MB
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
      external: Math.round(memUsage.external / 1024 / 1024) // MB
    },
    cpu: {
      user: cpuUsage.user,
      system: cpuUsage.system
    },
    uptime: process.uptime(),
    pod: process.env.HOSTNAME || 'unknown',
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Auto-scaling Test Application',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      cpuLoad: '/cpu-load?duration=1000',
      loadTest: '/load/{low|medium|high|extreme}',
      metrics: '/metrics'
    },
    pod: process.env.HOSTNAME || 'unknown',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  logger.info(`🚀 Auto-scaling app running on port ${PORT}`);
  logger.info(`📊 Pod: ${process.env.HOSTNAME || 'unknown'}`);
  logger.info(`🔗 Health check: http://localhost:${PORT}/health`);
  logger.info(`⚡ CPU load test: http://localhost:${PORT}/cpu-load`);
}); 