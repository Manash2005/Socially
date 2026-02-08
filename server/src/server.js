import app from './app.js';
import { env } from './config/env.js';

const PORT = env.port;

const startServer = () => {
  try {
    app.listen(PORT, () => {
      console.log(`
🚀 Server is running!
----------------------------------
📡 URL: http://localhost:${PORT}
ENVIRONMENT: ${env.nodeEnv}
----------------------------------
      `);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
