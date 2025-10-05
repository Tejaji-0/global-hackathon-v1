// Types for the LinkHive application

export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface AuthUser {
  id: string;
  email?: string;
  user_metadata?: Record<string, any>;
  app_metadata?: Record<string, any>;
  aud: string;
  created_at: string;
  updated_at: string;
  email_confirmed_at?: string;
}

export interface Session {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  token_type: string;
  user: AuthUser;
}

export interface AuthResult {
  user: AuthUser | null;
  session: Session | null;
  error: Error | null;
}

export interface Link {
  id: string; // UUID from database
  url: string;
  title: string;
  description?: string;
  category?: string;
  tags?: string[];
  favicon_url?: string;
  image_url?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface Collection {
  id: string; // UUID from database
  name: string;
  description?: string;
  color?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  links?: Link[];
}

export interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  loading: boolean;
  initializing: boolean;
  isAuthenticated: boolean;
  signUp: (email: string, password: string, userData?: { fullName?: string }) => Promise<AuthResult>;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signOut: () => Promise<{ error: Error | null }>;
}

export interface CloudSyncResult<T> {
  data: T | null;
  error: Error | null;
}

export interface DatabaseError extends Error {
  code?: string;
  details?: string;
  hint?: string;
}

// Navigation Types for Enhanced Routing
export type RootStackParamList = {
  MainTabs: undefined;
  CollectionDetail: {
    collection: Collection;
  };
  LinkDetail: {
    link: Link & {
      platform?: string;
      category?: string;
      mood?: string;
      notes?: string;
      summary?: string;
    };
  };
  Auth: undefined;
};

export type BottomTabParamList = {
  Home: undefined;
  Search: undefined;
  AddLink: undefined;
  Collections: undefined;
  Profile: undefined;
};

// Screen-specific navigation prop types
export interface NavigationProp<T extends keyof RootStackParamList> {
  navigate: <RouteName extends keyof RootStackParamList>(
    ...args: undefined extends RootStackParamList[RouteName]
      ? [screen: RouteName] | [screen: RouteName, params: RootStackParamList[RouteName]]
      : [screen: RouteName, params: RootStackParamList[RouteName]]
  ) => void;
  goBack: () => void;
  canGoBack: () => boolean;
  getId: () => string | undefined;
  getParent: () => any;
  getState: () => any;
}

export interface RouteProp<T extends keyof RootStackParamList> {
  key: string;
  name: T;
  params: RootStackParamList[T];
  path?: string;
}

// Enhanced Screen Props Interface
export interface ScreenProps<T extends keyof RootStackParamList> {
  navigation: NavigationProp<T>;
  route: RouteProp<T>;
}