#!/usr/bin/env node

const { spawn } = require('child_process');
const http = require('http');
const path = require('path');

// Start the server
console.log('[TEST] Starting backend server...\n');

const serverProcess = spawn('npm', ['start'], {
  cwd: path.join(__dirname),
  stdio: 'pipe'
});

let serverOutput = '';
let isServerReady = false;

// Capture server output
serverProcess.stdout.on('data', (data) => {
  const output = data.toString();
  serverOutput += output;
  console.log('[SERVER] ' + output);
  
  if (output.includes('Server running on port')) {
    isServerReady = true;
    // Give it a moment for MongoDB to fully connect
    setTimeout(testEndpoint, 2000);
  }
});

serverProcess.stderr.on('data', (data) => {
  console.error('[SERVER ERROR] ' + data.toString());
});

// Test the endpoint after server is ready
const testEndpoint = () => {
  console.log('\n[TEST] Testing GET /api/products endpoint...\n');

  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/products',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  const req = http.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      console.log(`[RESPONSE] Status Code: ${res.statusCode}`);
      console.log(`[RESPONSE] Headers:`, res.headers);
      console.log(`[RESPONSE] Body:`);
      try {
        const parsedData = JSON.parse(data);
        console.log(JSON.stringify(parsedData, null, 2));
      } catch (e) {
        console.log(data);
      }

      console.log('\n[TEST] Endpoint test complete. Shutting down...\n');
      serverProcess.kill();
      process.exit(0);
    });
  });

  req.on('error', (error) => {
    console.error(`[ERROR] ${error.message}`);
    serverProcess.kill();
    process.exit(1);
  });

  req.end();
};

// Timeout after 30 seconds
setTimeout(() => {
  if (!isServerReady) {
    console.error('\n[TEST] Server did not start in time. Exiting...\n');
    serverProcess.kill();
    process.exit(1);
  }
}, 30000);
