import { createClient, SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-url-polyfill/auto';
import { AuthResult, CloudSyncResult, Link, Collection, User, AuthUser } from '../types';

// Get environment variables - these are required for the app to work
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file and ensure EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY are set.');
}

// Debug logging to help with configuration
console.log('🔧 Supabase Configuration:');
console.log('   URL:', supabaseUrl);
console.log('   Key:', supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'not set');
console.log('   Mode: PRODUCTION');

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export { supabase };

// Database table schemas
export const TABLES = {
  LINKS: 'links',
  COLLECTIONS: 'collections',
  COLLECTION_LINKS: 'collection_links',
  USERS: 'profiles', // Supabase convention
  TAGS: 'tags',
  LINK_TAGS: 'link_tags',
} as const;

// Authentication service
export class AuthService {
  static async signUp(
    email: string, 
    password: string, 
    userData: { fullName?: string } = {}
  ): Promise<AuthResult> {
    try {
      console.log('🔄 AuthService.signUp called for:', email);
      console.log('📋 User data:', userData);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData,
        },
      });

      console.log('🔍 Supabase signUp response:', { 
        user: data?.user?.email, 
        session: !!data?.session,
        error: error?.message 
      });

      if (error) throw error;

      // Note: We don't manually create profiles anymore - the trigger handles it
      console.log('✅ Sign up successful, trigger should create profile automatically');

      return { 
        user: data.user as AuthUser, 
        session: data.session, 
        error: null 
      };
    } catch (error) {
      console.error('❌ AuthService.signUp error:', error);
      return { 
        user: null, 
        session: null, 
        error: error as Error 
      };
    }
  }

  static async signIn(email: string, password: string): Promise<AuthResult> {
    try {
      console.log('🔄 AuthService.signIn called for:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log('🔍 Supabase signIn response:', { 
        user: data?.user?.email, 
        session: !!data?.session,
        error: error?.message 
      });

      if (error) throw error;
      return { 
        user: data.user as AuthUser, 
        session: data.session, 
        error: null 
      };
    } catch (error) {
      console.error('❌ AuthService.signIn error:', error);
      return { 
        user: null, 
        session: null, 
        error: error as Error 
      };
    }
  }

  static async signOut(): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase.auth.signOut();
      return { error: error as Error | null };
    } catch (error) {
      return { error: error as Error };
    }
  }

  static async getCurrentUser(): Promise<{ user: AuthUser | null; error: Error | null }> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      return { user: session?.user as AuthUser || null, error: null };
    } catch (error) {
      return { user: null, error: error as Error };
    }
  }

  static onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  }
}

