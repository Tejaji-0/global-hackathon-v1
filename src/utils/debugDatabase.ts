// Simple debug script to test Supabase connection and basic operations
import { supabase } from '../services/supabase';

export const debugDatabaseConnection = async () => {
  console.log('🔍 Testing Supabase connection...');
  
  try {
    // Test 1: Basic connection test
    console.log('1. Testing basic connection...');
    const { data: testData, error: testError } = await supabase
      .from('links')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.error('❌ Connection test failed:', testError);
      return { success: false, error: testError };
    }
    
    console.log('✅ Connection successful');
    
    // Test 2: Check current user
    console.log('2. Checking current user...');
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('❌ User authentication failed:', userError);
      return { success: false, error: userError || new Error('No user found') };
    }
    
    console.log('✅ User authenticated:', user.id);
    
    // Test 3: Try a simple insert
    console.log('3. Testing simple link insert...');
    const testLink = {
      url: 'https://example.com/test-' + Date.now(),
      title: 'Test Link ' + new Date().toLocaleTimeString(),
      description: 'Test description',
      user_id: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    console.log('Inserting:', testLink);
    
    const { data: insertData, error: insertError } = await supabase
      .from('links')
      .insert(testLink)
      .select()
      .single();
    
    if (insertError) {
      console.error('❌ Insert failed:', insertError);
      return { success: false, error: insertError };
    }
    
    console.log('✅ Insert successful:', insertData);
    
    return { success: true, data: insertData };
    
  } catch (error) {
    console.error('❌ Debug test exception:', error);
    return { success: false, error };
  }
};

export const testSaveLink = async (url: string, title: string = 'Test Link') => {
  console.log('🔗 Testing link save with:', { url, title });
  return await debugDatabaseConnection();
};