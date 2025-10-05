import { useState, useEffect, useCallback } from 'react';
import { CloudSyncService } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Link, Collection, CloudSyncResult } from '../types';

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
  updateCollection: (collectionId: number, collectionData: Partial<Collection>) => Promise<CloudSyncResult<Collection>>;
  deleteCollection: (collectionId: number) => Promise<{ error: Error | null }>;
  addLinkToCollection: (linkId: number, collectionId: number) => Promise<{ error: Error | null }>;
  removeLinkFromCollection: (linkId: number, collectionId: number) => Promise<{ error: Error | null }>;
  refreshCollections: () => Promise<void>;
}

interface PendingOperation {
  id: number;
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

  // Load links from cache first, then sync with cloud
  const loadLinks = useCallback(async (): Promise<void> => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      // Load from cache first for better UX
      const cachedLinks = await AsyncStorage.getItem(`links_${user.id}`);
      if (cachedLinks) {
        setLinks(JSON.parse(cachedLinks));
      }

      // Then sync with cloud
      setSyncing(true);
      const { data, error: syncError } = await CloudSyncService.syncLinks(user.id);
      
      if (syncError) {
        setError(syncError.message);
      } else if (data) {
        setLinks(data);
        // Cache the synced data
        await AsyncStorage.setItem(`links_${user.id}`, JSON.stringify(data));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  }, [user]);

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

    setError(null);
    try {
      const { error: deleteError } = await CloudSyncService.deleteLink(linkId, user.id);
      
      if (deleteError) {
        throw deleteError;
      }

      const updatedLinks = links.filter(link => link.id !== linkId);
      setLinks(updatedLinks);
      // Update cache
      await AsyncStorage.setItem(`links_${user.id}`, JSON.stringify(updatedLinks));

      return { error: null };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
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

  // Load links when user changes
  useEffect(() => {
    if (user) {
      loadLinks();
    } else {
      setLinks([]);
      setError(null);
    }
  }, [user, loadLinks]);

  // Set up real-time subscription
  useEffect(() => {
    if (!user) return;

    const subscription = CloudSyncService.subscribeToLinks(user.id, (payload: any) => {
      console.log('Real-time link update:', payload);
      // Refresh links when changes occur
      loadLinks();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [user, loadLinks]);

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
    refreshLinks: loadLinks,
  };
};

// Custom hook for managing collections with cloud sync
export const useCollections = (): UseCollectionsReturn => {
  const { user } = useAuth();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState<boolean>(false);

  // Load collections from cache first, then sync with cloud
  const loadCollections = useCallback(async (): Promise<void> => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      // Load from cache first
      const cachedCollections = await AsyncStorage.getItem(`collections_${user.id}`);
      if (cachedCollections) {
        setCollections(JSON.parse(cachedCollections));
      }

      // Then sync with cloud
      setSyncing(true);
      const { data, error: syncError } = await CloudSyncService.syncCollections(user.id);
      
      if (syncError) {
        setError(syncError.message);
      } else if (data) {
        setCollections(data);
        // Cache the synced data
        await AsyncStorage.setItem(`collections_${user.id}`, JSON.stringify(data));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  }, [user]);

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
  const updateCollection = useCallback(async (collectionId: number, collectionData: Partial<Collection>): Promise<CloudSyncResult<Collection>> => {
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
  const deleteCollection = useCallback(async (collectionId: number): Promise<{ error: Error | null }> => {
    if (!user) throw new Error('User not authenticated');

    setError(null);
    try {
      const { error: deleteError } = await CloudSyncService.deleteCollection(collectionId, user.id);
      
      if (deleteError) {
        throw deleteError;
      }

      const updatedCollections = collections.filter(collection => collection.id !== collectionId);
      setCollections(updatedCollections);
      // Update cache
      await AsyncStorage.setItem(`collections_${user.id}`, JSON.stringify(updatedCollections));

      return { error: null };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
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

  // Load collections when user changes
  useEffect(() => {
    if (user) {
      loadCollections();
    } else {
      setCollections([]);
      setError(null);
    }
  }, [user, loadCollections]);

  // Set up real-time subscription
  useEffect(() => {
    if (!user) return;

    const subscription = CloudSyncService.subscribeToCollections(user.id, (payload: any) => {
      console.log('Real-time collection update:', payload);
      // Refresh collections when changes occur
      loadCollections();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [user, loadCollections]);

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
    refreshCollections: loadCollections,
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
            await CloudSyncService.updateLink(operation.id, operation.data, user.id);
            break;
          case 'DELETE_LINK':
            await CloudSyncService.deleteLink(operation.id, user.id);
            break;
          case 'CREATE_COLLECTION':
            await CloudSyncService.createCollection(operation.data, user.id);
            break;
          case 'UPDATE_COLLECTION':
            await CloudSyncService.updateCollection(operation.id, operation.data, user.id);
            break;
          case 'DELETE_COLLECTION':
            await CloudSyncService.deleteCollection(operation.id, user.id);
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