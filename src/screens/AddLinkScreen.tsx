import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';
import { extractOpenGraphData } from '../services/openGraphService';
import { classifyContent } from '../services/aiService';
import { useAuth } from '../contexts/AuthContext';
import { useLinks } from '../hooks/useCloudSync';
import { Link } from '../types';
import { debugDatabaseConnection } from '../utils/debugDatabase';

// Helper function to determine category from platform
const determineCategoryFromPlatform = (platform: string): string => {
  const platformCategories: Record<string, string> = {
    'YouTube': 'video',
    'Vimeo': 'video',
    'TikTok': 'video',
    'Twitch': 'video',
    'Instagram': 'social',
    'Twitter': 'social',
    'LinkedIn': 'professional',
    'GitHub': 'development', 
    'Medium': 'article',
    'Pinterest': 'visual',
    'Dribbble': 'design',
    'Behance': 'design',
    'Reddit': 'discussion',
  };
  
  return platformCategories[platform] || 'general';
};

// Helper function to generate tags from content
const generateTagsFromContent = (title: string, description: string, notes: string, platform: string): string[] => {
  const tags: string[] = [];
  
  // Add platform tag
  if (platform && platform !== 'Website') {
    tags.push(platform.toLowerCase());
  }
  
  // Combine all text content for analysis
  const allText = `${title} ${description} ${notes}`.toLowerCase();
  
  // Define keyword-to-tag mappings
  const tagMappings: Record<string, string[]> = {
    'tutorial': ['tutorial', 'how to', 'guide', 'learn', 'course', 'lesson'],
    'news': ['news', 'breaking', 'report', 'update', 'announcement'],
    'entertainment': ['funny', 'comedy', 'entertainment', 'fun', 'meme', 'viral'],
    'technology': ['tech', 'technology', 'coding', 'programming', 'software', 'ai', 'machine learning'],
    'design': ['design', 'ui', 'ux', 'graphic', 'visual', 'typography', 'branding'],
    'business': ['business', 'startup', 'entrepreneur', 'marketing', 'sales', 'finance'],
    'health': ['health', 'fitness', 'medical', 'wellness', 'exercise', 'nutrition'],
    'travel': ['travel', 'vacation', 'trip', 'destination', 'tourism'],
    'food': ['food', 'recipe', 'cooking', 'restaurant', 'cuisine'],
    'music': ['music', 'song', 'artist', 'album', 'playlist', 'concert'],
    'sports': ['sports', 'football', 'basketball', 'soccer', 'baseball', 'hockey'],
    'gaming': ['gaming', 'game', 'video game', 'esports', 'streaming'],
    'education': ['education', 'school', 'university', 'academic', 'research'],
    'science': ['science', 'research', 'study', 'experiment', 'discovery'],
  };
  
  // Check for keyword matches
  for (const [tag, keywords] of Object.entries(tagMappings)) {
    if (keywords.some(keyword => allText.includes(keyword))) {
      tags.push(tag);
    }
  }
  
  // Ensure we have at least one tag
  if (tags.length === 0) {
    tags.push('general');
  }
  
  // Remove duplicates and limit to 5 tags
  return [...new Set(tags)].slice(0, 5);
};

// Enhanced tag generation with AI classification
const generateEnhancedTags = async (ogData: any, notes: string): Promise<string[]> => {
  // Start with basic tags
  const basicTags = generateTagsFromContent(ogData.title, ogData.description, notes, ogData.platform);
  
  try {
    // Try to get AI-enhanced tags using the full OpenGraph data
    console.log('🤖 Getting AI classification for content...');
    const aiResult = await classifyContent(ogData);
    
    if (aiResult.success && aiResult.data.tags && aiResult.data.tags.length > 0) {
      console.log('✅ AI tags generated:', aiResult.data.tags);
      
      // Combine basic tags with AI tags, removing duplicates
      const combinedTags = [...basicTags, ...aiResult.data.tags];
      return [...new Set(combinedTags)].slice(0, 5);
    }
  } catch (error) {
    console.log('⚠️ AI classification failed, using basic tags:', error);
  }
  
  // Fallback to basic tags
  return basicTags;
};

interface AddLinkScreenProps {
  navigation: {
    goBack: () => void;
  };
}

