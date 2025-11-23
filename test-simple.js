#!/usr/bin/env node

/**
 * Simple test to verify Moodle API connectivity
 */

import dotenv from 'dotenv';
import { MoodleClient } from './dist/moodle-client.js';

dotenv.config();

const MOODLE_URL = process.env.MOODLE_URL;
const MOODLE_TOKEN = process.env.MOODLE_TOKEN;

console.log('🔍 Testing Moodle Connection...\n');

if (!MOODLE_URL || !MOODLE_TOKEN) {
  console.error('❌ Error: MOODLE_URL and MOODLE_TOKEN must be set in .env file');
  console.error('\nPlease:');
  console.error('  1. Copy .env.example to .env');
  console.error('  2. Add your Moodle URL and token');
  console.error('  3. Run this test again\n');
  process.exit(1);
}

console.log(`📍 Moodle URL: ${MOODLE_URL}`);
console.log(`🔑 Token: ${MOODLE_TOKEN.substring(0, 10)}...`);
console.log('');

const client = new MoodleClient({
  baseUrl: MOODLE_URL,
  token: MOODLE_TOKEN
});

async function runTests() {
  try {
    // Test 1: Get site info
    console.log('1️⃣  Testing connection and getting site info...');
    const siteInfo = await client.getSiteInfo();
    console.log('✅ Connected successfully!');
    console.log(`   Site: ${siteInfo.sitename}`);
    console.log(`   User: ${siteInfo.fullname} (${siteInfo.username})`);
    console.log('');

    // Test 2: Get courses
    console.log('2️⃣  Getting your enrolled courses...');
    const courses = await client.getCourses();
    console.log(`✅ Found ${courses.length} courses:`);
    courses.slice(0, 5).forEach(course => {
      console.log(`   - ${course.fullname} (ID: ${course.id})`);
    });
    if (courses.length > 5) {
      console.log(`   ... and ${courses.length - 5} more`);
    }
    console.log('');

    // Test 3: Get upcoming assignments
    console.log('3️⃣  Getting upcoming assignments (next 30 days)...');
    const assignments = await client.getUpcomingAssignments(30);
    console.log(`✅ Found ${assignments.length} upcoming assignments:`);
    assignments.slice(0, 5).forEach(assignment => {
      const dueDate = new Date(assignment.duedate * 1000);
      console.log(`   - ${assignment.name}`);
      console.log(`     Due: ${dueDate.toLocaleDateString()}`);
    });
    if (assignments.length > 5) {
      console.log(`   ... and ${assignments.length - 5} more`);
    }
    console.log('');

    // Test 4: Get upcoming events
    console.log('4️⃣  Getting upcoming calendar events (next 30 days)...');
    const events = await client.getUpcomingEvents(30);
    console.log(`✅ Found ${events.length} upcoming events:`);
    events.slice(0, 5).forEach(event => {
      const eventDate = new Date(event.timestart * 1000);
      console.log(`   - ${event.name}`);
      console.log(`     Date: ${eventDate.toLocaleDateString()}`);
    });
    if (events.length > 5) {
      console.log(`   ... and ${events.length - 5} more`);
    }
    console.log('');

    console.log('🎉 All tests passed! Your Moodle MCP server is ready to use.');
    console.log('');
    console.log('📝 Next steps:');
    console.log('   1. Configure Claude Desktop (see README.md)');
    console.log('   2. Restart Claude Desktop');
    console.log('   3. Start asking Claude about your courses and deadlines!');
    console.log('');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('');
    console.error('🔧 Troubleshooting:');
    console.error('   1. Verify MOODLE_URL is correct (should include https://)');
    console.error('   2. Check that MOODLE_TOKEN is valid');
    console.error('   3. Ensure web services are enabled on your Moodle site');
    console.error('   4. Contact your Moodle administrator if problems persist');
    console.error('');
    process.exit(1);
  }
}

runTests();
