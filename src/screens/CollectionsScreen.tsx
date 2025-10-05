import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  TextInput,
  Animated,
  Dimensions,
  Platform,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { FlatList } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { useCollections, useLinks } from '../hooks/useCloudSync';
import { Collection, Link } from '../types';
import { supabase } from '../services/supabase';
import { AutoCollectionService } from '../services/autoCollectionService';
import { classifyContent } from '../services/aiService';


const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const isSmallScreen = SCREEN_WIDTH < 380;

interface CollectionsScreenProps {
  navigation: {
    navigate: (screen: string, params?: any) => void;
  };
}

interface MockCollection extends Collection {
  linkCount: number;
  icon: string;
  isPublic: boolean;
  category?: string;
}

export default function CollectionsScreen({ navigation }: CollectionsScreenProps): React.ReactElement {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showCreateForm, setShowCreateForm] = useState<boolean>(false);
  const [newCollectionName, setNewCollectionName] = useState<string>('');
  const [newCollectionDescription, setNewCollectionDescription] = useState<string>('');
  const [aiSuggestions, setAiSuggestions] = useState<{ name: string; description: string; category: string }[]>([]);
  const [smartCollections, setSmartCollections] = useState<MockCollection[]>([]);
  const [smartSuggestions, setSmartSuggestions] = useState<Array<{
    name: string;
    description: string;
    estimatedLinks: number;
    confidence: number;
    preview: string[];
  }>>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  const { user } = useAuth();
  const { links, getCategories } = useLinks();
  const { 
    collections, 
    loading: collectionsLoading, 
    error: collectionsError, 
    syncing, 
    createCollection, 
    deleteCollection,
    refreshCollections 
  } = useCollections();
  
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    initializeSmartCollections();
    
    // Enhanced animation sequence
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      })
    ]).start();
  }, [links]);

  // Load smart suggestions when no collections exist
  useEffect(() => {
    if (collections.length === 0 && !collectionsLoading && user?.id && !loadingSuggestions) {
      console.log('🧠 No collections found, loading smart suggestions...');
      
      const loadSuggestions = async () => {
        try {
          setLoadingSuggestions(true);
          const suggestions = await AutoCollectionService.getSmartCollectionSuggestions(user.id);
          setSmartSuggestions(suggestions);
          console.log('✅ Loaded smart suggestions:', suggestions.length);
        } catch (error) {
          console.error('❌ Error loading smart suggestions:', error);
        } finally {
          setLoadingSuggestions(false);
        }
      };
      
      loadSuggestions();
    }
  }, [collections.length, collectionsLoading, user?.id, loadingSuggestions]);

  const loadSmartSuggestions = useCallback(async (): Promise<void> => {
    if (!user?.id || loadingSuggestions) return;
    
    try {
      setLoadingSuggestions(true);
      console.log('🧠 Loading smart collection suggestions...');
      
      const suggestions = await AutoCollectionService.getSmartCollectionSuggestions(user.id);
      setSmartSuggestions(suggestions);
      
      console.log('✅ Loaded smart suggestions:', suggestions.length);
    } catch (error) {
      console.error('❌ Error loading smart suggestions:', error);
    } finally {
      setLoadingSuggestions(false);
    }
  }, [user?.id, loadingSuggestions]);

  const initializeSmartCollections = useCallback(async () => {
    generateSmartCollections();
    await generateAICollectionSuggestions();
    createSmartCollections();
  }, [links]);

  const generateAICollectionSuggestions = useCallback(async () => {
    try {
      // Analyze existing links to suggest new collections
      const categories = getCategories();
      const uncategorizedLinks = links.filter(link => !link.category || link.category === 'general');
      
      const suggestions = [
        {
          name: 'Learning Resources',
          description: 'Tutorials, courses, and educational content',
          category: 'education'
        },
        {
          name: 'Design Inspiration',
          description: 'UI/UX designs, color palettes, and creative ideas',
          category: 'design'
        },
        {
          name: 'Development Tools',
          description: 'Libraries, frameworks, and developer utilities',
          category: 'development'
        }
      ];

      // Add category-specific suggestions based on user's content
      if (uncategorizedLinks.length > 5) {
        suggestions.push({
          name: 'To Organize',
          description: `${uncategorizedLinks.length} links waiting to be categorized`,
          category: 'organization'
        });
      }

      setAiSuggestions(suggestions.slice(0, 3));
    } catch (error) {
      console.error('AI suggestion generation failed:', error);
    }
  }, [links, getCategories]);

  const createSmartCollections = useCallback(() => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const smartCollections: MockCollection[] = [
      {
        id: 'recent',
        name: 'Recent Additions',
        title: 'Recent Additions',
        description: 'Links added in the last week',
        linkCount: links.filter(link => new Date(link.created_at) > weekAgo).length,
        icon: 'time-outline',
        isPublic: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_id: 'current'
      },
      {
        id: 'favorites',
        name: 'Most Visited',
        title: 'Most Visited',
        description: 'Your frequently accessed links',
        linkCount: Math.floor(links.length * 0.2),
        icon: 'star-outline',
        isPublic: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_id: 'current'
      },
      {
        id: 'unorganized',
        name: 'To Organize',
        title: 'To Organize',
        description: 'Links without categories',
        linkCount: links.filter(link => !link.category || link.category === 'general').length,
        icon: 'folder-outline',
        isPublic: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_id: 'current'
      }
    ].filter(collection => collection.linkCount > 0);
    
    setSmartCollections(smartCollections);
  }, [links]);

  // This function now just generates smart collections
  const generateSmartCollections = () => {
    const categories = getCategories();
    const smartCollectionsFromData: MockCollection[] = categories.map((category, index) => {
      const categoryLinks = links.filter(link => link.category === category);
      const colors = ['#6366f1', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899'];
      const icons = ['grid', 'code-slash', 'color-palette', 'bulb', 'rocket', 'library', 'star'];
      
      // Generate more descriptive descriptions based on category
      const getDescription = (cat: string, count: number) => {
        switch (cat.toLowerCase()) {
          case 'development':
          case 'coding':
          case 'programming':
            return `${count} development resources and coding tutorials`;
          case 'design':
          case 'ui':
          case 'ux':
            return `${count} design inspiration and UI/UX resources`;
          case 'business':
          case 'work':
            return `${count} business tools and professional resources`;
          case 'learning':
          case 'education':
            return `${count} educational content and learning materials`;
          case 'entertainment':
          case 'fun':
            return `${count} entertainment and fun content`;
          case 'news':
          case 'articles':
            return `${count} news articles and reading materials`;
          default:
            return `${count} ${category} links and resources`;
        }
      };
      
      return {
        id: `category_${category}`,
        name: category.charAt(0).toUpperCase() + category.slice(1),
        description: getDescription(category, categoryLinks.length),
        linkCount: categoryLinks.length,
        color: colors[index % colors.length],
        icon: icons[index % icons.length],
        isPublic: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_id: '1',
        category: category, // Add category for easier filtering
      };
    }).filter(collection => collection.linkCount > 0); // Only show collections with links

    console.log(`📚 Generated ${smartCollectionsFromData.length} smart collections from categories`);
    setSmartCollections(smartCollectionsFromData);
  };

  const onRefresh = async (): Promise<void> => {
    setRefreshing(true);
    try {
      console.log('🔄 CollectionsScreen: Manual refresh triggered');
      console.log('📊 Current collections count:', collections.length);
      console.log('🔄 Calling refreshCollections...');
      await refreshCollections();
      console.log('📊 Collections after refresh:', collections.length);
      generateSmartCollections();
    } catch (error) {
      console.error('❌ Error refreshing collections:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Helper functions for smart suggestion cards
  const getCardBackgroundByIndex = (index: number): string => {
    const backgrounds = ['#ddd6fe', '#fce7f3', '#d1fae5', '#fef3c7'];
    return backgrounds[index % backgrounds.length];
  };

  const getCardColorByIndex = (index: number): string => {
    const colors = ['#6366f1', '#ec4899', '#10b981', '#f59e0b'];
    return colors[index % colors.length];
  };

  const getIconByCategory = (categoryName: string): any => {
    const iconMap: { [key: string]: string } = {
      'Learning Resources': 'school',
      'Design Inspiration': 'color-palette',
      'Development Tools': 'code-slash',
      'Reading List': 'library',
      'Work Resources': 'briefcase',
      'Entertainment': 'game-controller',
      'Social Media': 'people'
    };
    return iconMap[categoryName] || 'folder';
  };

  // Handlers
  const handleCreateCollection = (): void => {
    setShowCreateForm(true);
  };

  const handleSaveCollection = useCallback(async (): Promise<void> => {
    if (newCollectionName.trim()) {
      try {
        const { data, error } = await createCollection({
          name: newCollectionName.trim(),
          description: newCollectionDescription.trim() || generateSmartDescription(newCollectionName.trim()),
        });
        
        if (error) {
          throw error;
        }
        
        setNewCollectionName('');
        setNewCollectionDescription('');
        
        // Animate form closure
        Animated.timing(slideAnim, {
          toValue: 300,
          duration: 300,
          useNativeDriver: true,
        }).start(() => setShowCreateForm(false));
        
        Alert.alert('✨ Success', 'Collection created successfully!');
      } catch (error) {
        console.error('Error creating collection:', error);
        Alert.alert('Error', 'Failed to create collection');
      }
    }
  }, [newCollectionName, newCollectionDescription, slideAnim, createCollection]);

  const handleCreateAICollection = useCallback(async (): Promise<void> => {
    try {
      // Generate AI-powered collection suggestions based on user's links
      const categories = getCategories();
      const uncategorizedLinks = links.filter(link => !link.category || link.category === 'general');
      
      const aiCollections = [
        {
          name: 'Learning Resources',
          description: 'Curated educational content and tutorials for skill development',
          suggested: true
        },
        {
          name: 'Design Inspiration',
          description: 'Creative designs, UI/UX patterns, and visual inspiration',
          suggested: true
        },
        {
          name: 'Development Tools',
          description: 'Programming resources, libraries, and developer utilities',
          suggested: true
        },
        {
          name: 'Reading List',
          description: 'Articles, blogs, and long-form content for later reading',
          suggested: true
        },
        {
          name: 'Quick Reference',
          description: 'Documentation, cheat sheets, and reference materials',
          suggested: true
        }
      ];

      // Add category-specific suggestions
      if (uncategorizedLinks.length > 3) {
        aiCollections.push({
          name: 'To Organize',
          description: `${uncategorizedLinks.length} uncategorized links ready for organization`,
          suggested: true
        });
      }

      // Show selection dialog
      Alert.alert(
        '🤖 AI Collection Suggestions',
        'Choose a collection to create based on your content:',
        [
          { text: 'Cancel', style: 'cancel' },
          ...aiCollections.slice(0, 4).map(collection => ({
            text: collection.name,
            onPress: async () => {
              try {
                console.log('🤖 Creating AI-suggested collection:', collection);
                const { data, error } = await createCollection({
                  name: collection.name,
                  description: collection.description,
                });
                
                if (error) {
                  throw error;
                }
                
                Alert.alert('✨ AI Success', `Created "${collection.name}" collection with AI assistance!`);
              } catch (error) {
                console.error('❌ Error creating AI collection:', error);
                Alert.alert('Error', 'Failed to create AI collection');
              }
            }
          }))
        ]
      );
    } catch (error) {
      console.error('❌ Error generating AI collections:', error);
      Alert.alert('Error', 'Failed to generate AI collection suggestions');
    }
  }, [links, getCategories, createCollection]);

  const handleAISuggestionPress = useCallback(async (suggestion: {
    name: string;
    description: string;
    category: string;
  }): Promise<void> => {
    try {
      console.log('🎯 Creating AI suggested collection:', suggestion);
      const { data, error } = await createCollection({
        name: suggestion.name,
        description: suggestion.description,
      });
      
      if (error) {
        throw error;
      }
      
      Alert.alert('✨ Collection Created', `"${suggestion.name}" collection created successfully!`);
    } catch (error) {
      console.error('❌ Error creating AI suggestion collection:', error);
      Alert.alert('Error', 'Failed to create collection');
    }
  }, [createCollection]);

  const generateSmartDescription = useCallback((name: string): string => {
    const keywords = name.toLowerCase();
    
    if (keywords.includes('learn') || keywords.includes('tutorial')) {
      return 'Educational resources and learning materials';
    } else if (keywords.includes('design') || keywords.includes('ui')) {
      return 'Design inspiration and creative resources';
    } else if (keywords.includes('code') || keywords.includes('dev')) {
      return 'Development tools and programming resources';
    } else if (keywords.includes('read') || keywords.includes('article')) {
      return 'Articles and reading materials';
    } else {
      return `A curated collection of ${name.toLowerCase()} resources`;
    }
  }, []);

  // Convert real collections to display format
  const convertToDisplayCollection = useCallback((collection: Collection): MockCollection => {
    const icons = ['folder', 'bookmark', 'star', 'heart', 'library', 'archive', 'grid'];
    const colors = ['#6366f1', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899'];
    
    // Calculate link count for this collection (for now, just use 0)
    const linkCount = 0; // TODO: Get actual link count from collection_links table
    
    return {
      ...collection,
      linkCount,
      icon: icons[Math.abs(collection.name.length) % icons.length],
      color: colors[Math.abs(collection.name.length) % colors.length],
      isPublic: false,
    };
  }, []);

  const displayCollections = collections.map(convertToDisplayCollection);
  
  const filteredCollections = displayCollections.filter(collection =>
    collection.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (collection.description && collection.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleCollectionPress = (collection: MockCollection): void => {
    // Get real links for this collection/category
    const collectionLinks = links.filter(link => {
      // If collection name matches a category, filter by category
      const categoryName = collection.name.toLowerCase();
      return link.category?.toLowerCase() === categoryName;
    });

    // Create collection object with real data
    const collectionWithRealData = {
      ...collection,
      // Add real link count
      linkCount: collectionLinks.length,
      // Pass the actual links
      links: collectionLinks,
      // Add category for filtering
      category: collection.name.toLowerCase(),
    };

    console.log(`🔗 Opening collection "${collection.name}" with ${collectionLinks.length} real links`);
    navigation.navigate('CollectionDetail', { 
      collection: collectionWithRealData,
      links: collectionLinks // Pass links directly as well
    });
  };

  const handleDeleteCollection = useCallback(async (collection: MockCollection): Promise<void> => {
    Alert.alert(
      'Delete Collection',
      `Are you sure you want to delete "${collection.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await deleteCollection(collection.id);
              if (error) {
                throw error;
              }
              Alert.alert('Success', 'Collection deleted successfully');
            } catch (error) {
              console.error('Error deleting collection:', error);
              Alert.alert('Error', 'Failed to delete collection');
            }
          }
        }
      ]
    );
  }, [deleteCollection]);

  const renderCollection = ({ item }: { item: MockCollection }): React.ReactElement => (
    <View key={item.id} style={styles.collectionCard}>
      <TouchableOpacity
        style={styles.collectionContent}
        onPress={() => handleCollectionPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.collectionHeader}>
          <LinearGradient
            colors={[item.color || '#6366f1', (item.color || '#6366f1') + '80']}
            style={styles.iconContainer}
          >
            <Ionicons name={item.icon as any} size={20} color="white" />
          </LinearGradient>
          
          <View style={styles.collectionInfo}>
            <Text style={styles.collectionName} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={styles.collectionDescription} numberOfLines={2}>
              {item.description || 'No description'}
            </Text>
          </View>
          
          <View style={styles.linkCountBadge}>
            <Text style={styles.linkCount}>{item.linkCount}</Text>
          </View>
        </View>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeleteCollection(item)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="trash-outline" size={18} color="#ef4444" />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Mobile-Optimized Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Collections</Text>
          <View style={styles.headerButtons}>
            <TouchableOpacity onPress={handleCreateAICollection} style={styles.aiButton}>
              <Ionicons name="sparkles" size={18} color="white" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleCreateCollection} style={styles.addButton}>
              <Ionicons name="add" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#9ca3af" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search collections..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9ca3af"
          />
        </View>
      </View>

      {/* Create Collection Form */}
      {showCreateForm && (
        <Animated.View style={[styles.createForm, { opacity: fadeAnim }]}>
          <View style={styles.formHeader}>
            <Text style={styles.formTitle}>New Collection</Text>
            <TouchableOpacity onPress={() => setShowCreateForm(false)}>
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.formInput}
            placeholder="Collection name"
            value={newCollectionName}
            onChangeText={setNewCollectionName}
            autoFocus
          />
          <TextInput
            style={[styles.formInput, styles.textArea]}
            placeholder="Description (optional)"
            value={newCollectionDescription}
            onChangeText={setNewCollectionDescription}
            multiline
            numberOfLines={3}
          />
          <View style={styles.formActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowCreateForm(false)}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSaveCollection}
            >
              <Text style={styles.saveText}>Create</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Collections List */}
        {filteredCollections.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="folder-outline" size={48} color="#d1d5db" />
            <Text style={styles.emptyStateTitle}>
              {searchQuery ? 'No collections found' : 'No collections yet'}
            </Text>
            <Text style={styles.emptyStateText}>
              {searchQuery 
                ? 'Try adjusting your search terms'
                : 'Create your first collection to organize your links'
              }
            </Text>
            {!searchQuery && (
              <View style={styles.emptyStateActions}>
                <TouchableOpacity
                  style={styles.emptyStateButton}
                  onPress={handleCreateCollection}
                >
                  <Text style={styles.emptyStateButtonText}>Create Collection</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.aiSuggestionButton}
                  onPress={handleCreateAICollection}
                >
                  <Ionicons name="sparkles" size={16} color="white" />
                  <Text style={styles.aiSuggestionButtonText}>AI Suggestions</Text>
                </TouchableOpacity>
              </View>
            )}
            
            {!searchQuery && filteredCollections.length === 0 && (
              <View style={styles.aiSuggestionCards}>
                <Text style={styles.suggestionTitle}>
                  {smartSuggestions.length > 0 ? '� Smart Suggestions for You' : '�🤖 AI Suggestions'}
                </Text>
                
                <View style={styles.suggestionContent}>
                  {loadingSuggestions ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="large" color="#8b5cf6" />
                      <Text style={styles.loadingText}>Analyzing your links...</Text>
                    </View>
                  ) : smartSuggestions.length > 0 ? (
                  <View style={styles.suggestionGrid}>
                    {smartSuggestions.slice(0, 4).map((suggestion, index) => (
                      <TouchableOpacity 
                        key={index}
                        style={[styles.suggestionCard, styles.smartCard]}
                        onPress={() => handleAISuggestionPress({
                          name: suggestion.name,
                          description: suggestion.description,
                          category: suggestion.name.toLowerCase().replace(' ', '_')
                        })}
                      >
                        <View style={[styles.iconContainer, { backgroundColor: getCardBackgroundByIndex(index) }]}>
                          <Ionicons name={getIconByCategory(suggestion.name)} size={24} color={getCardColorByIndex(index)} />
                        </View>
                        <Text style={styles.suggestionName}>{suggestion.name}</Text>
                        <Text style={styles.suggestionDesc}>{suggestion.estimatedLinks} links ready</Text>
                        <View style={styles.confidenceBadge}>
                          <Text style={styles.confidenceText}>{Math.round(suggestion.confidence * 100)}%</Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : (
                  <View style={styles.suggestionGrid}>
                    <TouchableOpacity 
                      style={[styles.suggestionCard, styles.learningCard]}
                      onPress={() => handleAISuggestionPress({
                        name: 'Learning Resources', 
                        description: 'Educational content and tutorials',
                        category: 'education'
                      })}
                    >
                      <View style={[styles.iconContainer, { backgroundColor: '#ddd6fe' }]}>
                        <Ionicons name="school" size={24} color="#6366f1" />
                      </View>
                      <Text style={styles.suggestionName}>Learning Resources</Text>
                      <Text style={styles.suggestionDesc}>Educational content</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={styles.suggestionCard}
                      onPress={() => handleAISuggestionPress({
                        name: 'Design Inspiration', 
                        description: 'UI/UX designs and creative ideas',
                        category: 'design'
                      })}
                    >
                      <View style={[styles.iconContainer, { backgroundColor: '#fce7f3' }]}>
                        <Ionicons name="color-palette" size={24} color="#ec4899" />
                      </View>
                      <Text style={styles.suggestionName}>Design Inspiration</Text>
                      <Text style={styles.suggestionDesc}>UI/UX designs</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={styles.suggestionCard}
                      onPress={() => handleAISuggestionPress({
                        name: 'Development Tools', 
                        description: 'Programming resources and utilities',
                        category: 'development'
                      })}
                    >
                      <View style={[styles.iconContainer, { backgroundColor: '#d1fae5' }]}>
                        <Ionicons name="code-slash" size={24} color="#10b981" />
                      </View>
                      <Text style={styles.suggestionName}>Dev Tools</Text>
                      <Text style={styles.suggestionDesc}>Programming resources</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={styles.suggestionCard}
                      onPress={() => handleAISuggestionPress({
                        name: 'Reading List', 
                        description: 'Articles and long-form content',
                        category: 'reading'
                      })}
                    >
                      <View style={[styles.iconContainer, { backgroundColor: '#fef3c7' }]}>
                        <Ionicons name="library" size={24} color="#f59e0b" />
                      </View>
                      <Text style={styles.suggestionName}>Reading List</Text>
                      <Text style={styles.suggestionDesc}>Articles & blogs</Text>
                    </TouchableOpacity>
                  </View>
                )}
                </View>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.collectionsContainer}>
            {filteredCollections.map((collection) => (
              <View key={collection.id}>
                {renderCollection({ item: collection })}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 0 : 20,
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: isSmallScreen ? 24 : 28,
    fontWeight: '700',
    color: '#1e293b',
    letterSpacing: -0.5,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#6366f1',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  aiButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#8b5cf6',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#8b5cf6',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: isSmallScreen ? 10 : 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchInput: {
    flex: 1,
    fontSize: isSmallScreen ? 14 : 16,
    color: '#1e293b',
    marginLeft: 10,
    paddingVertical: Platform.OS === 'ios' ? 4 : 0,
  },
  createForm: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: isSmallScreen ? 10 : 12,
    fontSize: isSmallScreen ? 14 : 16,
    marginBottom: 12,
    backgroundColor: '#f8fafc',
    color: '#1e293b',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  cancelText: {
    color: '#64748b',
    fontSize: 16,
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 120, // Extra padding for bottom navigation
  },
  collectionsContainer: {
    flexDirection: 'column',
    gap: 12,
  },
  collectionCard: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    flexDirection: 'row',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  collectionContent: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  deleteButton: {
    padding: 12,
    marginRight: 8,
  },
  collectionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  collectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  linkCount: {
    fontSize: 11,
    color: '#6366f1',
    fontWeight: '600',
  },
  linkCountBadge: {
    backgroundColor: '#f0f7ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0f2fe',
    minWidth: 32,
    alignItems: 'center',
  },
  collectionInfo: {
    flex: 1,
    marginRight: 12,
  },
  collectionName: {
    fontSize: isSmallScreen ? 15 : 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 2,
  },
  collectionDescription: {
    fontSize: isSmallScreen ? 12 : 13,
    color: '#64748b',
    lineHeight: isSmallScreen ? 16 : 18,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: isSmallScreen ? 50 : 80,
    paddingHorizontal: 32,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    marginHorizontal: 20,
    marginVertical: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#64748b',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
    minHeight: 300,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    marginTop: 20,
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  emptyStateText: {
    fontSize: 17,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 32,
    paddingHorizontal: 16,
    fontWeight: '400',
  },
  emptyStateButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
    flex: 1,
    alignItems: 'center',
    shadowColor: '#6366f1',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  emptyStateButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  emptyStateActions: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 20,
    paddingHorizontal: 8,
  },
  aiSuggestionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    flex: 1,
    justifyContent: 'center',
    shadowColor: '#8b5cf6',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  aiSuggestionButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  aiSuggestionCards: {
    marginTop: 40,
    marginBottom: 20,
    paddingHorizontal: 24,
  },
  suggestionHeader: {
    marginBottom: 24,
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(139, 92, 246, 0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.1)',
  },
  suggestionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 6,
    textAlign: 'center',
  },
  suggestionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    fontWeight: '500',
  },
  suggestionContent: {
    minHeight: 200,
  },
  suggestionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  suggestionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    width: '47%',
    minHeight: 140,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 2,
    borderColor: '#f3f4f6',
    transform: [{ scale: 1 }],
    marginBottom: 16,
  },
  suggestionName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1f2937',
    marginTop: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  suggestionDesc: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 6,
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 16,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  learningCard: {
    borderLeftWidth: 3,
    borderLeftColor: '#6366f1',
  },
  loadingContainer: {
    padding: 60,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(139, 92, 246, 0.02)',
    borderRadius: 20,
    marginVertical: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
    color: '#6b7280',
    textAlign: 'center',
    fontWeight: '500',
  },
  smartCard: {
    borderWidth: 2,
    borderColor: '#e5e7eb',
    position: 'relative',
  },
  confidenceBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#10b981',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  confidenceText: {
    fontSize: 11,
    fontWeight: '700',
    color: 'white',
    letterSpacing: 0.5,
  },
});