import { createClient, SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-url-polyfill/auto';
import { AuthResult, CloudSyncResult, Link, Collection, User, AuthUser } from '../types';

// Use environment variables or fallback to demo values
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://demo.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'demo-key';

// Debug logging to help with configuration
console.log('🔧 Supabase Configuration:');
console.log('   URL:', supabaseUrl);
console.log('   Key:', supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'not set');
console.log('   Mode:', supabaseUrl !== 'https://demo.supabase.co' ? 'PRODUCTION' : 'DEMO');

// Create a safe client that won't crash if credentials are missing
let supabase: SupabaseClient;
let isRealClient = false;

try {
  if (supabaseUrl !== 'https://demo.supabase.co' && supabaseAnonKey !== 'demo-key') {
    supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });
    isRealClient = true;
  } else {
    throw new Error('Demo credentials detected');
  }
} catch (error) {
  console.log('ℹ️  LinkHive is running in DEMO MODE');
  console.log('📱 All features are working with mock data');
  console.log('🔧 To connect to real Supabase: Create .env file with your credentials');
  console.log('📚 See SUPABASE_SETUP.md for complete setup instructions');
  // Create a mock client for development
  supabase = createMockClient() as unknown as SupabaseClient;
  isRealClient = false;
}

// Mock client for development without real Supabase credentials
function createMockClient() {
  return {
    from: (table: string) => ({
      select: (query = '*') => Promise.resolve({ data: getMockData(table), error: null }),
      insert: (data: any) => Promise.resolve({ data: [{ id: Date.now(), ...data }], error: null }),
      update: (data: any) => Promise.resolve({ data: [data], error: null }),
      delete: () => Promise.resolve({ data: null, error: null }),
      eq: function(column: string, value: any) { return this; },
      order: function(column: string, options?: any) { return this; },
      range: function(from: number, to: number) { return this; },
      single: function() { return this; },
    }),
    auth: {
      signUp: ({ email, password }: { email: string; password: string }) => Promise.resolve({ 
        data: { user: { id: 'mock-user-id', email }, session: { access_token: 'mock-token' } }, 
        error: null 
      }),
      signInWithPassword: ({ email, password }: { email: string; password: string }) => Promise.resolve({ 
        data: { user: { id: 'mock-user-id', email }, session: { access_token: 'mock-token' } }, 
        error: null 
      }),
      signOut: () => Promise.resolve({ error: null }),
      getSession: () => Promise.resolve({ 
        data: { session: { user: { id: 'mock-user-id', email: 'demo@linkhive.app' } } }, 
        error: null 
      }),
      onAuthStateChange: (callback: Function) => {
        // Simulate initial auth state
        setTimeout(() => callback('SIGNED_IN', { user: { id: 'mock-user-id', email: 'demo@linkhive.app' } }), 100);
        return { data: { subscription: { unsubscribe: () => {} } } };
      },
    },
    channel: () => ({
      on: () => ({ subscribe: () => {} }),
      subscribe: () => {},
      unsubscribe: () => {},
    }),
  };
}

// Mock data for development
function getMockData(table: string): any[] {
  switch (table) {
    case 'links':
      return [
        {
          id: 1,
          url: 'https://react-native.dev',
          title: 'React Native Documentation',
          description: 'Learn React Native development',
          category: 'Development',
          tags: ['react', 'mobile', 'development'],
          created_at: new Date().toISOString(),
          user_id: 'mock-user-id'
        }
      ];
    case 'collections':
      return [
        {
          id: 1,
          name: 'Development Resources',
          description: 'Useful development links',
          color: '#007AFF',
          created_at: new Date().toISOString(),
          user_id: 'mock-user-id'
        }
      ];
    default:
      return [];
  }
}

export { supabase, isRealClient };

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
      if (!isRealClient) {
        return { data: getMockData('links') as Link[], error: null };
      }

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
      if (!isRealClient) {
        return { data: getMockData('collections') as Collection[], error: null };
      }

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
      
      // If profile doesn't exist, create it  
      if (!existingProfile && !profileError) {
        console.log('🚀 Creating missing profile for user:', userId);
        const profileData = {
          id: userId,
          email: user.email || '',
          full_name: user.user_metadata?.fullName || user.user_metadata?.full_name || 'User',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        const { error: insertError } = await supabase
          .from('profiles')
          .insert(profileData);
        
        if (insertError) {
          console.error('❌ Failed to create profile:', insertError);
          return { data: null, error: new Error(`Profile creation failed: ${insertError.message}`) };
        }
        
        console.log('✅ Profile created successfully');
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
    collectionId: number, 
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

  static async deleteCollection(collectionId: number, userId: string): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase
        .from(TABLES.COLLECTIONS)
        .delete()
        .eq('id', collectionId)
        .eq('user_id', userId);

      return { error: error as Error | null };
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
    if (!isRealClient) {
      // Mock real-time updates for development
      return { unsubscribe: () => {} };
    }

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
    if (!isRealClient) {
      // Mock real-time updates for development
      return { unsubscribe: () => {} };
    }

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