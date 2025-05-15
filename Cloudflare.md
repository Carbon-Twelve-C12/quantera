# Quantera Platform Deployment Guide: Cloudflare

This guide provides detailed instructions for deploying the Quantera platform on Cloudflare's infrastructure, leveraging Cloudflare Pages, Workers, and other services for optimal performance, security, and scalability.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Cloudflare Account Setup](#cloudflare-account-setup)
3. [Frontend Deployment](#frontend-deployment)
4. [Backend Services Deployment](#backend-services-deployment)
5. [WebSocket Implementation](#websocket-implementation)
6. [Database and Storage Setup](#database-and-storage-setup)
7. [DNS Configuration](#dns-configuration)
8. [CI/CD Pipeline Setup](#cicd-pipeline-setup)
9. [Environment Configuration](#environment-configuration)
10. [Monitoring and Analytics](#monitoring-and-analytics)
11. [Security Best Practices](#security-best-practices)
12. [Troubleshooting](#troubleshooting)

## Prerequisites

Before starting the deployment process, ensure you have:

- Git repository with the Quantera platform code
- Node.js and npm installed
- Cloudflare account
- Domain name (optional but recommended)
- Wrangler CLI installed: `npm install -g wrangler`
- GitHub account (for CI/CD integration)

## Cloudflare Account Setup

1. **Create a Cloudflare account** at [https://dash.cloudflare.com/sign-up](https://dash.cloudflare.com/sign-up)

2. **Generate API tokens**:
   - Navigate to "My Profile" > "API Tokens"
   - Create a token with appropriate permissions:
     - Account.Cloudflare Pages: Edit
     - Account.Workers Scripts: Edit
     - Account.Workers Routes: Edit
     - Zone.DNS: Edit (if managing DNS)

3. **Authenticate Wrangler CLI**:
   ```bash
   wrangler login
   ```

## Frontend Deployment

### Manual Deployment

1. **Build the frontend application**:
   ```bash
   cd frontend
   npm install
   npm run build
   ```

2. **Deploy to Cloudflare Pages**:
   ```bash
   wrangler pages deploy build/
   ```

3. **Configure build settings** (optional - for customization):
   Create a `wrangler.toml` file in the frontend directory:
   ```toml
   name = "quantera-platform"
   compatibility_date = "2023-12-01"
   
   [site]
   bucket = "./build"
   ```

### GitHub Integration

1. **Connect repository to Cloudflare Pages**:
   - Go to Cloudflare Dashboard > Pages
   - Click "Create a project" > "Connect to Git"
   - Select your GitHub repository
   
2. **Configure build settings**:
   - Framework preset: React
   - Build command: `cd frontend && npm install && npm run build`
   - Build output directory: `frontend/build`
   - Environment variables: Add any required environment variables
   
3. **Configure production branch**:
   - Set your main branch (e.g., `main` or `master`)
   - Enable preview deployments for pull requests if desired

4. **Trigger initial build**:
   - Click "Save and Deploy"
   - Monitor the build process in the Cloudflare dashboard

## Backend Services Deployment

### Converting Services to Cloudflare Workers

1. **Create a directory structure** for each backend service:
   ```
   backend/
   ├── treasury-service/
   │   ├── src/
   │   ├── wrangler.toml
   │   └── package.json
   ├── ethereum-client/
   │   ├── src/
   │   ├── wrangler.toml
   │   └── package.json
   ```

2. **Configure worker for Treasury Service**:
   
   Create `treasury-service/wrangler.toml`:
   ```toml
   name = "quantera-treasury-service"
   main = "src/index.js"
   compatibility_date = "2023-12-01"
   
   [vars]
   ENVIRONMENT = "production"
   
   # Add other environment variables
   ```
   
3. **Configure worker for Ethereum Client**:
   
   Create `ethereum-client/wrangler.toml`:
   ```toml
   name = "quantera-ethereum-client"
   main = "src/index.js"
   compatibility_date = "2023-12-01"
   
   [vars]
   ETH_NODE_URL = "https://mainnet.infura.io/v3/YOUR_INFURA_KEY"
   # Add other environment variables
   ```

4. **Implement API routes** in each worker:
   
   Example `treasury-service/src/index.js`:
   ```javascript
   export default {
     async fetch(request, env, ctx) {
       const url = new URL(request.url);
       
       // Route handling
       if (url.pathname.startsWith('/api/treasury')) {
         return handleTreasuryRequest(request, env);
       }
       
       return new Response("Not found", { status: 404 });
     }
   };
   
   async function handleTreasuryRequest(request, env) {
     // Implement your treasury service logic here
     // ...
     
     return new Response(JSON.stringify({ success: true }), {
       headers: { 'Content-Type': 'application/json' }
     });
   }
   ```

5. **Deploy the workers**:
   ```bash
   cd backend/treasury-service
   wrangler deploy
   
   cd ../ethereum-client
   wrangler deploy
   ```

## WebSocket Implementation

### Setting up Durable Objects for WebSocket connections

1. **Create a Durable Object class** for WebSocket connections:

   Create `backend/websocket-service/src/websocket.js`:
   ```javascript
   export class WebSocketConnections {
     constructor(state, env) {
       this.state = state;
       this.env = env;
       this.sessions = new Map();
       this.topics = new Map();
     }
     
     async fetch(request) {
       // Handle WebSocket upgrade
       if (request.headers.get("Upgrade") !== "websocket") {
         return new Response("Expected WebSocket", { status: 400 });
       }
       
       // Create WebSocket pair
       const [client, server] = Object.values(new WebSocketPair());
       
       // Handle WebSocket connection
       await this.handleSession(server);
       
       // Return client WebSocket
       return new Response(null, {
         status: 101,
         webSocket: client
       });
     }
     
     async handleSession(webSocket) {
       // Set up event handlers
       webSocket.accept();
       
       // Generate a unique ID for this session
       const sessionId = crypto.randomUUID();
       this.sessions.set(sessionId, webSocket);
       
       webSocket.addEventListener("message", async msg => {
         try {
           const data = JSON.parse(msg.data);
           
           // Handle subscription requests
           if (data.topic) {
             if (!this.topics.has(data.topic)) {
               this.topics.set(data.topic, new Set());
             }
             this.topics.get(data.topic).add(sessionId);
           }
           
           // Handle other message types...
         } catch (err) {
           webSocket.send(JSON.stringify({ error: "Invalid message format" }));
         }
       });
       
       webSocket.addEventListener("close", () => {
         // Clean up when the connection is closed
         this.sessions.delete(sessionId);
         
         // Remove from all topics
         for (const [topic, subscribers] of this.topics.entries()) {
           subscribers.delete(sessionId);
           if (subscribers.size === 0) {
             this.topics.delete(topic);
           }
         }
       });
     }
     
     // Method to broadcast a message to all subscribers of a topic
     async broadcast(topic, message) {
       if (!this.topics.has(topic)) return;
       
       const subscribers = this.topics.get(topic);
       for (const sessionId of subscribers) {
         const session = this.sessions.get(sessionId);
         if (session && session.readyState === WebSocket.READY_STATE_OPEN) {
           session.send(JSON.stringify(message));
         }
       }
     }
   }
   ```

2. **Create the worker for WebSocket handling**:

   Create `backend/websocket-service/src/index.js`:
   ```javascript
   import { WebSocketConnections } from './websocket';
   
   export { WebSocketConnections };
   
   export default {
     async fetch(request, env, ctx) {
       try {
         // Create a new connection ID or use the existing one
         const url = new URL(request.url);
         let id = url.pathname.slice(1);
         
         if (!id) {
           id = crypto.randomUUID();
           return Response.redirect(`${url.origin}/${id}`, 302);
         }
         
         // Get the Durable Object stub for this connection ID
         const connectionObj = env.WEBSOCKET_CONNECTIONS.get(
           env.WEBSOCKET_CONNECTIONS.idFromName(id)
         );
         
         // Forward the request to the Durable Object
         return connectionObj.fetch(request);
       } catch (err) {
         return new Response(`Error: ${err.message}`, { status: 500 });
       }
     }
   };
   ```

3. **Configure the Durable Object** in `backend/websocket-service/wrangler.toml`:
   ```toml
   name = "quantera-websocket-service"
   main = "src/index.js"
   compatibility_date = "2023-12-01"
   
   [durable_objects]
   bindings = [
     { name = "WEBSOCKET_CONNECTIONS", class_name = "WebSocketConnections" }
   ]
   
   [[migrations]]
   tag = "v1"
   new_classes = ["WebSocketConnections"]
   ```

4. **Deploy the WebSocket service**:
   ```bash
   cd backend/websocket-service
   wrangler deploy
   ```

## Database and Storage Setup

### Cloudflare D1 (SQL Database)

1. **Create a D1 database**:
   ```bash
   wrangler d1 create quantera-database
   ```

2. **Configure D1 in your worker** by adding to `wrangler.toml`:
   ```toml
   [[d1_databases]]
   binding = "DB"
   database_name = "quantera-database"
   database_id = "your-database-id"
   ```

3. **Create database schema**:
   Create a `schema.sql` file:
   ```sql
   CREATE TABLE smart_accounts (
     id TEXT PRIMARY KEY,
     owner TEXT NOT NULL,
     name TEXT NOT NULL,
     created_at INTEGER NOT NULL,
     template_id TEXT NOT NULL,
     status TEXT NOT NULL,
     balance TEXT NOT NULL
   );
   
   CREATE TABLE smart_account_operations (
     operation_id TEXT PRIMARY KEY,
     account_id TEXT NOT NULL,
     operation_type TEXT NOT NULL,
     timestamp INTEGER NOT NULL,
     executed_by TEXT NOT NULL,
     status TEXT NOT NULL,
     gas_used TEXT,
     transaction_hash TEXT,
     error_message TEXT,
     FOREIGN KEY (account_id) REFERENCES smart_accounts(id)
   );
   
   -- Add other tables as needed
   ```

4. **Apply the schema**:
   ```bash
   wrangler d1 execute quantera-database --file=schema.sql
   ```

### Cloudflare R2 (Object Storage)

1. **Create an R2 bucket**:
   ```bash
   wrangler r2 bucket create quantera-assets
   ```

2. **Configure R2 in your worker** by adding to `wrangler.toml`:
   ```toml
   [[r2_buckets]]
   binding = "ASSETS"
   bucket_name = "quantera-assets"
   ```

3. **Use R2 in your worker**:
   ```javascript
   // Example: Storing a file in R2
   async function handleAssetUpload(request, env) {
     const formData = await request.formData();
     const file = formData.get('file');
     
     if (!file) {
       return new Response("No file uploaded", { status: 400 });
     }
     
     const fileName = `assets/${Date.now()}_${file.name}`;
     await env.ASSETS.put(fileName, file.stream());
     
     return new Response(JSON.stringify({ 
       success: true, 
       fileName 
     }), {
       headers: { 'Content-Type': 'application/json' }
     });
   }
   ```

## DNS Configuration

1. **Add your domain to Cloudflare**:
   - Go to Cloudflare Dashboard > Websites
   - Click "Add a Site" and follow the instructions
   - Update your domain's nameservers with your registrar

2. **Configure custom domain for Pages**:
   - Go to Pages project > Settings > Custom domains
   - Click "Set up a custom domain"
   - Enter your domain (e.g., `app.quantera.io`)
   - Follow the verification process

3. **Configure custom domains for Workers**:
   - Go to Workers & Pages > your worker > Triggers
   - Click "Add custom domain"
   - Enter subdomain (e.g., `api.quantera.io`)

4. **Set up API routes**:
   - Go to Workers Routes
   - Add patterns for each service:
     - `api.quantera.io/treasury/*` → `quantera-treasury-service`
     - `api.quantera.io/ethereum/*` → `quantera-ethereum-client`
     - `ws.quantera.io/*` → `quantera-websocket-service`

## CI/CD Pipeline Setup

### GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy Quantera Platform

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Frontend Tests
        run: |
          cd frontend
          npm ci
          npm test
          
      - name: Smart Contract Tests
        run: |
          cd contracts
          npm ci
          npm test
  
  deploy-frontend:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install Dependencies
        run: |
          cd frontend
          npm ci
          
      - name: Build
        run: |
          cd frontend
          npm run build
          
      - name: Deploy to Cloudflare Pages
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: pages deploy frontend/build --project-name=quantera-platform
  
  deploy-backend:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Deploy Treasury Service
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          workingDirectory: 'backend/treasury-service'
          
      - name: Deploy Ethereum Client
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          workingDirectory: 'backend/ethereum-client'
          
      - name: Deploy WebSocket Service
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          workingDirectory: 'backend/websocket-service'
```

### GitHub Secrets Configuration

1. In your GitHub repository:
   - Go to Settings > Secrets and variables > Actions
   - Add the following secrets:
     - `CLOUDFLARE_API_TOKEN`: Your Cloudflare API token
     - `CLOUDFLARE_ACCOUNT_ID`: Your Cloudflare account ID

## Environment Configuration

### Environment Variables

1. **Define environment variables in Cloudflare**:
   - Go to Workers & Pages > your worker > Settings > Variables
   - Add environment variables:
     - `ETH_NODE_URL`: Ethereum node URL
     - `PRIVATE_KEY`: Private key for transaction signing (use encrypted variables)
     - `CONTRACT_ADDRESS`: Smart contract addresses
     - `ENVIRONMENT`: `production` or `development`

2. **Access environment variables** in your workers:
   ```javascript
   export default {
     async fetch(request, env, ctx) {
       // Access environment variables
       const ethNodeUrl = env.ETH_NODE_URL;
       const environment = env.ENVIRONMENT;
       
       // Use them in your code
       // ...
     }
   };
   ```

### Staging vs Production

1. **Create separate environments**:
   - Configure separate projects for staging and production
   - Use different branches for deployment:
     - `main` → Production
     - `develop` → Staging

2. **Configure environment-specific settings** in `wrangler.toml`:
   ```toml
   [env.production]
   name = "quantera-production"
   vars = { ENVIRONMENT = "production" }
   
   [env.staging]
   name = "quantera-staging"
   vars = { ENVIRONMENT = "staging" }
   ```

3. **Deploy to specific environment**:
   ```bash
   wrangler deploy --env production
   # or
   wrangler deploy --env staging
   ```

## Monitoring and Analytics

1. **Set up Cloudflare Analytics**:
   - Go to Dashboard > Analytics
   - View traffic, performance, and security metrics

2. **Implement custom logging** in your workers:
   ```javascript
   export default {
     async fetch(request, env, ctx) {
       // Log important events
       console.log(`Request to: ${request.url}`);
       
       try {
         // Your worker logic
         return new Response("Success");
       } catch (error) {
         // Log errors
         console.error(`Error: ${error.message}`);
         return new Response("Error", { status: 500 });
       }
     }
   };
   ```

3. **Configure Logpush** (optional):
   - Go to Analytics > Logs
   - Click "Connect a service"
   - Choose a destination (e.g., Google Cloud Storage, AWS S3)
   - Configure log fields and frequency

## Security Best Practices

1. **Use Workers Environment Variables** for sensitive data
   - Never hardcode API keys, private keys, or secrets

2. **Implement proper CORS headers**:
   ```javascript
   const corsHeaders = {
     "Access-Control-Allow-Origin": "https://app.quantera.io",
     "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
     "Access-Control-Allow-Headers": "Content-Type, Authorization"
   };
   
   function handleOptions(request) {
     return new Response(null, {
       headers: corsHeaders
     });
   }
   
   export default {
     async fetch(request, env, ctx) {
       // Handle CORS preflight requests
       if (request.method === "OPTIONS") {
         return handleOptions(request);
       }
       
       // Add CORS headers to all responses
       const response = await handleRequest(request, env);
       Object.keys(corsHeaders).forEach(key => {
         response.headers.set(key, corsHeaders[key]);
       });
       
       return response;
     }
   };
   ```

3. **Implement rate limiting** for API endpoints:
   ```javascript
   const RATE_LIMIT = 100; // requests per minute
   
   export default {
     async fetch(request, env, ctx) {
       const clientIp = request.headers.get("CF-Connecting-IP");
       
       // Check rate limit using Cloudflare's Cache API
       const cacheKey = `ratelimit:${clientIp}`;
       let count = await env.CACHE.get(cacheKey);
       count = count ? parseInt(count) : 0;
       
       if (count >= RATE_LIMIT) {
         return new Response("Rate limit exceeded", { status: 429 });
       }
       
       // Increment count
       await env.CACHE.put(cacheKey, count + 1, { expirationTtl: 60 });
       
       // Process the request
       return handleRequest(request, env);
     }
   };
   ```

4. **Use Signed Exchanges** for WebSocket connections:
   - Implement token-based authentication
   - Verify user identity before establishing WebSocket connections

5. **Implement Content Security Policy** for frontend:
   ```javascript
   // Add CSP headers to your Pages
   const cspHeaders = {
     "Content-Security-Policy": "default-src 'self'; script-src 'self'; connect-src 'self' wss://ws.quantera.io api.quantera.io;"
   };
   ```

## Troubleshooting

### Common Issues and Solutions

1. **Deployment Failures**
   - Check Cloudflare deployment logs
   - Verify API token permissions
   - Check for syntax errors in wrangler.toml

2. **CORS Issues**
   - Verify CORS headers in worker responses
   - Ensure allowed origins match your frontend domain

3. **WebSocket Connection Problems**
   - Check browser console for connection errors
   - Verify WebSocket URL (ws:// vs wss://)
   - Check Durable Object logs

4. **Database Connection Issues**
   - Verify database binding in wrangler.toml
   - Check for D1 quota limits
   - Test database connection with simple query

5. **Worker Execution Errors**
   - Check error logs in Cloudflare dashboard
   - Implement proper error handling in worker code
   - Test with minimal example to isolate issues

### Debugging Tips

1. **Use console.log** for debugging Workers:
   ```javascript
   console.log("Debug info:", someValue);
   ```

2. **Test locally** before deployment:
   ```bash
   wrangler dev
   ```

3. **Use Wrangler tail** to view logs in real-time:
   ```bash
   wrangler tail
   ```

4. **Check request/response with fetch API** in browser console:
   ```javascript
   fetch('https://api.quantera.io/treasury/balance')
     .then(response => response.json())
     .then(data => console.log(data))
     .catch(error => console.error('Error:', error));
   ```

---

## Conclusion

By following this guide, you've deployed the Quantera platform on Cloudflare's infrastructure, leveraging Cloudflare Pages for the frontend, Workers for backend services, Durable Objects for WebSocket connections, and D1/R2 for data storage.

This architecture provides a secure, scalable, and high-performance foundation for your blockchain-based application, with global distribution, DDoS protection, and integrated CI/CD pipelines.

For further assistance or advanced configuration, refer to:
- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [Workers Documentation](https://developers.cloudflare.com/workers/)
- [Durable Objects Documentation](https://developers.cloudflare.com/workers/learning/using-durable-objects/)
- [D1 Database Documentation](https://developers.cloudflare.com/d1/)
- [R2 Storage Documentation](https://developers.cloudflare.com/r2/) 