import React, { useState, useEffect } from 'react';
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
  Animated,
  Easing,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { FlatList } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { useLinks, useCollections } from '../hooks/useCloudSync';
import { Link } from '../types';

const { width } = Dimensions.get('window');

interface HomeScreenProps {
  navigation: {
    navigate: (screen: string, params?: any) => void;
  };
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
  const { collections, addLinkToCollection } = useCollections();
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  
  // Animation values for modern UI
  const fabScale = new Animated.Value(1);
  const headerOpacity = new Animated.Value(1);
  const cardScale = new Animated.Value(0.95);

  // Get filtered links based on selected category
  const filteredLinks = selectedCategory === 'All' 
    ? links.slice(0, 10) // Show recent 10 links on home
    : links.filter(link => link.category === selectedCategory).slice(0, 10);

  const categories = ['All', ...getCategories()];

  // Controlled refresh when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      console.log('🏠 HomeScreen focused');
      
      // Only refresh if we have very few links or it's been a while
      const shouldRefresh = links.length === 0 || Date.now() - lastRefreshTime > 60000; // 1 minute
      if (shouldRefresh) {
        console.log('🔄 Performing focus refresh');
        refreshLinks();
        setLastRefreshTime(Date.now());
      } else {
        console.log('⏭️ Skipping focus refresh (recent data available)');
      }
      
