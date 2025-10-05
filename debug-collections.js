const { createClient } = require('@supabase/supabase-js');
require('react-native-url-polyfill/auto');

// Debug script to test collections functionality
async function debugCollections() {
  const supabaseUrl = 'https://ecasfyyaziodowjlxseg.supabase.co';
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjYXNmeXlhemlvZG93amx4c2VnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUzMjI4NDcsImV4cCI6MjA1MDg5ODg0N30.QlnZjmhCgU3HZkQqiKM3FPZFFCdWgQ7OYVL1Q2-1pG4';
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  console.log('🔍 Testing Collections Debug Script');
  
  try {
    // Test 1: Check if collections table exists and has data
    console.log('\n1. Testing collections table access...');
    const { data: collections, error: collectionsError } = await supabase
      .from('collections')
      .select('*')
      .limit(5);
    
    if (collectionsError) {
      console.error('❌ Collections query error:', collectionsError);
    } else {
      console.log('✅ Collections query success:', collections?.length || 0, 'collections found');
      if (collections && collections.length > 0) {
        console.log('📄 Sample collection:', collections[0]);
      }
    }
    
    // Test 2: Check if we can create a collection (need to be authenticated)
    console.log('\n2. Testing authentication and collection creation...');
    const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({
      email: 'psntejaji@gmail.com',
      password: 'Purusho@123'
    });
    
    if (authError) {
      console.error('❌ Auth error:', authError);
      return;
    }
    
    console.log('✅ Authenticated as:', user?.email);
    
    // Test 3: Now try to create a collection
    const testCollection = {
      name: 'Debug Test Collection',
      description: 'Collection created by debug script',
      user_id: user.id
    };
    
    const { data: newCollection, error: createError } = await supabase
      .from('collections')
      .insert(testCollection)
      .select()
      .single();
    
    if (createError) {
      console.error('❌ Collection creation error:', createError);
    } else {
      console.log('✅ Collection created successfully:', newCollection);
      
      // Test 4: Clean up - delete the test collection
      const { error: deleteError } = await supabase
        .from('collections')
        .delete()
        .eq('id', newCollection.id);
      
      if (deleteError) {
        console.error('❌ Collection deletion error:', deleteError);
      } else {
        console.log('✅ Test collection cleaned up successfully');
      }
    }
    
    // Test 5: Check collection_links table
    console.log('\n3. Testing collection_links table...');
    const { data: collectionLinks, error: linksError } = await supabase
      .from('collection_links')
      .select('*')
      .limit(5);
    
    if (linksError) {
      console.error('❌ Collection links query error:', linksError);
    } else {
      console.log('✅ Collection links query success:', collectionLinks?.length || 0, 'relationships found');
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

debugCollections().then(() => {
  console.log('\n🔚 Debug script completed');
  process.exit(0);
}).catch(error => {
  console.error('💥 Debug script failed:', error);
  process.exit(1);
});