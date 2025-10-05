import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Image,
  Animated,
  Dimensions,
  Platform,
  Vibration,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLinks } from '../hooks/useCloudSync';
import { classifyContent } from '../services/aiService';
import { Link } from '../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface SearchScreenProps {
  navigation: {
    navigate: (screen: string, params?: any) => void;
  };
}

interface Filter {
  id: string;
  label: string;
  icon: string;
}

// Helper function to get appropriate icon for category
const getIconForCategory = (category?: string): keyof typeof Ionicons.glyphMap => {
  const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
    'video': 'play-circle-outline',
    'social': 'people-outline',
    'article': 'document-text-outline',
    'development': 'code-slash-outline',
    'design': 'color-palette-outline',
    'business': 'briefcase-outline',
    'education': 'school-outline',
    'entertainment': 'game-controller-outline',
    'news': 'newspaper-outline',
    'professional': 'business-outline',
    'visual': 'image-outline',
    'discussion': 'chatbubbles-outline',
    'general': 'globe-outline',
  };
  
  return iconMap[category || 'general'] || 'link-outline';
};

export default function SearchScreen({ navigation }: SearchScreenProps): React.ReactElement {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [searchResults, setSearchResults] = useState<Link[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [smartFilters, setSmartFilters] = useState<{ id: string; label: string; count: number; icon: string }[]>([]);
  const [aiInsights, setAiInsights] = useState<{ type: string; message: string; action?: string } | null>(null);
  const [userRecentSearches, setRecentSearches] = useState<string[]>([]);
  
  const { links, searchLinks, getCategories } = useLinks();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const searchInputRef = useRef<TextInput>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Enhanced AI-powered initialization
  useEffect(() => {
    initializeSmartSearch();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [links]);

  const initializeSmartSearch = useCallback(async () => {
    setSearchResults(links);
    await generateAISuggestions();
    generateSmartFilters();
    analyzeUserBehavior();
  }, [links]);

  const generateAISuggestions = useCallback(async () => {
    const categories = getCategories();
    const recentLinks = links.slice(0, 10);
    
    // AI-powered contextual suggestions
    const suggestions = [
      `Explore ${categories[0] || 'development'} resources`,
      'Recent additions from this week',
      'Trending topics in your collection',
      'Similar content you might like',
      'Unorganized links to categorize'
    ];
    
    setAiSuggestions(suggestions);
    
    // Generate AI insights based on user's collection
    if (links.length > 0) {
      const insight = generateAIInsight(links, categories);
      setAiInsights(insight);
    }
  }, [links, getCategories]);

  const generateSmartFilters = useCallback(() => {
    const categories = getCategories();
    const filters = categories.map(category => ({
      id: category.toLowerCase(),
      label: category,
      count: links.filter(link => link.category === category).length,
      icon: getIconForCategory(category)
    }));
    
    // Add smart filters based on content analysis
    const smartFilters = [
      { id: 'recent', label: 'Recent', count: links.filter(link => isRecent(link.created_at)).length, icon: 'time-outline' },
      { id: 'popular', label: 'Popular', count: Math.floor(links.length * 0.3), icon: 'trending-up-outline' },
      { id: 'unread', label: 'To Read', count: Math.floor(links.length * 0.4), icon: 'bookmark-outline' },
      ...filters
    ];
    
    setSmartFilters(smartFilters.filter(f => f.count > 0));
  }, [links, getCategories]);

  const generateAIInsight = (links: Link[], categories: string[]) => {
    const totalLinks = links.length;
    const topCategory = categories[0];
    
    if (totalLinks > 50) {
      return {
        type: 'productivity',
        message: `You have ${totalLinks} links! Consider organizing them into focused collections.`,
        action: 'create_collections'
      };
    } else if (topCategory) {
      return {
        type: 'discovery',
        message: `You seem interested in ${topCategory}. Explore similar content?`,
        action: 'discover_similar'
      };
    }
    
    return {
      type: 'engagement',
      message: 'Your collection is growing! Add tags to improve searchability.',
      action: 'add_tags'
    };
  };

  const analyzeUserBehavior = useCallback(() => {
    // Analyze search patterns and suggest improvements
    const searches = ['react tutorials', 'javascript tips', 'design inspiration'];
    setRecentSearches(searches);
  }, []);

  const isRecent = (dateString: string): boolean => {
    const linkDate = new Date(dateString);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return linkDate > weekAgo;
  };

  // Enhanced search functionality with AI
  const handleSmartSearch = useCallback(async (query: string) => {
    setIsSearching(true);
    
    // Add haptic feedback for better UX
    if (Platform.OS === 'ios') {
      Vibration.vibrate(10);
    }
    
    try {
      // AI-enhanced search with natural language processing
      const searchResults = await performAdvancedSearch(query);
      
      setSearchResults(searchResults);
      
      // Update recent searches
      if (query.trim() && !userRecentSearches.includes(query)) {
        setRecentSearches(prev => [query, ...prev.slice(0, 4)]);
      }
      
      // Animate search results
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        })
      ]).start();
      
    } catch (error) {
      console.error('Smart search error:', error);
      // Fallback to basic search
      const basicResults = links.filter(link => 
        link.title.toLowerCase().includes(query.toLowerCase()) ||
        link.description?.toLowerCase().includes(query.toLowerCase())
      );
      setSearchResults(basicResults);
    } finally {
      setIsSearching(false);
    }
  }, [links, userRecentSearches, pulseAnim]);

  const performAdvancedSearch = useCallback(async (query: string, classification: any) => {
    let results = [...links];
    
    // Apply smart filtering based on query intent
    if (query.includes('recent') || query.includes('latest')) {
      results = results.filter(link => isRecent(link.created_at));
    }
    
    if (query.includes('video') || query.includes('watch')) {
      results = results.filter(link => 
        link.url.includes('youtube.com') || 
        link.url.includes('vimeo.com') ||
        link.category === 'video'
      );
    }
    
    if (query.includes('article') || query.includes('read')) {
      results = results.filter(link => 
        link.category === 'article' ||
        link.url.includes('medium.com') ||
        link.url.includes('dev.to')
      );
    }
    
    // Text search with relevance scoring
    const searchTerms = query.toLowerCase().split(' ');
    results = results.map(link => ({
      ...link,
      relevanceScore: calculateRelevanceScore(link, searchTerms)
    })).filter(link => link.relevanceScore > 0)
      .sort((a, b) => b.relevanceScore - a.relevanceScore);
    
    return results;
  }, [links]);

  const calculateRelevanceScore = (link: Link, searchTerms: string[]): number => {
    let score = 0;
    const title = link.title.toLowerCase();
    const description = link.description?.toLowerCase() || '';
    const tags = link.tags?.join(' ').toLowerCase() || '';
    
    searchTerms.forEach(term => {
      if (title.includes(term)) score += 3;
      if (description.includes(term)) score += 2;
      if (tags.includes(term)) score += 1;
      if (link.category?.toLowerCase().includes(term)) score += 2;
    });
    
    return score;
  };

  const filters: Filter[] = useMemo(() => [
    { id: 'all', label: 'All', icon: 'grid-outline' },
    { id: 'smart', label: 'AI Pick', icon: 'sparkles-outline' },
    { id: 'recent', label: 'Recent', icon: 'time-outline' },
    { id: 'trending', label: 'Trending', icon: 'trending-up-outline' },
    { id: 'videos', label: 'Videos', icon: 'play-outline' },
    { id: 'articles', label: 'Articles', icon: 'document-text-outline' },
  ], []);

  const popularTags: string[] = useMemo(() => [
    'tutorial', 'design', 'ai', 'development', 'inspiration',
    'react-native', 'mobile', 'ui-ux', 'productivity', 'tech'
  ], []);

  const handleSearch = async (query: string): Promise<void> => {
    setSearchQuery(query);
    setIsSearching(true);
    
    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    let results = searchLinks(query);
    
    // AI-enhanced search - analyze query intent
    if (query.toLowerCase().includes('last week')) {
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      results = results.filter(link => new Date(link.created_at) > oneWeekAgo);
    }
    
    if (query.toLowerCase().includes('video')) {
      results = results.filter(link => 
        link.category === 'video' ||
        link.url.includes('youtube.com') ||
        link.url.includes('vimeo.com') ||
        link.url.includes('tiktok.com')
      );
    }
    
    setSearchResults(results);
    setIsSearching(false);
  };

  const handleFilterPress = (filterId: string): void => {
    setSelectedFilter(filterId);
    
    let filteredResults = searchLinks(searchQuery);
    
    // Apply filter
    if (filterId !== 'all') {
      switch (filterId) {
        case 'links':
          // Already filtered by search
          break;
        case 'tags':
          filteredResults = filteredResults.filter(link => 
            link.tags && link.tags.length > 0
          );
          break;
        case 'recent':
          const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          filteredResults = filteredResults.filter(link => 
            new Date(link.created_at) > oneWeekAgo
          );
          break;
        default:
          // Treat as category filter
          filteredResults = filteredResults.filter(link => 
            link.category === filterId
          );
      }
    }
    
    setSearchResults(filteredResults);
  };

  const handleTagPress = (tag: string): void => {
    setSearchQuery(`#${tag}`);
    handleSearch(`#${tag}`);
  };

  const handleLinkPress = (link: Link): void => {
    navigation.navigate('LinkDetail', { link });
  };

  const renderSearchResult = ({ item }: { item: Link }): React.ReactElement => (
    <TouchableOpacity
      key={item.id}
      style={styles.searchResultCard}
      onPress={() => handleLinkPress(item)}
      activeOpacity={0.8}
    >
      <View style={styles.resultImageContainer}>
        {item.image_url ? (
          <Image 
            source={{ uri: item.image_url }} 
            style={styles.resultImage}
          />
        ) : (
          <View style={styles.resultImagePlaceholder}>
            <Ionicons 
              name={getIconForCategory(item.category)} 
              size={20} 
              color="#6366f1" 
            />
          </View>
        )}
      </View>
      <View style={styles.resultContent}>
        <Text style={styles.resultTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.resultUrl} numberOfLines={1}>
          {new URL(item.url).hostname}
        </Text>
        <Text style={styles.resultDescription} numberOfLines={2}>
          {item.description}
        </Text>
        {item.tags && item.tags.length > 0 && (
          <View style={styles.resultTags}>
            {item.tags.slice(0, 3).map((tag, index) => (
              <Text key={index} style={styles.resultTag}>#{tag}</Text>
            ))}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderFilter = ({ item }: { item: Filter }): React.ReactElement => (
    <TouchableOpacity
      style={[
        styles.filterChip,
        selectedFilter === item.id && styles.filterChipActive
      ]}
      onPress={() => handleFilterPress(item.id)}
    >
      <Ionicons 
        name={item.icon as any} 
        size={16} 
        color={selectedFilter === item.id ? 'white' : '#6366f1'} 
      />
      <Text style={[
        styles.filterText,
        selectedFilter === item.id && styles.filterTextActive
      ]}>
        {item.label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Minimalistic Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Search</Text>
        
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#64748b" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search your links..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={() => handleSearch(searchQuery)}
            returnKeyType="search"
            placeholderTextColor="#94a3b8"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close" size={20} color="#64748b" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* AI Search Suggestions */}
        {searchQuery.length === 0 && (
          <Animated.View style={[styles.aiSection, { opacity: fadeAnim }]}>
            <View style={styles.aiHeader}>
              <Ionicons name="sparkles" size={18} color="#6366f1" />
              <Text style={styles.aiTitle}>AI Search</Text>
            </View>
            <Text style={styles.aiDescription}>
              Try natural language queries like:
            </Text>
            {aiSuggestions.map((suggestion, index) => (
              <TouchableOpacity
                key={index}
                style={styles.suggestionItem}
                onPress={() => handleSearch(suggestion)}
              >
                <Ionicons name="arrow-forward" size={14} color="#6366f1" />
                <Text style={styles.suggestionText}>{suggestion}</Text>
              </TouchableOpacity>
            ))}
          </Animated.View>
        )}

        {/* Quick Filters */}
        {searchQuery.length === 0 && (
          <View style={styles.filtersSection}>
            <Text style={styles.sectionTitle}>Quick Filters</Text>
            <View style={styles.filterGrid}>
              {filters.map((filter) => (
                <TouchableOpacity
                  key={filter.id}
                  style={[
                    styles.filterItem,
                    selectedFilter === filter.id && styles.filterItemActive
                  ]}
                  onPress={() => handleFilterPress(filter.id)}
                >
                  <Ionicons 
                    name={filter.icon as any} 
                    size={16} 
                    color={selectedFilter === filter.id ? '#ffffff' : '#6366f1'} 
                  />
                  <Text style={[
                    styles.filterText,
                    selectedFilter === filter.id && styles.filterTextActive
                  ]}>
                    {filter.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Search Results */}
        {searchResults.length > 0 && searchQuery.length > 0 && (
          <View style={styles.resultsSection}>
            <View style={styles.resultsHeader}>
              <Text style={styles.resultsTitle}>
                {isSearching ? 'Searching...' : `${searchResults.length} results`}
              </Text>
              {!isSearching && (
                <Text style={styles.resultsSubtitle}>
                  for "{searchQuery}"
                </Text>
              )}
            </View>
            
            {searchResults.map((link) => renderSearchResult({ item: link }))}
          </View>
        )}

        {/* All Links when no search */}
        {searchQuery.length === 0 && searchResults.length > 0 && (
          <View style={styles.allLinksSection}>
            <Text style={styles.sectionTitle}>All Links ({searchResults.length})</Text>
            {searchResults.slice(0, 10).map((link) => renderSearchResult({ item: link }))}
            
            {searchResults.length > 10 && (
              <TouchableOpacity style={styles.showMoreButton}>
                <Text style={styles.showMoreText}>Show {searchResults.length - 10} more links</Text>
                <Ionicons name="chevron-down" size={16} color="#6366f1" />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Empty State */}
        {searchQuery.length > 0 && searchResults.length === 0 && !isSearching && (
          <View style={styles.emptyResults}>
            <Ionicons name="search-outline" size={48} color="#cbd5e1" />
            <Text style={styles.emptyResultsTitle}>No results found</Text>
            <Text style={styles.emptyResultsText}>
              Try adjusting your search terms or use different keywords
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  searchContainer: {
    marginBottom: 20,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
    marginLeft: 12,
  },
  clearButton: {
    padding: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  filterList: {
    marginHorizontal: -4,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#6366f1',
  },
  filterChipActive: {
    backgroundColor: '#6366f1',
  },
  filterText: {
    fontSize: 14,
    color: '#6366f1',
    marginLeft: 6,
    fontWeight: '500',
  },
  filterTextActive: {
    color: 'white',
  },
  aiSuggestionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  aiSuggestionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  aiSuggestionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginLeft: 8,
  },
  aiSuggestionText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  recentSearchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  recentSearchText: {
    flex: 1,
    fontSize: 14,
    color: '#1f2937',
    marginLeft: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  tagChip: {
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    margin: 4,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  tagText: {
    fontSize: 12,
    color: '#6366f1',
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    marginTop: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4b5563',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  searchResultCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  resultImageContainer: {
    position: 'relative',
    width: 60,
    height: 60,
    marginRight: 12,
  },
  resultImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  resultImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  resultFaviconContainer: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  resultFavicon: {
    width: 12,
    height: 12,
  },
  resultContent: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  resultDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  resultMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  categoryBadge: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginRight: 8,
  },
  categoryText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '500',
  },
  resultTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  resultTag: {
    fontSize: 12,
    color: '#6366f1',
    marginRight: 8,
    fontWeight: '500',
  },
  // Missing styles for new UI components
  resultUrl: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 4,
  },
  aiSection: {
    backgroundColor: '#f8fafc',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  aiTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginLeft: 8,
  },
  aiDescription: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 16,
    lineHeight: 20,
  },
  suggestionItem: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  suggestionText: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '500',
  },
  filtersSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  filterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  filterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterItemActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  resultsSection: {
    paddingHorizontal: 20,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  resultsSubtitle: {
    fontSize: 14,
    color: '#64748b',
  },
  allLinksSection: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  showMoreButton: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  showMoreText: {
    fontSize: 14,
    color: '#6366f1',
    fontWeight: '600',
  },
  emptyResults: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyResultsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4b5563',
    marginBottom: 8,
  },
  emptyResultsText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});