// Cloud sync service
export class CloudSyncService {
  static async syncLinks(userId: string): Promise<CloudSyncResult<Link[]>> {
    try {
      const { data, error } = await supabase
        .from(TABLES.LINKS)
        .select(`
          *,
          collections:collection_links(
            collection:collections(*)
          ),
          tags:link_tags(
            tag:tags(*)
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      return { data: data as Link[], error: error as Error | null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  static async syncCollections(userId: string): Promise<CloudSyncResult<Collection[]>> {
    try {
      const { data, error } = await supabase
        .from(TABLES.COLLECTIONS)
        .select(`
          *,
          links:collection_links(
            link:links(*)
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      return { data: data as Collection[], error: error as Error | null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  static async createLink(linkData: Partial<Link>, userId: string): Promise<CloudSyncResult<Link>> {
    try {
      console.log('Creating link with data:', { ...linkData, user_id: userId });
      
      // First, ensure user profile exists
      console.log('🔍 Ensuring user profile exists before creating link...');
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        return { data: null, error: new Error('User not authenticated') };
      }
      
      // Check if profile exists
      const { data: existingProfile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      // If profile doesn't exist, try to create it using RPC function
      if (!existingProfile && !profileError) {
        console.log('🚀 Profile missing for user:', userId);
        console.log('🔄 Attempting to create profile using RPC function...');
        
        // Try to create profile using the RPC function that bypasses RLS
        const { data: rpcResult, error: rpcError } = await supabase.rpc('create_user_profile', {
          user_id: userId,
          user_email: user.email || '',
          user_full_name: user.user_metadata?.fullName || user.user_metadata?.full_name || 'User'
        });
        
        if (rpcError) {
          console.error('❌ RPC profile creation failed:', rpcError);
          return { 
            data: null, 
            error: new Error(`Profile creation failed. Please run the SQL fix in database/fix_profile_insert_policy.sql. Error: ${rpcError.message}`) 
          };
        }
        
        console.log('✅ Profile created successfully via RPC:', rpcResult);
      } else if (profileError) {
        console.error('❌ Profile check failed:', profileError);
        return { data: null, error: new Error(`Profile check failed: ${profileError.message}`) };
      } else {
        console.log('✅ Profile already exists');
      }
      
      // Now create the link
      const { data, error } = await supabase
        .from(TABLES.LINKS)
        .insert({
          ...linkData,
          user_id: userId,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        return { data: null, error: new Error(`Database error: ${error.message}`) };
      }

      if (!data) {
        console.error('No data returned from Supabase');
        return { data: null, error: new Error('No data returned from database') };
      }

      console.log('Link created successfully:', data);
      return { data: data as Link, error: null };
    } catch (error) {
      console.error('Exception in createLink:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown database error';
      return { data: null, error: new Error(errorMessage) };
    }
  }

  static async updateLink(
    linkId: string, 
    linkData: Partial<Link>, 
    userId: string
  ): Promise<CloudSyncResult<Link>> {
    try {
      const { data, error } = await supabase
        .from(TABLES.LINKS)
        .update({
          ...linkData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', linkId)
        .eq('user_id', userId)
        .select()
        .single();

      return { data: data as Link, error: error as Error | null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  static async deleteLink(linkId: string, userId: string): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase
        .from(TABLES.LINKS)
        .delete()
        .eq('id', linkId)
        .eq('user_id', userId);

      return { error: error as Error | null };
    } catch (error) {
      return { error: error as Error };
    }
  }

  static async createCollection(
    collectionData: Partial<Collection>, 
    userId: string
  ): Promise<CloudSyncResult<Collection>> {
    try {
      const { data, error } = await supabase
        .from(TABLES.COLLECTIONS)
        .insert({
          ...collectionData,
          user_id: userId,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      return { data: data as Collection, error: error as Error | null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  static async updateCollection(
    collectionId: string, 
    collectionData: Partial<Collection>, 
    userId: string
  ): Promise<CloudSyncResult<Collection>> {
    try {
      const { data, error } = await supabase
        .from(TABLES.COLLECTIONS)
        .update({
          ...collectionData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', collectionId)
        .eq('user_id', userId)
        .select()
        .single();

      return { data: data as Collection, error: error as Error | null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  static async deleteCollection(collectionId: string, userId: string): Promise<{ error: Error | null }> {
    try {
      // First delete all collection-link relationships
      const { error: linkRelationsError } = await supabase
        .from(TABLES.COLLECTION_LINKS)
        .delete()
        .eq('collection_id', collectionId);

      if (linkRelationsError) {
        return { error: linkRelationsError as Error };
      }

      // Then delete the collection
      const { error: collectionError } = await supabase
        .from(TABLES.COLLECTIONS)
        .delete()
        .eq('id', collectionId)
        .eq('user_id', userId);

      return { error: collectionError as Error | null };
    } catch (error) {
      return { error: error as Error };
    }
  }

  static async addLinkToCollection(
    linkId: number, 
    collectionId: number, 
    userId: string
  ): Promise<CloudSyncResult<any>> {
    try {
      // Verify ownership
      const { data: link } = await supabase
        .from(TABLES.LINKS)
        .select('id')
        .eq('id', linkId)
        .eq('user_id', userId)
        .single();

      const { data: collection } = await supabase
        .from(TABLES.COLLECTIONS)
        .select('id')
        .eq('id', collectionId)
        .eq('user_id', userId)
        .single();

      if (!link || !collection) {
        return { data: null, error: new Error('Link or collection not found') };
      }

      const { data, error } = await supabase
        .from(TABLES.COLLECTION_LINKS)
        .insert({
          link_id: linkId,
          collection_id: collectionId,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      return { data, error: error as Error | null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  static async removeLinkFromCollection(
    linkId: number, 
    collectionId: number
  ): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase
        .from(TABLES.COLLECTION_LINKS)
        .delete()
        .eq('link_id', linkId)
        .eq('collection_id', collectionId);

      return { error: error as Error | null };
    } catch (error) {
      return { error: error as Error };
    }
  }

  // Real-time subscriptions
  static subscribeToLinks(userId: string, callback: Function) {
    const subscription = supabase
      .channel(`links:user_id=eq.${userId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: TABLES.LINKS,
        filter: `user_id=eq.${userId}`,
      }, callback)
      .subscribe();

    return {
      unsubscribe: () => subscription.unsubscribe(),
    };
  }

  static subscribeToCollections(userId: string, callback: Function) {
    const subscription = supabase
      .channel(`collections:user_id=eq.${userId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: TABLES.COLLECTIONS,
        filter: `user_id=eq.${userId}`,
      }, callback)
      .subscribe();

    return {
      unsubscribe: () => subscription.unsubscribe(),
    };
  }
}