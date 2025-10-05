import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { FlatList } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useLinks } from '../hooks/useCloudSync';
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
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showCreateForm, setShowCreateForm] = useState<boolean>(false);
  const [newCollectionName, setNewCollectionName] = useState<string>('');
  const [newCollectionDescription, setNewCollectionDescription] = useState<string>('');
  
  const { links, getCategories } = useLinks();
  const fadeAnim = new Animated.Value(0);

  useEffect(() => {
    loadCollectionsFromCategories();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [links]);

  const loadCollectionsFromCategories = () => {
    const categories = getCategories();
    const mockCollectionsFromData: MockCollection[] = categories.map((category, index) => {
      const categoryLinks = links.filter(link => link.category === category);
      const colors = ['#6366f1', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#8b5cf6'];
      const icons = ['grid', 'code-slash', 'color-palette', 'bulb', 'rocket', 'library', 'star'];
      
      return {
        id: String(index + 1),
        name: category.charAt(0).toUpperCase() + category.slice(1),
        description: `Collection of ${categoryLinks.length} ${category} links`,
        linkCount: categoryLinks.length,
        color: colors[index % colors.length],
        icon: icons[index % icons.length],
        isPublic: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_id: '1',
      };
    });

    setCollections(mockCollectionsFromData);
  };

  const onRefresh = (): void => {
    setRefreshing(true);
    loadCollectionsFromCategories();
    setRefreshing(false);
  };

  const handleCreateCollection = (): void => {
    setShowCreateForm(true);
  };

  const handleSaveCollection = async (): Promise<void> => {
    if (newCollectionName.trim()) {
      try {
        // Create a new mock collection
        const newCollection: MockCollection = {
          id: String(collections.length + 1),
          name: newCollectionName.trim(),
          description: newCollectionDescription.trim() || `Custom collection`,
          linkCount: 0,
          color: '#6366f1',
          icon: 'folder',
          isPublic: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          user_id: '1',
        };
        
        setCollections([...collections, newCollection]);
        setNewCollectionName('');
        setNewCollectionDescription('');
        setShowCreateForm(false);
        Alert.alert('Success', 'Collection created successfully!');
      } catch (error) {
        Alert.alert('Error', 'Failed to create collection');
      }
    }
  };

  const filteredCollections = collections.filter(collection =>
    collection.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    collection.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCollectionPress = (collection: MockCollection): void => {
    navigation.navigate('CollectionDetail', { collection });
  };

  const renderCollection = ({ item }: { item: MockCollection }): React.ReactElement => (
    <TouchableOpacity
      key={item.id}
      style={styles.collectionCard}
      onPress={() => handleCollectionPress(item)}
      activeOpacity={0.8}
    >
      <View style={styles.collectionHeader}>
        <View style={[styles.iconContainer, { backgroundColor: item.color }]}>
          <Ionicons name={item.icon as any} size={18} color="white" />
        </View>
        <Text style={styles.linkCount}>{item.linkCount}</Text>
      </View>
      
      <Text style={styles.collectionName} numberOfLines={1}>
        {item.name}
      </Text>
      
      <Text style={styles.collectionDescription} numberOfLines={2}>
        {item.description}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Minimalistic Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Collections</Text>
          <TouchableOpacity onPress={handleCreateCollection} style={styles.addButton}>
            <Ionicons name="add" size={24} color="#6366f1" />
          </TouchableOpacity>
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
              <TouchableOpacity
                style={styles.emptyStateButton}
                onPress={handleCreateCollection}
              >
                <Text style={styles.emptyStateButtonText}>Create Collection</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.collectionsContainer}>
            {filteredCollections.map((collection) => renderCollection({ item: collection }))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1e293b',
    letterSpacing: -0.5,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1e293b',
    marginLeft: 12,
  },
  createForm: {
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    marginVertical: 10,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 12,
    backgroundColor: '#f8fafc',
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
    padding: 20,
  },
  collectionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  collectionCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  collectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  linkCount: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  collectionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 6,
  },
  collectionDescription: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  emptyStateButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyStateButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
});