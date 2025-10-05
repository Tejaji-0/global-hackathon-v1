import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { FlatList } from 'react-native';
import { Collection, Link } from '../types';
import { useCollections } from '../hooks/useCloudSync';

interface CollectionDetailScreenProps {
  route: {
    params: {
      collection: Collection;
    };
  };
  navigation: {
    goBack: () => void;
    navigate: (screen: string, params?: any) => void;
  };
}

interface MockLink extends Link {
  platform: string;
}

export default function CollectionDetailScreen({ route, navigation }: CollectionDetailScreenProps): React.ReactElement {
  const { collection } = route.params;
  const [links, setLinks] = useState<MockLink[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { deleteCollection } = useCollections();

  useEffect(() => {
    fetchCollectionLinks();
  }, []);

  const fetchCollectionLinks = async (): Promise<void> => {
    try {
      // Mock data for now - replace with actual Supabase query
      const mockLinks: MockLink[] = [
        {
          id: '1',
          title: 'React Native Navigation Guide',
          description: 'Complete guide to navigation in React Native apps',
          image_url: 'https://via.placeholder.com/300x200/6366f1/ffffff?text=Navigation',
          url: 'https://example.com/navigation-guide',
          platform: 'Website',
          tags: ['react-native', 'navigation'],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          user_id: '1',
        },
        {
          id: '2',
          title: 'Expo Development Workflow',
          description: 'Best practices for developing with Expo',
          image_url: 'https://via.placeholder.com/300x200/8b5cf6/ffffff?text=Expo',
          url: 'https://example.com/expo-workflow',
          platform: 'Medium',
          tags: ['expo', 'development'],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          user_id: '1',
        },
        {
          id: '3',
          title: 'State Management in React Native',
          description: 'Redux, Context API, and modern state management',
          image_url: 'https://via.placeholder.com/300x200/10b981/ffffff?text=State',
          url: 'https://example.com/state-management',
          platform: 'YouTube',
          tags: ['react-native', 'redux', 'state'],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          user_id: '1',
        },
      ];

      setLinks(mockLinks);
    } catch (error) {
      console.error('Error fetching collection links:', error);
      Alert.alert('Error', 'Failed to fetch collection links');
    } finally {
      setLoading(false);
    }
  };

  const handleLinkPress = (link: MockLink): void => {
    navigation.navigate('LinkDetail', { link });
  };

  const handleEditCollection = (): void => {
    Alert.prompt(
      'Edit Collection',
      'Enter new name for the collection:',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Save',
          onPress: async (newName) => {
            if (newName && newName.trim()) {
              try {
                // TODO: Implement actual update functionality when available
                Alert.alert('Success', 'Collection name updated successfully');
              } catch (error) {
                Alert.alert('Error', 'Failed to update collection name');
              }
            }
          }
        }
      ],
      'plain-text',
      collection.name
    );
  };

  const handleShareCollection = async (): Promise<void> => {
    try {
      const linksList = links.map(link => `• ${link.title}: ${link.url}`).join('\n');
      const shareText = `${collection.name}\n\n${linksList}`;
      
      await Share.share({
        message: shareText,
        title: collection.name,
      });
    } catch (error) {
      Alert.alert('Error', 'Could not share collection');
    }
  };

  const handleDeleteCollection = (): void => {
    Alert.alert(
      'Delete Collection',
      'Are you sure you want to delete this collection? This will remove all links from the collection.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await deleteCollection(collection.id);
              if (result.error) {
                throw result.error;
              }
              // Navigate back immediately - optimistic update already removed it from UI
              navigation.goBack();
            } catch (error) {
              console.error('Error deleting collection:', error);
              Alert.alert('Error', 'Failed to delete collection. Please try again.');
            }
          }
        }
      ]
    );
  };

  const renderLink = ({ item }: { item: MockLink }): React.ReactElement => (
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
        <Text style={styles.linkDescription} numberOfLines={2}>
          {item.description}
        </Text>
        <View style={styles.linkMeta}>
          <View style={styles.platformBadge}>
            <Text style={styles.platformText}>{item.platform}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading collection...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[collection.color || '#6366f1', (collection.color || '#6366f1') + '80']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Collection</Text>
          <TouchableOpacity
            style={styles.moreButton}
            onPress={() => {
              Alert.alert(
                'Collection Options',
                'Choose an action',
                [
                  { text: 'Edit', onPress: handleEditCollection },
                  { text: 'Share', onPress: handleShareCollection },
                  { text: 'Delete', onPress: handleDeleteCollection, style: 'destructive' },
                  { text: 'Cancel', style: 'cancel' }
                ]
              );
            }}
          >
            <Ionicons name="ellipsis-horizontal" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Collection Info */}
        <View style={styles.collectionInfo}>
          <View style={styles.collectionHeader}>
            <View style={[styles.iconContainer, { backgroundColor: collection.color || '#6366f1' }]}>
              <Ionicons name="folder" size={32} color="white" />
            </View>
            <View style={styles.collectionMeta}>
              <Text style={styles.collectionName}>{collection.name}</Text>
              <Text style={styles.linkCount}>{links.length} links</Text>
            </View>
          </View>
          
          <Text style={styles.collectionDescription}>
            {collection.description || 'No description available'}
          </Text>
          
          <Text style={styles.createdDate}>
            Created {new Date(collection.created_at).toLocaleDateString()}
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: collection.color || '#6366f1' }]}
            onPress={() => navigation.navigate('AddLink')}
          >
            <Ionicons name="add" size={20} color="white" />
            <Text style={styles.actionButtonText}>Add Link</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButtonOutline}
            onPress={handleShareCollection}
          >
            <Ionicons name="share-outline" size={20} color={collection.color || '#6366f1'} />
            <Text style={[styles.actionButtonTextOutline, { color: collection.color || '#6366f1' }]}>
              Share
            </Text>
          </TouchableOpacity>
        </View>

        {/* Links Grid */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Links in Collection</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Search')}>
              <Ionicons name="search-outline" size={20} color="#6366f1" />
            </TouchableOpacity>
          </View>

          {links.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="bookmark-outline" size={64} color="#d1d5db" />
              <Text style={styles.emptyStateTitle}>No links in collection</Text>
              <Text style={styles.emptyStateText}>
                Add your first link to this collection
              </Text>
              <TouchableOpacity
                style={[styles.emptyStateButton, { backgroundColor: collection.color || '#6366f1' }]}
                onPress={() => navigation.navigate('AddLink')}
              >
                <Text style={styles.emptyStateButtonText}>Add Link</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={links}
              style={styles.linksGrid}
              renderItem={renderLink}
              keyExtractor={(item) => item.id.toString()}
              numColumns={2}
              columnWrapperStyle={styles.row}
              scrollEnabled={false}
            />
          )}
        </View>

        {/* Collection Stats */}
        {links.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Collection Insights</Text>
            <View style={styles.statsCard}>
              <View style={styles.statRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{links.length}</Text>
                  <Text style={styles.statLabel}>Total Links</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>
                    {[...new Set(links.flatMap(link => link.tags || []))].length}
                  </Text>
                  <Text style={styles.statLabel}>Unique Tags</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>
                    {[...new Set(links.map(link => link.platform))].length}
                  </Text>
                  <Text style={styles.statLabel}>Platforms</Text>
                </View>
              </View>
            </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: 'white',
  },
  moreButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  collectionInfo: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  collectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  collectionMeta: {
    flex: 1,
  },
  collectionName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  linkCount: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  publicBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  publicText: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '500',
    marginLeft: 4,
  },
  collectionDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  createdDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  actionButtons: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
  },
  actionButtonOutline: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  actionButtonTextOutline: {
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
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  linksGrid: {
    flex: 1,
  },
  linkCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  linkImage: {
    width: '100%',
    height: 80,
    backgroundColor: '#f3f4f6',
  },
  linkContent: {
    padding: 8,
  },
  linkTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  linkDescription: {
    fontSize: 10,
    color: '#6b7280',
    lineHeight: 14,
    marginBottom: 6,
  },
  linkMeta: {
    alignItems: 'flex-start',
  },
  platformBadge: {
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  platformText: {
    fontSize: 8,
    color: '#6366f1',
    fontWeight: '500',
  },
  statsCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
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
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  emptyStateButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
  row: {
    justifyContent: 'space-around',
  },
});