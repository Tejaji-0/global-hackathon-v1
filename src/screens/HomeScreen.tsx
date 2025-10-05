import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { FlatList } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useLinks } from '../hooks/useCloudSync';
import { isRealClient } from '../services/supabase';
import DebugInfo from '../components/DebugInfo';
import { Link } from '../types';

const { width } = Dimensions.get('window');

interface HomeScreenProps {
  navigation: {
    navigate: (screen: string, params?: any) => void;
  };
}

export default function HomeScreen({ navigation }: HomeScreenProps): React.ReactElement {
  const { user } = useAuth();
  const { 
    links, 
    loading, 
    error, 
    syncing, 
    refreshLinks, 
    getCategories 
  } = useLinks();
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Get filtered links based on selected category
  const filteredLinks = selectedCategory === 'All' 
    ? links.slice(0, 10) // Show recent 10 links on home
    : links.filter(link => link.category === selectedCategory).slice(0, 10);

  const categories = ['All', ...getCategories()];

  const onRefresh = async (): Promise<void> => {
    setRefreshing(true);
    try {
      await refreshLinks();
    } catch (error) {
      console.error('Error refreshing:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleLinkPress = (link: Link): void => {
    navigation.navigate('LinkDetail', { link });
  };

  const handleAddLink = (): void => {
    navigation.navigate('AddLink');
  };

  const handleViewAllLinks = (): void => {
    navigation.navigate('Search');
  };

  const renderCategoryFilter = (): React.ReactElement => (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      style={styles.categoryContainer}
      contentContainerStyle={styles.categoryContent}
    >
      {categories.map((category) => (
        <TouchableOpacity
          key={category}
          style={[
            styles.categoryChip,
            selectedCategory === category && styles.categoryChipActive
          ]}
          onPress={() => setSelectedCategory(category)}
        >
          <Text
            style={[
              styles.categoryText,
              selectedCategory === category && styles.categoryTextActive
            ]}
          >
            {category}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderHeader = (): React.ReactElement => (
    <View style={styles.header}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greeting}>
                Welcome back{user?.email ? `, ${user.email.split('@')[0]}` : ''}!
              </Text>
              <Text style={styles.subtitle}>
                Organize your digital world
              </Text>
            </View>
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleAddLink}
            >
              <Ionicons name="add" size={24} color="white" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{links.length}</Text>
              <Text style={styles.statLabel}>Links Saved</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{getCategories().length}</Text>
              <Text style={styles.statLabel}>Categories</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {syncing ? '...' : (links.filter(l => new Date(l.created_at) > new Date(Date.now() - 7*24*60*60*1000)).length)}
              </Text>
              <Text style={styles.statLabel}>This Week</Text>
            </View>
          </View>
        </View>
      </LinearGradient>
    </View>
  );

  const renderLink = ({ item }: { item: Link }): React.ReactElement => (
    <TouchableOpacity
      style={styles.linkCard}
      onPress={() => handleLinkPress(item)}
      activeOpacity={0.7}
    >
      {item.image_url && (
        <Image source={{ uri: item.image_url }} style={styles.linkImage} />
      )}
      <View style={styles.linkContent}>
        <Text style={styles.linkTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.linkDescription} numberOfLines={3}>
          {item.description}
        </Text>
        <View style={styles.linkMeta}>
          <View style={styles.linkTags}>
            {item.tags?.slice(0, 2).map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.linkDate}>
            {new Date(item.created_at).toLocaleDateString()}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmpty = (): React.ReactElement => (
    <View style={styles.emptyContainer}>
      <Ionicons name="link-outline" size={64} color="#d1d5db" />
      <Text style={styles.emptyTitle}>No Links Yet</Text>
      <Text style={styles.emptyDescription}>
        Start building your digital library by adding your first link
      </Text>
      <TouchableOpacity style={styles.emptyButton} onPress={handleAddLink}>
        <Ionicons name="add" size={20} color="white" />
        <Text style={styles.emptyButtonText}>Add Your First Link</Text>
      </TouchableOpacity>
    </View>
  );

  const renderError = (): React.ReactElement => (
    <View style={styles.errorContainer}>
      <Ionicons name="warning-outline" size={48} color="#ef4444" />
      <Text style={styles.errorTitle}>Sync Error</Text>
      <Text style={styles.errorDescription}>{error}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
        <Text style={styles.retryButtonText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading && links.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Loading your links...</Text>
      </View>
    );
  }

  const renderDemoBanner = (): React.ReactElement | null => {
    if (isRealClient) return null;
    
    return (
      <View style={styles.demoBanner}>
        <Ionicons name="information-circle" size={16} color="#f59e0b" />
        <Text style={styles.demoBannerText}>
          Demo Mode - All features working with sample data
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {renderHeader()}
      {renderDemoBanner()}
      <DebugInfo visible={__DEV__} />
      
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {error && renderError()}
        
        {categories.length > 1 && renderCategoryFilter()}
        
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Links</Text>
          {filteredLinks.length > 0 && (
            <TouchableOpacity onPress={handleViewAllLinks}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          )}
        </View>

        {filteredLinks.length === 0 ? (
          renderEmpty()
        ) : (
          <FlatList
            data={filteredLinks}
            renderItem={renderLink}
            keyExtractor={(item) => item.id.toString()}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.linksList}
          />
        )}

        {syncing && (
          <View style={styles.syncingContainer}>
            <ActivityIndicator size="small" color="#6366f1" />
            <Text style={styles.syncingText}>Syncing changes...</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  header: {
    backgroundColor: 'transparent',
  },
  headerGradient: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flex: 1,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  addButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  content: {
    flex: 1,
  },
  categoryContainer: {
    marginVertical: 16,
  },
  categoryContent: {
    paddingHorizontal: 20,
  },
  categoryChip: {
    backgroundColor: 'white',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  categoryChipActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  categoryTextActive: {
    color: 'white',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
  },
  viewAllText: {
    fontSize: 16,
    color: '#6366f1',
    fontWeight: '500',
  },
  linksList: {
    paddingHorizontal: 20,
  },
  linkCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  linkImage: {
    width: '100%',
    height: 120,
    backgroundColor: '#f3f4f6',
  },
  linkContent: {
    padding: 16,
  },
  linkTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
    lineHeight: 22,
  },
  linkDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  linkMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  linkTags: {
    flexDirection: 'row',
    flex: 1,
  },
  tag: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 6,
  },
  tagText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  linkDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366f1',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginLeft: 8,
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
    backgroundColor: '#fef2f2',
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#dc2626',
    marginTop: 12,
    marginBottom: 8,
  },
  errorDescription: {
    fontSize: 14,
    color: '#7f1d1d',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#dc2626',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  syncingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  syncingText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
  },
  demoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    borderColor: '#f59e0b',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 20,
    marginBottom: 12,
  },
  demoBannerText: {
    fontSize: 13,
    color: '#92400e',
    fontWeight: '500',
    marginLeft: 6,
    flex: 1,
  },
});