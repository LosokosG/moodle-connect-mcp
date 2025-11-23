#!/usr/bin/env node

/**
 * Local test script for Moodle MCP Server
 * This simulates MCP tool calls to verify the server works correctly
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const serverPath = join(__dirname, 'dist', 'index.js');

console.log('🚀 Starting Moodle MCP Server Test...\n');

const server = spawn('node', [serverPath], {
  stdio: ['pipe', 'pipe', 'inherit'],
  env: process.env
});

let buffer = '';

server.stdout.on('data', (data) => {
  buffer += data.toString();

  // Process complete JSON-RPC messages
  const lines = buffer.split('\n');
  buffer = lines.pop(); // Keep incomplete line in buffer

  for (const line of lines) {
    if (line.trim()) {
      try {
        const message = JSON.parse(line);
        console.log('📨 Received:', JSON.stringify(message, null, 2));
      } catch (e) {
        console.log('📝 Output:', line);
      }
    }
  }
});

server.on('error', (error) => {
  console.error('❌ Error starting server:', error);
  process.exit(1);
});

// Wait for server to be ready
setTimeout(() => {
  console.log('✅ Server started successfully!\n');
  console.log('📋 Testing MCP initialization...\n');

  // Send initialize request
  const initRequest = {
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: {
        name: 'test-client',
        version: '1.0.0'
      }
    }
  };

  server.stdin.write(JSON.stringify(initRequest) + '\n');

  // Request list of tools
  setTimeout(() => {
    console.log('\n📋 Requesting available tools...\n');
    const toolsRequest = {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/list',
      params: {}
    };

    server.stdin.write(JSON.stringify(toolsRequest) + '\n');

    // Test get_courses tool
    setTimeout(() => {
      console.log('\n📚 Testing get_courses tool...\n');
      const coursesRequest = {
        jsonrpc: '2.0',
        id: 3,
        method: 'tools/call',
        params: {
          name: 'get_courses',
          arguments: {}
        }
      };

      server.stdin.write(JSON.stringify(coursesRequest) + '\n');

      // Give it time to respond, then exit
      setTimeout(() => {
        console.log('\n✅ Test complete! If you see course data above, the server is working correctly.');
        console.log('\n💡 Next steps:');
        console.log('   1. If you see errors, check your MOODLE_URL and MOODLE_TOKEN in .env');
        console.log('   2. Verify web services are enabled on your Moodle site');
        console.log('   3. If successful, configure Claude Desktop using the README instructions');
        server.kill();
        process.exit(0);
      }, 3000);
    }, 1000);
  }, 1000);
}, 1000);

// Handle cleanup
process.on('SIGINT', () => {
  server.kill();
  process.exit(0);
});
