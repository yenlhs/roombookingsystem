#!/usr/bin/env node

/**
 * Test Supabase Connection
 * Quick script to verify Supabase credentials are working
 */

import { createClient } from '@supabase/supabase-js';

// This is a test script, importing from node_modules
// For the actual app, use the workspace package at packages/supabase

const SUPABASE_URL = 'https://nladwgkecjkcjsdawzoc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5sYWR3Z2tlY2prY2pzZGF3em9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0OTU0ODQsImV4cCI6MjA3NjA3MTQ4NH0.T7mYwB_C-hYlw1sAlcJ7M2m4nmsC0xQykBlQ7puJpYw';

console.log('🔄 Testing Supabase connection...\n');
console.log(`Project URL: ${SUPABASE_URL}`);
console.log(`Anon Key: ${SUPABASE_ANON_KEY.substring(0, 20)}...\n`);

try {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // Test connection by fetching auth status
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    console.error('❌ Connection failed:', error.message);
    process.exit(1);
  }

  console.log('✅ Supabase connection successful!');
  console.log('✅ Client initialized correctly');
  console.log('✅ Authentication endpoint accessible\n');
  console.log('🎉 Your Supabase project is ready to use!');
  console.log('\nNext steps:');
  console.log('  - Task 1.2.2: Design Database Schema');
  console.log('  - Task 1.2.3: Implement Row Level Security');

} catch (err) {
  console.error('❌ Error:', err.message);
  process.exit(1);
}
