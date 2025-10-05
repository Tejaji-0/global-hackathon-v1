import React, { useState, useMemo, useEffect } from 'react';
import { View, Image, ActivityIndicator, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface EnhancedThumbnailProps {
  imageUrl?: string;
  category?: string;
  style?: any;
  fallbackIconSize?: number;
  showLoadingState?: boolean;
}

// Helper function to decode HTML entities including numeric ones
const decodeHTMLEntities = (text: string): string => {
  let decoded = text
    // Named entities
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&apos;/g, "'");

  // Decode numeric HTML entities (decimal) like &#064; -> @
  decoded = decoded.replace(/&#(\d+);/g, (match, num) => {
    try {
      return String.fromCharCode(parseInt(num, 10));
    } catch {
      return match;
    }
  });

  // Decode hexadecimal HTML entities like &#x40; -> @
  decoded = decoded.replace(/&#x([0-9a-fA-F]+);/g, (match, hex) => {
    try {
      return String.fromCharCode(parseInt(hex, 16));
    } catch {
      return match;
    }
  });

  return decoded;
};

// Helper function to clean and decode image URLs
const cleanImageUrl = (url: string): string => {
  // Handle JSON escaped strings
  let cleanUrl = url.replace(/\\u0026/g, '&');
  cleanUrl = cleanUrl.replace(/\\"/g, '"');
  cleanUrl = cleanUrl.replace(/\\\//g, '/');
  cleanUrl = cleanUrl.replace(/\\/g, '');
  
  // Comprehensive HTML entity decoding
  cleanUrl = decodeHTMLEntities(cleanUrl);
  
  // Additional Instagram CDN URL fixes
  if (cleanUrl.includes('cdninstagram.com')) {
    // Ensure proper URL structure
    cleanUrl = cleanUrl.trim();
    
    // Fix double-encoded parameters
    cleanUrl = cleanUrl.replace(/%26/g, '&');
    cleanUrl = cleanUrl.replace(/%3D/g, '=');
    cleanUrl = cleanUrl.replace(/%2F/g, '/');
  }
  
  return cleanUrl;
};

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

export const EnhancedThumbnail: React.FC<EnhancedThumbnailProps> = ({
  imageUrl,
  category,
  style,
  fallbackIconSize = 32,
  showLoadingState = true
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  
  // Animation values for modern UI
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.9);

  // Clean and memoize the image URL to handle HTML entities
  const cleanedImageUrl = useMemo(() => {
    if (!imageUrl) return undefined;
    const cleaned = cleanImageUrl(imageUrl);
    
    // Log URL cleaning for Instagram URLs
    if (imageUrl.includes('cdninstagram.com') && imageUrl !== cleaned) {
      console.log('🔧 Cleaned Instagram URL:', {
        original: imageUrl.substring(0, 100) + '...',
        cleaned: cleaned.substring(0, 100) + '...',
        hadEntities: imageUrl.includes('&amp;')
      });
    }
    
    return cleaned;
  }, [imageUrl]);

  const handleLoadStart = () => {
    if (showLoadingState) {
      setLoading(true);
    }
    setError(false);
  };

  const handleLoadEnd = () => {
    setLoading(false);
    // Animate image appearance
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
    ]).start();
  };

  const handleError = () => {
    setLoading(false);
    setError(true);
    console.log('🖼️ Failed to load thumbnail:', cleanedImageUrl);
  };

  // If no image URL or error occurred, show fallback with gradient
  if (!cleanedImageUrl || error) {
    return (
      <View style={[styles.placeholder, style]}>
        <LinearGradient
          colors={['#f1f5f9', '#e2e8f0']}
          style={[styles.gradientPlaceholder, style]}
        >
          <Ionicons 
            name={getIconForCategory(category)} 
            size={fallbackIconSize} 
            color="#6366f1" 
          />
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        }}
      >
        <Image
          source={{ uri: cleanedImageUrl }}
          style={[styles.image, style]}
          onLoadStart={handleLoadStart}
          onLoadEnd={handleLoadEnd}
          onError={handleError}
          resizeMode="cover"
        />
      </Animated.View>
      {loading && showLoadingState && (
        <View style={styles.loadingOverlay}>
          <LinearGradient
            colors={['rgba(99, 102, 241, 0.1)', 'rgba(139, 92, 246, 0.1)']}
            style={styles.loadingGradient}
          >
            <ActivityIndicator size="small" color="#6366f1" />
          </LinearGradient>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 12,
  },
  image: {
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
  },
  placeholder: {
    overflow: 'hidden',
    borderRadius: 12,
  },
  gradientPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  loadingGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
});

export default EnhancedThumbnail;