      // Animate cards entrance
      Animated.spring(cardScale, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    }, [links.length, refreshLinks, cardScale])
  );

  // Track last manual refresh time
  const [lastRefreshTime, setLastRefreshTime] = useState(0);

  // Animate header on mount
  useEffect(() => {
    Animated.timing(headerOpacity, {
      toValue: 1,
      duration: 800,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [headerOpacity]);

  const onRefresh = async (): Promise<void> => {
    console.log('🔄 Manual pull-to-refresh triggered');
    setRefreshing(true);
    setLastRefreshTime(Date.now());
    try {
      await refreshLinks(); // This forces a sync
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
    // Animate FAB press
    Animated.sequence([
      Animated.timing(fabScale, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(fabScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => {
      navigation.navigate('AddLink');
    });
  };

  const handleViewAllLinks = (): void => {
    navigation.navigate('Search');
  };

  const handleAddToCollection = (link: Link): void => {
    if (collections.length === 0) {
      Alert.alert(
        'No Collections',
        'You don\'t have any collections yet. Create a collection first.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Create Collection', onPress: () => navigation.navigate('Collections') }
        ]
      );
      return;
    }

    Alert.alert(
      'Add to Collection',
      'Choose a collection to add this link to:',
      [
        { text: 'Cancel', style: 'cancel' },
        ...collections.map(collection => ({
          text: collection.name,
          onPress: async () => {
            try {
              const linkId = parseInt(link.id);
              const collectionId = parseInt(collection.id);
              await addLinkToCollection(linkId, collectionId);
              Alert.alert('Success', `Added "${link.title}" to "${collection.name}"`);
            } catch (error) {
              console.error('❌ Error adding link to collection:', error);
              Alert.alert('Error', 'Failed to add link to collection');
            }
          }
        }))
      ]
    );
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
    <Animated.View style={[styles.header, { opacity: headerOpacity }]}>
      <LinearGradient
        colors={['#6366f1', '#8b5cf6', '#ec4899']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
            <View style={styles.welcomeContainer}>
              <Text style={styles.greeting}>
                Welcome back{user?.email ? `, ${user.email.split('@')[0]}` : ''}! 👋
              </Text>
              <Text style={styles.subtitle}>
                Organize your digital world ✨
              </Text>
            </View>
          </View>
          
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <View style={styles.statIconContainer}>
                <Ionicons name="bookmark" size={20} color="#6366f1" />
              </View>
              <Text style={styles.statNumber}>{links.length}</Text>
              <Text style={styles.statLabel}>Links Saved</Text>
            </View>
            <View style={styles.statItem}>
              <View style={styles.statIconContainer}>
                <Ionicons name="grid" size={20} color="#8b5cf6" />
              </View>
              <Text style={styles.statNumber}>{getCategories().length}</Text>
              <Text style={styles.statLabel}>Categories</Text>
            </View>
            <View style={styles.statItem}>
              <View style={styles.statIconContainer}>
                <Ionicons name="trending-up" size={20} color="#ec4899" />
              </View>
              <Text style={styles.statNumber}>
                {syncing ? '...' : (links.filter(l => new Date(l.created_at) > new Date(Date.now() - 7*24*60*60*1000)).length)}
              </Text>
              <Text style={styles.statLabel}>This Week</Text>
            </View>
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );

  const renderLink = ({ item, index }: { item: Link; index: number }): React.ReactElement => (
    <Animated.View
      style={[
        styles.linkCardContainer,
        {
          transform: [{ scale: cardScale }],
          opacity: cardScale,
        },
      ]}
    >
      <TouchableOpacity
        style={styles.linkCard}
        onPress={() => handleLinkPress(item)}
        onLongPress={() => handleAddToCollection(item)}
        activeOpacity={0.8}
      >
      <View style={styles.linkImageContainer}>
        {item.image_url ? (
          <Image 
            source={{ uri: item.image_url }} 
            style={styles.linkImage}
            onError={() => {
              console.log('🖼️ Failed to load image for:', item.title);
            }}
          />
        ) : (
          <View style={styles.linkImagePlaceholder}>
            <Ionicons 
              name={getIconForCategory(item.category)} 
              size={32} 
              color="#6366f1" 
            />
          </View>
        )}
        {item.favicon_url && (
          <View style={styles.faviconContainer}>
            <Image 
              source={{ uri: item.favicon_url }} 
              style={styles.favicon}
              onError={() => {
                console.log('🌐 Failed to load favicon for:', item.title);
              }}
            />
          </View>
        )}
      </View>
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
          <View style={styles.linkActions}>
            <Text style={styles.linkDate}>
              {new Date(item.created_at).toLocaleDateString()}
            </Text>
            <TouchableOpacity
              style={styles.collectionButton}
              onPress={(e) => {
                e.stopPropagation();
                handleAddToCollection(item);
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="folder-outline" size={16} color="#6366f1" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
    </Animated.View>
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

  return (
    <View style={styles.container}>
      {renderHeader()}
      
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
            renderItem={({ item, index }) => renderLink({ item, index })}
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
      
      {/* Modern Floating Action Button */}
      <Animated.View
        style={[
          styles.fabContainer,
          {
            transform: [{ scale: fabScale }],
          },
        ]}
      >
        <TouchableOpacity style={styles.fab} onPress={handleAddLink} activeOpacity={0.8}>
          <LinearGradient
            colors={['#6366f1', '#8b5cf6']}
            style={styles.fabGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="add" size={28} color="white" />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
  },
  header: {
    backgroundColor: 'transparent',
    elevation: 0,
    shadowOpacity: 0,
  },
  headerGradient: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    flex: 1,
  },
  headerTop: {
    marginBottom: 24,
  },
  welcomeContainer: {
    marginBottom: 4,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700',
    color: 'white',
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
    padding: 20,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  statItem: {
    alignItems: 'center',
  },
  statIconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: 'white',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
    paddingBottom: 100,
  },
  linkCardContainer: {
    marginBottom: 16,
  },
  linkCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.02)',
  },
  linkImageContainer: {
    position: 'relative',
    width: '100%',
    height: 120,
    backgroundColor: '#f3f4f6',
  },
  linkImage: {
    width: '100%',
    height: 120,
    backgroundColor: '#f3f4f6',
  },
  linkImagePlaceholder: {
    width: '100%',
    height: 120,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  faviconContainer: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  favicon: {
    width: 16,
    height: 16,
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
  linkActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  collectionButton: {
    padding: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
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
  
  // Modern Floating Action Button Styles
  fabContainer: {
    position: 'absolute',
    bottom: 110, // Adjusted to be above the floating tab bar (70px + 20px margin + 20px spacing)
    right: 20,
    zIndex: 9999, // Increased z-index to ensure it's above everything
  },
  fab: {
    width: 64,
    height: 64,
    borderRadius: 32,
    shadowColor: '#6366f1',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12, // Increased elevation for Android
  },
  fabGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },

});