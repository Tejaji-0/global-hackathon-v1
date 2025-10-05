import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

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

export default function SearchScreen({ navigation }: SearchScreenProps): React.ReactElement {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const filters: Filter[] = [
    { id: 'all', label: 'All', icon: 'grid-outline' },
    { id: 'youtube', label: 'YouTube', icon: 'logo-youtube' },
    { id: 'instagram', label: 'Instagram', icon: 'logo-instagram' },
    { id: 'twitter', label: 'Twitter', icon: 'logo-twitter' },
    { id: 'articles', label: 'Articles', icon: 'document-text-outline' },
    { id: 'images', label: 'Images', icon: 'image-outline' },
  ];

  const recentSearches: string[] = [
    'React Native tutorials',
    'AI development',
    'Design inspiration',
    'Mobile UI patterns',
  ];

  const popularTags: string[] = [
    'tutorial', 'design', 'ai', 'development', 'inspiration',
    'react-native', 'mobile', 'ui-ux', 'productivity', 'tech'
  ];

  const handleSearch = (query: string): void => {
    // TODO: Implement actual search functionality
    console.log('Searching for:', query);
    setSearchQuery(query);
  };

  const handleFilterPress = (filterId: string): void => {
    setSelectedFilter(filterId);
    // TODO: Filter results based on selected filter
  };

  const handleTagPress = (tag: string): void => {
    setSearchQuery(`#${tag}`);
    handleSearch(`#${tag}`);
  };

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
      <LinearGradient
        colors={['#6366f1', '#8b5cf6']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Search</Text>
          <Text style={styles.headerSubtitle}>Find your saved content</Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Search Input */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search-outline" size={20} color="#6b7280" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search links, tags, or content..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={() => handleSearch(searchQuery)}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                style={styles.clearButton}
              >
                <Ionicons name="close-circle" size={20} color="#6b7280" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Filters */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Filter by platform</Text>
          <FlatList
            data={filters}
            renderItem={renderFilter}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterList}
          />
        </View>

        {/* AI Search Suggestions */}
        <View style={styles.section}>
          <View style={styles.aiSuggestionCard}>
            <View style={styles.aiSuggestionHeader}>
              <Ionicons name="sparkles" size={20} color="#6366f1" />
              <Text style={styles.aiSuggestionTitle}>AI Search</Text>
            </View>
            <Text style={styles.aiSuggestionText}>
              Try natural language search like "show me YouTube videos about productivity I saved last week"
            </Text>
          </View>
        </View>

        {/* Recent Searches */}
        {recentSearches.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent searches</Text>
            {recentSearches.map((search, index) => (
              <TouchableOpacity
                key={index}
                style={styles.recentSearchItem}
                onPress={() => handleSearch(search)}
              >
                <Ionicons name="time-outline" size={16} color="#6b7280" />
                <Text style={styles.recentSearchText}>{search}</Text>
                <Ionicons name="arrow-up-outline" size={16} color="#6b7280" />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Popular Tags */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Popular tags</Text>
          <View style={styles.tagsContainer}>
            {popularTags.map((tag, index) => (
              <TouchableOpacity
                key={index}
                style={styles.tagChip}
                onPress={() => handleTagPress(tag)}
              >
                <Text style={styles.tagText}>#{tag}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Search results</Text>
            {/* TODO: Render search results */}
          </View>
        )}

        {/* Empty State */}
        {searchQuery.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyStateTitle}>Start searching</Text>
            <Text style={styles.emptyStateText}>
              Search through your saved links, collections, and tags
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
});