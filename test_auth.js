// Quick authentication test script
// Run this to test Supabase auth without email confirmation

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAuth() {
  console.log('🧪 Testing Supabase Authentication...');
  console.log('📧 URL:', supabaseUrl);
  console.log('🔑 Key:', supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'missing');

  // Test with a fresh email  
  const testEmail = `testuser${Date.now()}@gmail.com`;
  const testPassword = 'test123456';

  try {
    // 1. Create account
    console.log('\n1️⃣ Creating test account...');
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,  
      password: testPassword,
      options: {
        data: {
          full_name: 'Test User'
        }
      }
    });

    if (signUpError) {
      console.error('❌ Sign up error:', signUpError.message);
      return;
    }

    console.log('✅ Account created:', {
      user: signUpData.user?.email,
      confirmed: signUpData.user?.email_confirmed_at ? 'Yes' : 'No',
      needsConfirmation: !signUpData.session
    });

    // 2. Check if we can sign in (will fail if email confirmation required)
    console.log('\n2️⃣ Testing sign in...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });

    if (signInError) {
      console.error('❌ Sign in error:', signInError.message);
      if (signInError.message.includes('email_not_confirmed')) {
        console.log('📧 EMAIL CONFIRMATION REQUIRED');
        console.log('   Go to Supabase Dashboard → Authentication → Settings');
        console.log('   Disable "Enable email confirmations" for testing');
      }
      return;
    }

    console.log('✅ Sign in successful:', {
      user: signInData.user?.email,
      hasSession: !!signInData.session
    });

    // 3. Check if profile was created by trigger
    console.log('\n3️⃣ Checking profile creation...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', signInData.user.id)
      .single();

    if (profileError) {
      console.error('❌ Profile error:', profileError.message);
    } else {
      console.log('✅ Profile created automatically:', {
        id: profile.id,
        email: profile.email,
        name: profile.full_name
      });
    }

    // 4. Clean up
    console.log('\n4️⃣ Cleaning up test account...');
    await supabase.auth.signOut();
    console.log('✅ Test completed successfully!');

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

testAuth();