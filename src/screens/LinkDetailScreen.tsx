import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Share,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as WebBrowser from 'expo-web-browser';
import { Link } from '../types';
import { useLinks } from '../hooks/useCloudSync';

interface LinkDetailScreenProps {
  route: {
    params: {
      link: Link & {
        platform?: string;
        category?: string;
        mood?: string;
        notes?: string;
        summary?: string;
      };
    };
  };
  navigation: {
    goBack: () => void;
    navigate: (screen: string, params?: any) => void;
  };
}

interface ActionButton {
  icon: string;
  label: string;
  onPress: () => void;
  color: string;
}

export default function LinkDetailScreen({ route, navigation }: LinkDetailScreenProps): React.ReactElement {
  const { link } = route.params;
  const { deleteLink } = useLinks();


  const handleOpenLink = async (): Promise<void> => {
    try {
      await WebBrowser.openBrowserAsync(link.url);
    } catch (error) {
      Alert.alert('Error', 'Could not open link');
    }
  };

  const handleShareLink = async (): Promise<void> => {
    try {
      await Share.share({
        message: `${link.title}\n\n${link.url}`,
        url: link.url,
      });
    } catch (error) {
      Alert.alert('Error', 'Could not share link');
    }
  };



  const handleDeleteLink = (): void => {
    Alert.alert(
      'Delete Link',
      'Are you sure you want to delete this link?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            console.log('🔘 Delete button pressed for link:', link.id, link.title);
            try {
              const result = await deleteLink(link.id);
              console.log('📞 Delete result:', result);
              if (result.error) {
                console.error('❌ Delete failed with error:', result.error);
                throw result.error;
              }
              console.log('✅ Delete successful, navigating back immediately');
              // Navigate back immediately - optimistic update already removed it from UI
              navigation.goBack();
            } catch (error) {
              console.error('❌ Error in delete handler:', error);
              Alert.alert('Error', 'Failed to delete link. Please try again.');
            }
          }
        }
      ]
    );
  };

  const actionButtons: ActionButton[] = [
    {
      icon: 'open-outline',
      label: 'Open',
      onPress: handleOpenLink,
      color: '#6366f1',
    },
    {
      icon: 'share-outline',
      label: 'Share',
      onPress: handleShareLink,
      color: '#10b981',
    },

    {
      icon: 'trash-outline',
      label: 'Delete',
      onPress: handleDeleteLink,
      color: '#ef4444',
    },
  ];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#6366f1', '#8b5cf6']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Link Details</Text>
          <TouchableOpacity
            style={styles.moreButton}
            onPress={() => {
              Alert.alert(
                'Link Options',
                'Choose an action',
                [
                  { text: 'Edit Notes', onPress: () => Alert.alert('Feature Coming Soon', 'Edit notes feature will be available soon!') },
                  { text: 'Copy Link', onPress: () => {
                    // TODO: Implement copy to clipboard
                    Alert.alert('Link Copied', 'Link copied to clipboard');
                  }},
                  { text: 'View Source', onPress: handleOpenLink },
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
        {/* Link Preview */}
        <View style={styles.previewCard}>
          {link.image_url && (
            <Image source={{ uri: link.image_url }} style={styles.previewImage} />
          )}
          <View style={styles.previewContent}>
            <Text style={styles.linkTitle}>{link.title}</Text>
            <Text style={styles.linkDescription}>{link.description}</Text>
            
            <View style={styles.linkMeta}>
              <View style={styles.platformBadge}>
                <Text style={styles.platformText}>{link.platform || 'Website'}</Text>
              </View>
              <Text style={styles.linkDomain}>{new URL(link.url).hostname}</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          {actionButtons.map((button, index) => (
            <TouchableOpacity
              key={index}
              style={styles.actionButton}
              onPress={button.onPress}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIconContainer, { backgroundColor: button.color }]}>
                <Ionicons name={button.icon as any} size={20} color="white" />
              </View>
              <Text style={styles.actionLabel}>{button.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tags Section */}
        {link.tags && link.tags.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tags</Text>
            <View style={styles.tagsContainer}>
              {link.tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>#{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Notes Section */}
        {link.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <View style={styles.notesCard}>
              <Text style={styles.notesText}>{link.notes}</Text>
            </View>
          </View>
        )}

        {/* AI Summary Section */}
        {link.summary && (
          <View style={styles.section}>
            <View style={styles.aiSectionHeader}>
              <Ionicons name="sparkles" size={20} color="#6366f1" />
              <Text style={styles.sectionTitle}>AI Summary</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryText}>{link.summary}</Text>
            </View>
          </View>
        )}

        {/* Metadata Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Details</Text>
          <View style={styles.metadataCard}>
            <View style={styles.metadataItem}>
              <Text style={styles.metadataLabel}>URL</Text>
              <TouchableOpacity onPress={handleOpenLink}>
                <Text style={styles.metadataValue} numberOfLines={2}>
                  {link.url}
                </Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.metadataDivider} />
            
            <View style={styles.metadataItem}>
              <Text style={styles.metadataLabel}>Platform</Text>
              <Text style={styles.metadataValue}>{link.platform || 'Website'}</Text>
            </View>
            
            <View style={styles.metadataDivider} />
            
            <View style={styles.metadataItem}>
              <Text style={styles.metadataLabel}>Category</Text>
              <Text style={styles.metadataValue}>{link.category || 'General'}</Text>
            </View>
            
            <View style={styles.metadataDivider} />
            
            <View style={styles.metadataItem}>
              <Text style={styles.metadataLabel}>Mood</Text>
              <Text style={styles.metadataValue}>{link.mood || 'Neutral'}</Text>
            </View>
            
            <View style={styles.metadataDivider} />
            
            <View style={styles.metadataItem}>
              <Text style={styles.metadataLabel}>Saved</Text>
              <Text style={styles.metadataValue}>
                {new Date(link.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </Text>
            </View>
          </View>
        </View>

        {/* Related Links Section (Placeholder) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Related Links</Text>
          <View style={styles.relatedCard}>
            <Ionicons name="compass-outline" size={24} color="#6366f1" />
            <View style={styles.relatedContent}>
              <Text style={styles.relatedTitle}>Discover Similar Content</Text>
              <Text style={styles.relatedText}>
                AI-powered recommendations based on this link coming soon!
              </Text>
            </View>
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
    paddingBottom: 100, // Extra padding for bottom navigation
  },
  previewCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  previewImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#f3f4f6',
  },
  previewContent: {
    padding: 16,
  },
  linkTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
    lineHeight: 28,
  },
  linkDescription: {
    fontSize: 16,
    color: '#6b7280',
    lineHeight: 24,
    marginBottom: 16,
  },
  linkMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  platformBadge: {
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  platformText: {
    fontSize: 12,
    color: '#6366f1',
    fontWeight: '600',
  },
  linkDomain: {
    fontSize: 12,
    color: '#9ca3af',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  actionButton: {
    alignItems: 'center',
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
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
  aiSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  tag: {
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
  notesCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  notesText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  summaryCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#6366f1',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  summaryText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  metadataCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  metadataItem: {
    padding: 16,
  },
  metadataDivider: {
    height: 1,
    backgroundColor: '#f3f4f6',
    marginHorizontal: 16,
  },
  metadataLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
    marginBottom: 4,
  },
  metadataValue: {
    fontSize: 14,
    color: '#1f2937',
    lineHeight: 18,
  },
  relatedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  relatedContent: {
    flex: 1,
    marginLeft: 12,
  },
  relatedTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  relatedText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 18,
  },
});