interface LinkData extends Partial<Link> {
  url: string;
  title?: string;
  description?: string;
  image_url?: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

export default function AddLinkScreen({ navigation }: AddLinkScreenProps): React.ReactElement {
  const { user } = useAuth();
  const { createLink } = useLinks();
  const [url, setUrl] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>('');
  const [customTags, setCustomTags] = useState<string>('');

  const handlePasteFromClipboard = async (): Promise<void> => {
    try {
      const clipboardContent = await Clipboard.getStringAsync();
      if (clipboardContent) {
        setUrl(clipboardContent);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to paste from clipboard');
    }
  };

  const validateUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleSaveLink = async (): Promise<void> => {
    if (!url.trim()) {
      Alert.alert('Error', 'Please enter a URL');
      return;
    }

    if (!validateUrl(url)) {
      Alert.alert('Error', 'Please enter a valid URL');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'You must be logged in to save links');
      return;
    }

    setLoading(true);

    try {
      // Step 1: Extract OpenGraph metadata from URL
      console.log('🔍 Extracting metadata from URL...');
      setLoading(true);
      
      const ogResult = await extractOpenGraphData(url.trim());
      
      let linkData: LinkData;
      
      if (ogResult.success && ogResult.data) {
        console.log('✅ OpenGraph data extracted:', ogResult.data);
        
        // Use extracted metadata with user notes as fallback
        linkData = {
          url: url.trim(),
          title: ogResult.data.title || 'Untitled Link',
          description: notes.trim() || ogResult.data.description || 'No description',
          image_url: ogResult.data.image || null,
          favicon_url: `https://www.google.com/s2/favicons?domain=${ogResult.data.domain}&sz=32`,
          category: determineCategoryFromPlatform(ogResult.data.platform),
          tags: await generateEnhancedTags(ogResult.data, notes),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      } else {
        console.log('⚠️ OpenGraph extraction failed, using basic data:', ogResult.error);
        
        // Fallback to basic data
        linkData = {
          url: url.trim(),
          title: notes.trim() || 'Link from ' + new Date().toLocaleString(),
          description: notes.trim() || 'No description',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      }

      console.log('📝 Final link data prepared:', linkData);

      // Step 2: Save to cloud database (now with automatic profile creation)
      console.log('💾 Saving link to database...');
      const { data, error } = await createLink(linkData);
      
      if (error) {
        console.error('❌ Save error details:', error);
        throw error;
      }

      if (!data) {
        throw new Error('No data returned from save operation');
      }

      console.log('✅ Link saved successfully with ID:', data.id);
      Alert.alert(
        'Success!',
        'Link saved successfully',
        [
          {
            text: 'Add Another',
            onPress: () => {
              setUrl('');
              setNotes('');
              setCustomTags('');
            }
          },
          {
            text: 'Go Home',
            onPress: () => navigation.goBack()
          }
        ]
      );

    } catch (error) {
      console.error('Error saving link:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      Alert.alert(
        'Error', 
        `Failed to save link: ${errorMessage}\n\nPlease check your internet connection and try again.`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
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
          <Text style={styles.headerTitle}>Add New Link</Text>
          <View style={styles.placeholder} />
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Link URL</Text>
          <View style={styles.urlInputContainer}>
            <TextInput
              style={styles.urlInput}
              placeholder="Paste or enter URL here..."
              value={url}
              onChangeText={setUrl}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              multiline
            />
            <TouchableOpacity
              style={styles.pasteButton}
              onPress={handlePasteFromClipboard}
            >
              <Ionicons name="clipboard-outline" size={20} color="#6366f1" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes (Optional)</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="Add your thoughts, notes, or context..."
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Custom Tags (Optional)</Text>
          <TextInput
            style={styles.tagsInput}
            placeholder="Enter tags separated by commas (e.g., inspiration, work, tutorial)"
            value={customTags}
            onChangeText={setCustomTags}
            autoCapitalize="none"
          />
          <Text style={styles.helperText}>
            AI will automatically suggest tags, but you can add your own here
          </Text>
        </View>

        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
            onPress={handleSaveLink}
            disabled={loading}
          >
            <LinearGradient
              colors={loading ? ['#9ca3af', '#9ca3af'] : ['#6366f1', '#8b5cf6']}
              style={styles.saveButtonGradient}
            >
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator color="white" />
                  <Text style={styles.saveButtonText}>Processing...</Text>
                </View>
              ) : (
                <View style={styles.saveButtonContent}>
                  <Ionicons name="bookmark" size={20} color="white" />
                  <Text style={styles.saveButtonText}>Save Link</Text>
                </View>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <View style={styles.infoCard}>
            <Ionicons name="information-circle-outline" size={24} color="#6366f1" />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>How it works</Text>
              <Text style={styles.infoText}>
                • We'll automatically fetch the title, description, and image
                {'\n'}• AI will categorize and tag your content
                {'\n'}• You can organize links into collections later
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  urlInputContainer: {
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
  urlInput: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
    minHeight: 40,
  },
  pasteButton: {
    padding: 8,
    marginLeft: 8,
  },
  notesInput: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1f2937',
    minHeight: 100,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tagsInput: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1f2937',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  helperText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 6,
    fontStyle: 'italic',
  },
  saveButton: {
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  saveButtonDisabled: {
    elevation: 0,
    shadowOpacity: 0,
  },
  saveButtonGradient: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 12,
    color: '#6b7280',
    lineHeight: 18,
  },
});