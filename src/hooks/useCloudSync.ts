import { useState, useEffect, useCallback, useRef } from 'react';
import { CloudSyncService } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Link, Collection, CloudSyncResult } from '../types';

// Sync configuration constants
const SYNC_THROTTLE_MS = 30000; // 30 seconds between syncs
const SYNC_DEBOUNCE_MS = 2000; // 2 seconds debounce

// Debounce utility function
const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

interface UseLinksReturn {
  links: Link[];
  loading: boolean;
  error: string | null;
  syncing: boolean;
  createLink: (linkData: Partial<Link>) => Promise<CloudSyncResult<Link>>;
  updateLink: (linkId: string, linkData: Partial<Link>) => Promise<CloudSyncResult<Link>>;
  deleteLink: (linkId: string) => Promise<{ error: Error | null }>;
  searchLinks: (query: string) => Link[];
  filterByCategory: (category: string) => Link[];
  getCategories: () => string[];
  refreshLinks: () => Promise<void>;
}

interface UseCollectionsReturn {
  collections: Collection[];
  loading: boolean;
  error: string | null;
  syncing: boolean;
  createCollection: (collectionData: Partial<Collection>) => Promise<CloudSyncResult<Collection>>;
    updateCollection: (collectionId: string, collectionData: Partial<Collection>) => Promise<{ data: Collection | null; error: Error | null }>;
  deleteCollection: (collectionId: string) => Promise<{ error: Error | null }>;
  addLinkToCollection: (linkId: number, collectionId: number) => Promise<{ error: Error | null }>;
  removeLinkFromCollection: (linkId: number, collectionId: number) => Promise<{ error: Error | null }>;
  refreshCollections: () => Promise<void>;
}

interface PendingOperation {
  id: string | number;
  type: 'CREATE_LINK' | 'UPDATE_LINK' | 'DELETE_LINK' | 'CREATE_COLLECTION' | 'UPDATE_COLLECTION' | 'DELETE_COLLECTION';
  data?: any;
  timestamp: string;
}

interface UseOfflineSyncReturn {
  isOnline: boolean;
  pendingOperations: PendingOperation[];
  queueOperation: (operation: Omit<PendingOperation, 'id' | 'timestamp'>) => Promise<void>;
  processPendingOperations: () => Promise<void>;
}

