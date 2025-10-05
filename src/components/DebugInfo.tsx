import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface DebugInfoProps {
  visible?: boolean;
}

export default function DebugInfo({ visible = true }: DebugInfoProps): React.ReactElement | null {
  const [showDetails, setShowDetails] = React.useState<boolean>(false);
  
  if (!visible) return null;

  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'not set';
  const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'not set';
  const openaiKey = process.env.OPENAI_API_KEY || 'not set';

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={[styles.header, styles.production]}
        onPress={() => setShowDetails(!showDetails)}
      >
        <Ionicons 
          name="cloud-outline"
          size={16} 
          color="white" 
        />
        <Text style={styles.headerText}>
          🟢 PRODUCTION MODE
        </Text>
        <Ionicons 
          name={showDetails ? "chevron-up" : "chevron-down"} 
          size={16} 
          color="white" 
        />
      </TouchableOpacity>
      
      {showDetails && (
        <View style={styles.details}>
          <Text style={styles.detailTitle}>Configuration Status:</Text>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Supabase URL:</Text>
            <Text style={[styles.detailValue, supabaseUrl !== 'not set' ? styles.success : styles.error]}>
              {supabaseUrl === 'not set' ? 'Not configured' : `${supabaseUrl.substring(0, 30)}...`}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Supabase Key:</Text>
            <Text style={[styles.detailValue, supabaseKey !== 'not set' ? styles.success : styles.error]}>
              {supabaseKey === 'not set' ? 'Not configured' : `${supabaseKey.substring(0, 20)}...`}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>OpenAI Key:</Text>
            <Text style={[styles.detailValue, openaiKey !== 'not set' ? styles.success : styles.error]}>
              {openaiKey === 'not set' ? 'Not configured' : `${openaiKey.substring(0, 15)}...`}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Client Type:</Text>
            <Text style={[styles.detailValue, styles.success]}>
              Real Supabase Client
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 40,
    right: 10,
    zIndex: 1000,
    maxWidth: 300,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  production: {
    backgroundColor: '#10b981',
  },
  headerText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  details: {
    backgroundColor: 'white',
    marginTop: 4,
    padding: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  detailTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#374151',
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 6,
    alignItems: 'flex-start',
  },
  detailLabel: {
    fontSize: 11,
    color: '#6b7280',
    width: 80,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 11,
    flex: 1,
  },
  success: {
    color: '#10b981',
  },
  warning: {
    color: '#f59e0b',
  },
  error: {
    color: '#ef4444',
  },
  helpBox: {
    backgroundColor: '#f3f4f6',
    padding: 8,
    borderRadius: 6,
    marginTop: 8,
  },
  helpText: {
    fontSize: 10,
    color: '#374151',
    lineHeight: 14,
  },
});