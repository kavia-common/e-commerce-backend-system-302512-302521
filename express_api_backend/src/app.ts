import cors from 'cors';
import express, { type NextFunction, type Request, type Response } from 'express';
import swaggerUi from 'swagger-ui-express';
const swaggerSpec = require('../swagger');

import { routes } from './routes';
import { errorHandler } from './middleware/errorHandler';

// Initialize express app
export const app = express();

app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

app.set('trust proxy', true);

app.use('/docs', swaggerUi.serve, (req: Request, res: Response, next: NextFunction) => {
  const host = req.get('host'); // may or may not include port
  let protocol = req.protocol; // http or https

  const actualPort = req.socket.localPort;
  const hasPort = host?.includes(':') ?? false;

  const needsPort =
    !hasPort &&
    ((protocol === 'http' && actualPort !== 80) || (protocol === 'https' && actualPort !== 443));
  const fullHost = needsPort ? `${host}:${actualPort}` : host;
  protocol = req.secure ? 'https' : protocol;

  const dynamicSpec = {
    ...swaggerSpec,
    servers: [
      {
        url: `${protocol}://${fullHost}`
      }
    ]
  };

  swaggerUi.setup(dynamicSpec)(req, res, next);
});

// Parse JSON request body
app.use(express.json());

// Serve OpenAPI at /openapi.json for PreviewManager integration
app.get('/openapi.json', (_req: Request, res: Response) => {
  res.json(swaggerSpec);
});

// Mount routes
app.use('/', routes);

// Centralized error handling middleware
app.use(errorHandler);
