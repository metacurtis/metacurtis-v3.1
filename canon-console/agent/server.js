import express from 'express';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import chalk from 'chalk';

class CanonConsoleServer {
  constructor() {
    this.app = express();
    this.server = createServer(this.app);
    this.wss = new WebSocketServer({ server: this.server });
    this.clients = new Set();
    this.incidents = new Map();
    this.stats = {
      totalReceived: 0,
      duplicates: 0,
      fixed: 0
    };
    
    this.setupMiddleware();
    this.setupWebSocket();
    this.setupRoutes();
  }
  
  setupMiddleware() {
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Headers', 'Content-Type');
      next();
    });
  }
  
  setupWebSocket() {
    this.wss.on('connection', (ws) => {
      console.log(chalk.green('✅ Client connected'));
      this.clients.add(ws);
      
      ws.on('message', (data) => {
        try {
          const msg = JSON.parse(data);
          this.handleMessage(msg, ws);
        } catch (err) {
          console.error(chalk.red('Invalid message'));
        }
      });
      
      ws.on('close', () => {
        this.clients.delete(ws);
        console.log(chalk.yellow('Client disconnected'));
      });
    });
  }
  
  setupRoutes() {
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'ok',
        clients: this.clients.size,
        incidents: this.incidents.size
      });
    });
  }
  
  handleMessage(msg, ws) {
    console.log(chalk.blue(`Message: ${msg.type}`));
    if (msg.type === 'incident') {
      this.incidents.set(msg.data.fingerprint, msg.data);
      this.stats.totalReceived++;
    }
  }
  
  start(port = 6998) {
    this.server.listen(port, () => {
      console.log(chalk.green(`
╔════════════════════════════════════════╗
║      Canon Console Server Started      ║
╠════════════════════════════════════════╣
║  HTTP:  http://localhost:${port}         ║
║  WS:    ws://localhost:${port}           ║
╚════════════════════════════════════════╝
      `));
    });
  }
}

const server = new CanonConsoleServer();
server.start(6998);