// Custom hook for managing links with cloud sync
export const useLinks = (): UseLinksReturn => {
  const { user } = useAuth();
  const [links, setLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState<boolean>(false);
  
  // Sync control variables
  const [lastSyncTime, setLastSyncTime] = useState<number>(0);
  const [syncInProgress, setSyncInProgress] = useState<boolean>(false);

  // Load links from cache first, then sync with cloud (with throttling)
  const loadLinks = useCallback(async (forceSync: boolean = false): Promise<void> => {
    if (!user) return;

    const now = Date.now();
    
    // Check if sync is already in progress
    if (syncInProgress && !forceSync) {
      console.log('🚫 Sync already in progress, skipping...');
      return;
    }

    // Check throttle limit (unless forced)
    if (!forceSync && (now - lastSyncTime) < SYNC_THROTTLE_MS) {
      console.log('⏱️ Sync throttled, last sync was', Math.round((now - lastSyncTime) / 1000), 'seconds ago');
      return;
    }

    setSyncInProgress(true);
    setLoading(true);
    setError(null);

    try {
      // Load from cache first for better UX
      const cachedLinks = await AsyncStorage.getItem(`links_${user.id}`);
      if (cachedLinks) {
        const parsed = JSON.parse(cachedLinks);
        setLinks(parsed);
        console.log('📱 Loaded', parsed.length, 'links from cache');
      }

      // Then sync with cloud (with throttling)
      console.log('☁️ Starting cloud sync...');
      setSyncing(true);
      const { data, error: syncError } = await CloudSyncService.syncLinks(user.id);
      
      if (syncError) {
        setError(syncError.message);
        console.error('❌ Sync error:', syncError.message);
      } else if (data) {
        setLinks(data);
        setLastSyncTime(now);
        // Cache the synced data
        await AsyncStorage.setItem(`links_${user.id}`, JSON.stringify(data));
        console.log('✅ Synced', data.length, 'links successfully');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('❌ Load links error:', errorMessage);
    } finally {
      setLoading(false);
      setSyncing(false);
      setSyncInProgress(false);
    }
  }, [user, lastSyncTime, syncInProgress]);

  // Create a new link
  const createLink = useCallback(async (linkData: Partial<Link>): Promise<CloudSyncResult<Link>> => {
    if (!user) throw new Error('User not authenticated');

    setError(null);
    try {
      const { data, error: createError } = await CloudSyncService.createLink(linkData, user.id);
      
      if (createError) {
        throw createError;
      }

      if (data) {
        const updatedLinks = [data, ...links];
        setLinks(updatedLinks);
        // Update cache
        await AsyncStorage.setItem(`links_${user.id}`, JSON.stringify(updatedLinks));
      }

      return { data, error: null };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error.message);
      return { data: null, error };
    }
  }, [user, links]);

  // Update a link
  const updateLink = useCallback(async (linkId: string, linkData: Partial<Link>): Promise<CloudSyncResult<Link>> => {
    if (!user) throw new Error('User not authenticated');

    setError(null);
    try {
      const { data, error: updateError } = await CloudSyncService.updateLink(linkId, linkData, user.id);
      
      if (updateError) {
        throw updateError;
      }

      if (data) {
        const updatedLinks = links.map(link => 
          link.id === linkId ? { ...link, ...data } : link
        );
        setLinks(updatedLinks);
        // Update cache
        await AsyncStorage.setItem(`links_${user.id}`, JSON.stringify(updatedLinks));
      }

      return { data, error: null };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error.message);
      return { data: null, error };
    }
  }, [user, links]);

  // Delete a link
  const deleteLink = useCallback(async (linkId: string): Promise<{ error: Error | null }> => {
    if (!user) throw new Error('User not authenticated');

    console.log('🗑️ Deleting link with ID:', linkId);
    console.log('📋 Current links count:', links.length);

    setError(null);
    
    // Optimistic update - immediately remove from UI
    const originalLinks = links;
    const optimisticLinks = links.filter(link => link.id !== linkId);
    console.log('⚡ Optimistic update: removing from UI immediately');
    setLinks(optimisticLinks);
    
    try {
      const { error: deleteError } = await CloudSyncService.deleteLink(linkId, user.id);
      
      if (deleteError) {
        console.error('❌ Delete error from service, reverting optimistic update:', deleteError);
        // Revert optimistic update on error
        setLinks(originalLinks);
        throw deleteError;
      }

      console.log('✅ Service deletion confirmed, optimistic update was correct');
      // Update cache with confirmed deletion
      await AsyncStorage.setItem(`links_${user.id}`, JSON.stringify(optimisticLinks));
      console.log('💾 Cache updated successfully');

      return { error: null };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      console.error('❌ Delete link error:', error);
      setError(error.message);
      return { error };
    }
  }, [user, links]);

  // Search links
  const searchLinks = useCallback((query: string): Link[] => {
    if (!query.trim()) return links;
    
    const lowercaseQuery = query.toLowerCase();
    return links.filter(link => 
      link.title?.toLowerCase().includes(lowercaseQuery) ||
      link.description?.toLowerCase().includes(lowercaseQuery) ||
      link.url?.toLowerCase().includes(lowercaseQuery) ||
      link.tags?.some(tag => tag.toLowerCase().includes(lowercaseQuery))
    );
  }, [links]);

  // Filter links by category
  const filterByCategory = useCallback((category: string): Link[] => {
    if (!category) return links;
    return links.filter(link => link.category === category);
  }, [links]);

  // Get unique categories
  const getCategories = useCallback((): string[] => {
    const categories = new Set<string>();
    links.forEach(link => {
      if (link.category) {
        categories.add(link.category);
      }
    });
    return Array.from(categories);
  }, [links]);

  // Debounced refresh function to prevent excessive syncing
  const debouncedRefresh = useCallback(
    debounce(() => {
      console.log('🔄 Debounced refresh triggered');
      loadLinks(false);
    }, SYNC_DEBOUNCE_MS),
    [loadLinks]
  );

  // Manual refresh function (forces sync)
  const refreshLinks = useCallback(async (): Promise<void> => {
    console.log('🔄 Manual refresh requested');
    await loadLinks(true); // Force sync on manual refresh
  }, [loadLinks]);

  // Load links when user changes (initial load only)
  useEffect(() => {
    if (user) {
      console.log('👤 User changed, performing initial sync');
      loadLinks(true); // Force initial sync
    } else {
      setLinks([]);
      setError(null);
      setLastSyncTime(0);
    }
  }, [user]); // Removed loadLinks dependency to prevent loops

  // Set up limited real-time subscription
  useEffect(() => {
    if (!user) return;

    console.log('🔗 Setting up real-time subscription for user:', user.id);
    
    const subscription = CloudSyncService.subscribeToLinks(user.id, (payload: any) => {
      console.log('📡 Real-time link update received:', payload.eventType);
      
      // Use debounced refresh to prevent excessive syncing
      debouncedRefresh();
    });

    return () => {
      console.log('🔌 Cleaning up real-time subscription');
      subscription.unsubscribe();
    };
  }, [user, debouncedRefresh]);

  return {
    links,
    loading,
    error,
    syncing,
    createLink,
    updateLink,
    deleteLink,
    searchLinks,
    filterByCategory,
    getCategories,
    refreshLinks, // Now uses the manual refresh function
  };
};

