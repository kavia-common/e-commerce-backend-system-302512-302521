import { app } from './app';
import { getEnv } from './config/env';

const { PORT, HOST } = getEnv();

const server = app.listen(PORT, HOST, () => {
  // eslint-disable-next-line no-console
  console.log(`Server running at http://${HOST}:${PORT}`);
});

/**
 * Prevent unhandled server startup errors from crashing the process with an
 * uncaught exception (which can cause container readiness to flap).
 *
 * In particular, EADDRINUSE can happen if an orchestrator retries start while
 * a previous instance is still running or shutting down.
 */
server.on('error', (err: NodeJS.ErrnoException) => {
  // eslint-disable-next-line no-console
  console.error('HTTP server failed to start:', err);

  if (err.code === 'EADDRINUSE') {
    // eslint-disable-next-line no-console
    console.error(`Port ${PORT} is already in use. Another process is already listening.`);
    // Exit with non-zero so supervisors can decide what to do, but do so cleanly.
    process.exit(1);
  }

  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  // eslint-disable-next-line no-console
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    // eslint-disable-next-line no-console
    console.log('HTTP server closed');
    process.exit(0);
  });
});
