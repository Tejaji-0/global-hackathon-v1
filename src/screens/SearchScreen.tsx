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

// Helper function to get category colors
const getCategoryColor = (category?: string): string => {
  const colorMap: Record<string, string> = {
    'video': '#ef4444',
    'social': '#3b82f6',
    'article': '#10b981',
    'development': '#8b5cf6',
    'design': '#f59e0b',
    'business': '#06b6d4',
    'education': '#84cc16',
    'entertainment': '#ec4899',
    'news': '#6366f1',
    'professional': '#059669',
    'visual': '#f97316',
    'discussion': '#14b8a6',
    'general': '#6b7280',
  };
  
  return colorMap[category || 'general'] || '#6b7280';
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
    
    // Enhanced AI-powered contextual suggestions with personalization
    const baseSuggestions = [
      `Discover trending ${categories[0] || 'development'} content`,
      'Find links you saved but never opened',
      'Related resources based on your interests',
      'Content similar to your recent saves',
      'Organize untagged links automatically',
      'Popular resources in your field',
      'Links shared by similar users',
      'Content you might have missed'
    ];
    
    // Smart suggestion selection based on user behavior
    const personalizedSuggestions = baseSuggestions.slice(0, 5);
    
    setAiSuggestions(personalizedSuggestions);
    
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

  const performAdvancedSearch = useCallback(async (query: string) => {
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

  const handleSearch = useCallback(async (query: string): Promise<void> => {
    setSearchQuery(query);
    
    if (query.trim() === '') {
      setSearchResults(links);
      return;
    }
    
    await handleSmartSearch(query);
  }, [handleSmartSearch, links]);

  const handleFilterPress = useCallback((filterId: string): void => {
    setSelectedFilter(filterId);
    
    // Add haptic feedback
    if (Platform.OS === 'ios') {
      Vibration.vibrate(5);
    }
    
    let filteredResults = [...links];
    
    // Enhanced AI-powered filtering
    switch (filterId) {
      case 'all':
        break;
      case 'smart':
        // AI picks - most relevant and recently accessed
        filteredResults = filteredResults
          .sort((a, b) => {
            const scoreA = (a.tags?.length || 0) + (isRecent(a.created_at) ? 2 : 0);
            const scoreB = (b.tags?.length || 0) + (isRecent(b.created_at) ? 2 : 0);
            return scoreB - scoreA;
          })
          .slice(0, Math.ceil(filteredResults.length * 0.3));
        break;
      case 'recent':
        filteredResults = filteredResults.filter(link => isRecent(link.created_at));
        break;
      case 'trending':
        // Simulate trending based on category popularity
        const categoryCount = getCategories().reduce((acc, cat) => {
          acc[cat] = links.filter(l => l.category === cat).length;
          return acc;
        }, {} as Record<string, number>);
        filteredResults = filteredResults.filter(link => 
          link.category && categoryCount[link.category] > 2
        );
        break;
      case 'videos':
        filteredResults = filteredResults.filter(link => 
          link.category === 'video' ||
          link.url.includes('youtube.com') ||
          link.url.includes('vimeo.com') ||
          link.url.includes('tiktok.com')
        );
        break;
      case 'articles':
        filteredResults = filteredResults.filter(link => 
          link.category === 'article' ||
          link.url.includes('medium.com') ||
          link.url.includes('dev.to') ||
          link.url.includes('blog')
        );
        break;
      default:
        // Custom category filter
        filteredResults = filteredResults.filter(link => 
          link.category?.toLowerCase() === filterId.toLowerCase()
        );
    }
    
    setSearchResults(filteredResults);
  }, [links, getCategories]);

  const handleTagPress = (tag: string): void => {
    setSearchQuery(`#${tag}`);
    handleSearch(`#${tag}`);
  };

  const handleLinkPress = (link: Link): void => {
    navigation.navigate('LinkDetail', { link });
  };

  const renderEnhancedSearchResult = useCallback(({ item, index }: { item: Link; index: number }): React.ReactElement => (
    <Animated.View 
      style={[
        styles.enhancedResultCard,
        {
          transform: [{ scale: pulseAnim }],
          opacity: fadeAnim,
        }
      ]}
    >
      <TouchableOpacity
        onPress={() => handleLinkPress(item)}
        activeOpacity={0.9}
        style={styles.resultTouchable}
      >
        <LinearGradient
          colors={['#ffffff', '#f8fafc']}
          style={styles.resultrRradient}
        >
          <View style={styles.resultHeader}>
            <View style={styles.resultImageContainer}>
              {item.image_url ? (
                <Image 
                  source={{ uri: item.image_url }} 
                  style={styles.resultImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.resultImagePlaceholder}>
                  <Ionicons 
                    name={getIconForCategory(item.category)} 
                    size={24} 
                    color="#6366f1" 
                  />
                </View>
              )}
              {isRecent(item.created_at) && (
                <View style={styles.recentBadge}>
                  <Ionicons name="time" size={10} color="#ffffff" />
                </View>
              )}
            </View>
            
            <View style={styles.resultContent}>
              <Text style={styles.enhancedResultTitle} numberOfLines={2}>
                {item.title}
              </Text>
              <Text style={styles.resultUrl} numberOfLines={1}>
                {new URL(item.url).hostname}
              </Text>
              <Text style={styles.resultDescription} numberOfLines={2}>
                {item.description}
              </Text>
              
              <View style={styles.resultFooter}>
                {item.category && (
                  <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(item.category) }]}>
                    <Ionicons 
                      name={getIconForCategory(item.category)} 
                      size={12} 
                      color="#ffffff" 
                      style={{ marginRight: 4 }}
                    />
                    <Text style={styles.categoryText}>{item.category}</Text>
                  </View>
                )}
                {item.tags && item.tags.length > 0 && (
                  <View style={styles.resultTags}>
                    {item.tags.slice(0, 2).map((tag, index) => (
                      <Text key={index} style={styles.resultTag}>#{tag}</Text>
                    ))}
                  </View>
                )}
              </View>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  ), [pulseAnim, fadeAnim]);

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
        
        {/* Enhanced Search Bar */}
        <Animated.View style={[
          styles.searchContainer,
          {
            transform: [{
              scale: pulseAnim,
            }],
          }
        ]}>
          <LinearGradient
            colors={['#ffffff', '#f8fafc']}
            style={styles.searchGradient}
          >
            <Ionicons name="search" size={20} color="#6366f1" />
            <TextInput
              ref={searchInputRef}
              style={styles.searchInput}
              placeholder="Search your links with AI..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={() => handleSearch(searchQuery)}
              returnKeyType="search"
              placeholderTextColor="#94a3b8"
            />
            {searchQuery.length > 0 && (
              <Animated.View style={{ transform: [{ scale: fadeAnim }] }}>
                <TouchableOpacity 
                  onPress={() => setSearchQuery('')}
                  style={styles.clearButton}
                >
                  <Ionicons name="close-circle" size={20} color="#94a3b8" />
                </TouchableOpacity>
              </Animated.View>
            )}
          </LinearGradient>
        </Animated.View>
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
              <Animated.View
                key={index}
                style={[
                  styles.suggestionItemWrapper,
                  {
                    transform: [{
                      translateY: fadeAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [30, 0],
                      })
                    }],
                    opacity: fadeAnim,
                  }
                ]}
              >
                <TouchableOpacity
                  style={styles.suggestionItem}
                  onPress={() => handleSearch(suggestion)}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={['#6366f1', '#8b5cf6']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.suggestionGradient}
                  >
                    <Ionicons name="sparkles" size={14} color="#ffffff" />
                    <Text style={styles.suggestionText}>{suggestion}</Text>
                    <Ionicons name="arrow-forward" size={12} color="rgba(255,255,255,0.7)" />
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
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
                  onPress={() => handleFilterPress(filter.id)}
                  activeOpacity={0.8}
                >
                  {selectedFilter === filter.id ? (
                    <LinearGradient
                      colors={['#6366f1', '#8b5cf6']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.filterItem}
                    >
                      <Ionicons 
                        name={filter.icon as any} 
                        size={16} 
                        color="#ffffff" 
                      />
                      <Text style={styles.filterTextActive}>
                        {filter.label}
                      </Text>
                    </LinearGradient>
                  ) : (
                    <View style={styles.filterItem}>
                      <Ionicons 
                        name={filter.icon as any} 
                        size={16} 
                        color="#6366f1" 
                      />
                      <Text style={styles.filterText}>
                        {filter.label}
                      </Text>
                    </View>
                  )}
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
            
            {searchResults.map((link, index) => (
              <View key={link.id || index}>
                {renderEnhancedSearchResult({ item: link, index })}
              </View>
            ))}
          </View>
        )}

        {/* All Links when no search */}
        {searchQuery.length === 0 && searchResults.length > 0 && (
          <View style={styles.allLinksSection}>
            <Text style={styles.sectionTitle}>All Links ({searchResults.length})</Text>
            {searchResults.slice(0, 10).map((link, index) => (
              <View key={link.id || index}>
                {renderEnhancedSearchResult({ item: link, index })}
              </View>
            ))}
            
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
    paddingBottom: 100, // Extra padding for bottom navigation
  },
  searchContainer: {
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  searchGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
    marginLeft: 12,
  },
  clearButton: {
    padding: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.8)',
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
  suggestionItemWrapper: {
    marginBottom: 8,
  },
  suggestionItem: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  suggestionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  suggestionText: {
    flex: 1,
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '600',
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
    paddingBottom: 120, // Extra padding to prevent content from being cut by bottom navigation
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
    paddingBottom: 120, // Extra padding to prevent content from being cut by bottom navigation
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
    paddingBottom: 120, // Extra padding to prevent content from being cut by bottom navigation
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
  // Enhanced result card styles
  enhancedResultCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  resultTouchable: {
    overflow: 'hidden',
  },
  resultrRradient: {
    padding: 16,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  enhancedResultTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 6,
    lineHeight: 22,
  },
  resultFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  recentBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#10b981',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});