// Custom hook for managing collections with cloud sync
export const useCollections = (): UseCollectionsReturn => {
  const { user } = useAuth();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState<boolean>(false);
  
  // Sync control variables for collections
  const [lastCollectionSyncTime, setLastCollectionSyncTime] = useState<number>(0);
  const [collectionSyncInProgress, setCollectionSyncInProgress] = useState<boolean>(false);

  // Load collections from cache first, then sync with cloud (with throttling)
  const loadCollections = useCallback(async (forceSync: boolean = false): Promise<void> => {
    if (!user) return;

    const now = Date.now();
    
    // Check if sync is already in progress
    if (collectionSyncInProgress && !forceSync) {
      console.log('🚫 Collection sync already in progress, skipping...');
      return;
    }

    // Check throttle limit (unless forced)
    if (!forceSync && (now - lastCollectionSyncTime) < SYNC_THROTTLE_MS) {
      console.log('⏱️ Collection sync throttled, last sync was', Math.round((now - lastCollectionSyncTime) / 1000), 'seconds ago');
      return;
    }

    setCollectionSyncInProgress(true);
    setLoading(true);
    setError(null);

    try {
      // Load from cache first
      const cachedCollections = await AsyncStorage.getItem(`collections_${user.id}`);
      if (cachedCollections) {
        const parsed = JSON.parse(cachedCollections);
        setCollections(parsed);
        console.log('📱 Loaded', parsed.length, 'collections from cache');
      }

      // Then sync with cloud
      console.log('☁️ Starting collections cloud sync...');
      setSyncing(true);
      const { data, error: syncError } = await CloudSyncService.syncCollections(user.id);
      
      if (syncError) {
        setError(syncError.message);
        console.error('❌ Collections sync error:', syncError.message);
      } else if (data) {
        setCollections(data);
        setLastCollectionSyncTime(now);
        // Cache the synced data
        await AsyncStorage.setItem(`collections_${user.id}`, JSON.stringify(data));
        console.log('✅ Synced', data.length, 'collections successfully');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('❌ Load collections error:', errorMessage);
    } finally {
      setLoading(false);
      setSyncing(false);
      setCollectionSyncInProgress(false);
    }
  }, [user, lastCollectionSyncTime, collectionSyncInProgress]);

  // Create a new collection
  const createCollection = useCallback(async (collectionData: Partial<Collection>): Promise<CloudSyncResult<Collection>> => {
    if (!user) throw new Error('User not authenticated');

    setError(null);
    try {
      const { data, error: createError } = await CloudSyncService.createCollection(collectionData, user.id);
      
      if (createError) {
        throw createError;
      }

      if (data) {
        const updatedCollections = [data, ...collections];
        setCollections(updatedCollections);
        // Update cache
        await AsyncStorage.setItem(`collections_${user.id}`, JSON.stringify(updatedCollections));
      }

      return { data, error: null };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error.message);
      return { data: null, error };
    }
  }, [user, collections]);

  // Update a collection
  const updateCollection = useCallback(async (collectionId: string, collectionData: Partial<Collection>): Promise<CloudSyncResult<Collection>> => {
    if (!user) throw new Error('User not authenticated');

    setError(null);
    try {
      const { data, error: updateError } = await CloudSyncService.updateCollection(collectionId, collectionData, user.id);
      
      if (updateError) {
        throw updateError;
      }

      if (data) {
        const updatedCollections = collections.map(collection => 
          collection.id === collectionId ? { ...collection, ...data } : collection
        );
        setCollections(updatedCollections);
        // Update cache
        await AsyncStorage.setItem(`collections_${user.id}`, JSON.stringify(updatedCollections));
      }

      return { data, error: null };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error.message);
      return { data: null, error };
    }
  }, [user, collections]);

  // Delete a collection
  const deleteCollection = useCallback(async (collectionId: string): Promise<{ error: Error | null }> => {
    if (!user) throw new Error('User not authenticated');

    console.log('🗑️ Deleting collection with ID:', collectionId);
    console.log('📋 Current collections count:', collections.length);

    setError(null);
    
    // Optimistic update - immediately remove from UI
    const originalCollections = collections;
    const optimisticCollections = collections.filter(collection => collection.id !== collectionId);
    console.log('⚡ Optimistic update: removing collection from UI immediately');
    setCollections(optimisticCollections);
    
    try {
      const { error: deleteError } = await CloudSyncService.deleteCollection(collectionId, user.id);
      
      if (deleteError) {
        console.error('❌ Delete error from service, reverting optimistic update:', deleteError);
        // Revert optimistic update on error
        setCollections(originalCollections);
        throw deleteError;
      }

      console.log('✅ Service deletion confirmed, optimistic update was correct');
      // Update cache with confirmed deletion
      await AsyncStorage.setItem(`collections_${user.id}`, JSON.stringify(optimisticCollections));
      console.log('💾 Cache updated successfully');

      return { error: null };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      console.error('❌ Delete collection error:', error);
      setError(error.message);
      return { error };
    }
  }, [user, collections]);

  // Add link to collection
  const addLinkToCollection = useCallback(async (linkId: number, collectionId: number): Promise<{ error: Error | null }> => {
    if (!user) throw new Error('User not authenticated');

    setError(null);
    try {
      const { error: addError } = await CloudSyncService.addLinkToCollection(linkId, collectionId, user.id);
      
      if (addError) {
        throw addError;
      }

      // Refresh collections to show updated link count
      await loadCollections();

      return { error: null };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error.message);
      return { error };
    }
  }, [user, loadCollections]);

  // Remove link from collection
  const removeLinkFromCollection = useCallback(async (linkId: number, collectionId: number): Promise<{ error: Error | null }> => {
    if (!user) throw new Error('User not authenticated');

    setError(null);
    try {
      const { error: removeError } = await CloudSyncService.removeLinkFromCollection(linkId, collectionId);
      
      if (removeError) {
        throw removeError;
      }

      // Refresh collections to show updated link count
      await loadCollections();

      return { error: null };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error.message);
      return { error };
    }
  }, [user, loadCollections]);

  // Debounced refresh for collections
  const debouncedCollectionRefresh = useCallback(
    debounce(() => {
      console.log('🔄 Debounced collections refresh triggered');
      loadCollections(false);
    }, SYNC_DEBOUNCE_MS),
    [loadCollections]
  );

  // Manual refresh function for collections
  const refreshCollections = useCallback(async (): Promise<void> => {
    console.log('🔄 Manual collections refresh requested');
    await loadCollections(true); // Force sync on manual refresh
  }, [loadCollections]);

  // Load collections when user changes (initial load only)
  useEffect(() => {
    if (user) {
      console.log('👤 User changed, performing initial collections sync');
      loadCollections(true); // Force initial sync
    } else {
      setCollections([]);
      setError(null);
      setLastCollectionSyncTime(0);
    }
  }, [user]); // Removed loadCollections dependency to prevent loops

  // Set up limited real-time subscription for collections
  useEffect(() => {
    if (!user) return;

    console.log('🔗 Setting up real-time subscription for collections');
    
    const subscription = CloudSyncService.subscribeToCollections(user.id, (payload: any) => {
      console.log('📡 Real-time collection update received:', payload.eventType);
      
      // Use debounced refresh to prevent excessive syncing
      debouncedCollectionRefresh();
    });

    return () => {
      console.log('🔌 Cleaning up collections real-time subscription');
      subscription.unsubscribe();
    };
  }, [user, debouncedCollectionRefresh]);

  return {
    collections,
    loading,
    error,
    syncing,
    createCollection,
    updateCollection,
    deleteCollection,
    addLinkToCollection,
    removeLinkFromCollection,
    refreshCollections, // Now uses the manual refresh function
  };
};

