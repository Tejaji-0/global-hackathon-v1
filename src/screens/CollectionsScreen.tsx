import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { FlatList } from 'react-native';
import { Collection } from '../types';

interface CollectionsScreenProps {
  navigation: {
    navigate: (screen: string, params?: any) => void;
  };
}

interface MockCollection extends Collection {
  linkCount: number;
  icon: string;
  isPublic: boolean;
}

export default function CollectionsScreen({ navigation }: CollectionsScreenProps): React.ReactElement {
  const [collections, setCollections] = useState<MockCollection[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  useEffect(() => {
    fetchCollections();
  }, []);

  const fetchCollections = async (): Promise<void> => {
    try {
      // Mock data for now - replace with actual Supabase query
      const mockCollections: MockCollection[] = [
        {
          id: 1,
          name: 'React Native Resources',
          description: 'Tutorials, documentation, and tools for React Native development',
          linkCount: 15,
          color: '#6366f1',
          icon: 'code-slash',
          isPublic: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          user_id: '1',
        },
        {
          id: 2,
          name: 'Design Inspiration',
          description: 'Beautiful UI designs, color palettes, and creative ideas',
          linkCount: 23,
          color: '#8b5cf6',
          icon: 'color-palette',
          isPublic: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          user_id: '1',
        },
        {
          id: 3,
          name: 'AI & Machine Learning',
          description: 'Latest developments in artificial intelligence and ML',
          linkCount: 8,
          color: '#10b981',
          icon: 'brain',
          isPublic: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          user_id: '1',
        },
        {
          id: 4,
          name: 'Productivity Tips',
          description: 'Tools and techniques to boost productivity',
          linkCount: 12,
          color: '#f59e0b',
          icon: 'rocket',
          isPublic: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          user_id: '1',
        },
      ];

      setCollections(mockCollections);
    } catch (error) {
      console.error('Error fetching collections:', error);
      Alert.alert('Error', 'Failed to fetch collections');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = (): void => {
    setRefreshing(true);
    fetchCollections();
  };

  const handleCreateCollection = (): void => {
    Alert.alert(
      'Create Collection',
      'Collection creation feature coming soon!',
      [{ text: 'OK' }]
    );
  };

  const handleCollectionPress = (collection: MockCollection): void => {
    navigation.navigate('CollectionDetail', { collection });
  };

  const renderCollection = ({ item }: { item: MockCollection }): React.ReactElement => (
    <TouchableOpacity
      style={[styles.collectionCard, { borderLeftColor: item.color }]}
      onPress={() => handleCollectionPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.collectionHeader}>
        <View style={[styles.iconContainer, { backgroundColor: item.color }]}>
          <Ionicons name={item.icon as any} size={20} color="white" />
        </View>
        <View style={styles.collectionMeta}>
          <View style={styles.metaRow}>
            <Text style={styles.linkCount}>{item.linkCount} links</Text>
            {item.isPublic && (
              <View style={styles.publicBadge}>
                <Ionicons name="globe-outline" size={12} color="#10b981" />
                <Text style={styles.publicText}>Public</Text>
              </View>
            )}
          </View>
        </View>
      </View>
      
      <Text style={styles.collectionName} numberOfLines={2}>
        {item.name}
      </Text>
      
      <Text style={styles.collectionDescription} numberOfLines={3}>
        {item.description}
      </Text>
      
      <View style={styles.collectionFooter}>
        <Text style={styles.createdDate}>
          Created {new Date(item.created_at).toLocaleDateString()}
        </Text>
        <Ionicons name="chevron-forward" size={16} color="#6b7280" />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#6366f1', '#8b5cf6']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Collections</Text>
          <Text style={styles.headerSubtitle}>Organize your saved content</Text>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleCreateCollection}
          >
            <LinearGradient
              colors={['#6366f1', '#8b5cf6']}
              style={styles.actionButtonGradient}
            >
              <Ionicons name="add" size={20} color="white" />
              <Text style={styles.actionButtonText}>New Collection</Text>
            </LinearGradient>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Search')}
          >
            <View style={styles.actionButtonOutline}>
              <Ionicons name="search-outline" size={20} color="#6366f1" />
              <Text style={styles.actionButtonTextOutline}>Search</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Collections Grid */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Collections</Text>
            <Text style={styles.collectionCount}>{collections.length} total</Text>
          </View>

          {collections.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="library-outline" size={64} color="#d1d5db" />
              <Text style={styles.emptyStateTitle}>No collections yet</Text>
              <Text style={styles.emptyStateText}>
                Create your first collection to organize your saved links
              </Text>
              <TouchableOpacity
                style={styles.emptyStateButton}
                onPress={handleCreateCollection}
              >
                <Text style={styles.emptyStateButtonText}>Create Collection</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={collections}
              style={styles.collectionsGrid}
              renderItem={renderCollection}
              keyExtractor={(item) => item.id.toString()}
              numColumns={2}
              columnWrapperStyle={styles.row}
              scrollEnabled={false}
            />
          )}
        </View>

        {/* Featured/Public Collections */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Discover Collections</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See all</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.discoverCard}>
            <Ionicons name="compass-outline" size={24} color="#6366f1" />
            <View style={styles.discoverContent}>
              <Text style={styles.discoverTitle}>Explore Public Collections</Text>
              <Text style={styles.discoverText}>
                Discover collections shared by other users and find new content
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#6b7280" />
          </View>
        </View>
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
  quickActions: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  actionButtonOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#6366f1',
    borderRadius: 12,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  actionButtonTextOutline: {
    color: '#6366f1',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
  },
  collectionCount: {
    fontSize: 14,
    color: '#6b7280',
  },
  seeAllText: {
    fontSize: 14,
    color: '#6366f1',
    fontWeight: '500',
  },
  collectionsGrid: {
    flex: 1,
  },
  collectionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  collectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  collectionMeta: {
    flex: 1,
    alignItems: 'flex-end',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  linkCount: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  publicBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  publicText: {
    fontSize: 10,
    color: '#10b981',
    fontWeight: '500',
    marginLeft: 2,
  },
  collectionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  collectionDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  collectionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  createdDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  discoverCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  discoverContent: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  discoverTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  discoverText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 18,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
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
    marginBottom: 20,
  },
  emptyStateButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  emptyStateButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  row: {
    justifyContent: 'space-around',
  },
});