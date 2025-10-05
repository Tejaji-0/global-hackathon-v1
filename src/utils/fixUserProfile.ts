// Fix for missing user profile
import { supabase } from '../services/supabase';

export const ensureUserProfile = async () => {
  try {
    console.log('🔍 Checking user profile...');
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('User not authenticated');
    }
    
    console.log('✅ User authenticated:', user.id);
    console.log('📧 User email:', user.email);
    
    // Check if profile exists
    console.log('🔍 Checking if profile exists...');
    const { data: existingProfile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (profileError && profileError.code !== 'PGRST116') {
      // PGRST116 = no rows returned, which is expected if profile doesn't exist
      throw profileError;
    }
    
    if (existingProfile) {
      console.log('✅ Profile already exists:', existingProfile);
      return { success: true, profile: existingProfile };
    }
    
    // Create missing profile
    console.log('🚀 Creating missing profile...');
    const profileData = {
      id: user.id,
      email: user.email || '',
      full_name: user.user_metadata?.fullName || user.user_metadata?.full_name || 'User',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    console.log('Profile data to insert:', profileData);
    
    const { data: newProfile, error: insertError } = await supabase
      .from('profiles')
      .insert(profileData)
      .select()
      .single();
    
    if (insertError) {
      console.error('❌ Failed to create profile:', insertError);
      throw insertError;
    }
    
    console.log('✅ Profile created successfully:', newProfile);
    return { success: true, profile: newProfile };
    
  } catch (error) {
    console.error('❌ Profile check/creation failed:', error);
    return { success: false, error };
  }
};

export const fixUserProfileAndSaveLink = async (linkData: any) => {
  try {
    // Step 1: Ensure profile exists
    const profileResult = await ensureUserProfile();
    
    if (!profileResult.success) {
      throw new Error(`Profile creation failed: ${profileResult.error?.message}`);
    }
    
    console.log('✅ Profile verified, proceeding with link save...');
    
    // Step 2: Try to save link again
    const { data: linkResult, error: linkError } = await supabase
      .from('links')
      .insert(linkData)
      .select()
      .single();
    
    if (linkError) {
      console.error('❌ Link save still failed:', linkError);
      throw linkError;
    }
    
    console.log('✅ Link saved successfully:', linkResult);
    return { success: true, data: linkResult };
    
  } catch (error) {
    console.error('❌ Fix and save failed:', error);
    return { success: false, error };
  }
};