// Custom hook for offline support
export const useOfflineSync = (): UseOfflineSyncReturn => {
  const { user } = useAuth();
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [pendingOperations, setPendingOperations] = useState<PendingOperation[]>([]);

  // Queue operation for when back online
  const queueOperation = useCallback(async (operation: Omit<PendingOperation, 'id' | 'timestamp'>): Promise<void> => {
    const operations = [...pendingOperations, {
      id: Date.now(),
      ...operation,
      timestamp: new Date().toISOString(),
    }];
    
    setPendingOperations(operations);
    await AsyncStorage.setItem(`pending_operations_${user?.id}`, JSON.stringify(operations));
  }, [pendingOperations, user]);

  // Process pending operations when back online
  const processPendingOperations = useCallback(async (): Promise<void> => {
    if (!user || pendingOperations.length === 0) return;

    for (const operation of pendingOperations) {
      try {
        switch (operation.type) {
          case 'CREATE_LINK':
            await CloudSyncService.createLink(operation.data, user.id);
            break;
          case 'UPDATE_LINK':
            await CloudSyncService.updateLink(operation.id as string, operation.data, user.id);
            break;
          case 'DELETE_LINK':
            await CloudSyncService.deleteLink(operation.id as string, user.id);
            break;
          case 'CREATE_COLLECTION':
            await CloudSyncService.createCollection(operation.data, user.id);
            break;
          case 'UPDATE_COLLECTION':
            await CloudSyncService.updateCollection(operation.id as string, operation.data, user.id);
            break;
          case 'DELETE_COLLECTION':
            await CloudSyncService.deleteCollection(operation.id as string, user.id);
            break;
        }
      } catch (error) {
        console.error('Error processing pending operation:', error);
      }
    }

    // Clear processed operations
    setPendingOperations([]);
    await AsyncStorage.removeItem(`pending_operations_${user.id}`);
  }, [user, pendingOperations]);

  // Load pending operations on mount
  useEffect(() => {
    const loadPendingOperations = async (): Promise<void> => {
      if (!user) return;
      
      try {
        const cached = await AsyncStorage.getItem(`pending_operations_${user.id}`);
        if (cached) {
          setPendingOperations(JSON.parse(cached));
        }
      } catch (error) {
        console.error('Error loading pending operations:', error);
      }
    };

    loadPendingOperations();
  }, [user]);

  // Process pending operations when back online
  useEffect(() => {
    if (isOnline && pendingOperations.length > 0) {
      processPendingOperations();
    }
  }, [isOnline, pendingOperations, processPendingOperations]);

  return {
    isOnline,
    pendingOperations,
    queueOperation,
    processPendingOperations,
  };
};