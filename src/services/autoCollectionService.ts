/**
 * Auto Collection Service
 * Automatically creates collections and assigns links based on content analysis
 */

import { LinkCategorizer, COLLECTION_CATEGORIES } from './linkCategorizer';
import { supabase } from './supabase';

export interface AutoCollectionResult {
  collectionId?: string;
  collectionName?: string;
  wasCreated: boolean;
  confidence: number;
  reason: string;
}

export interface LinkWithMetadata {
  url: string;
  title?: string;
  description?: string;
  imageUrl?: string;
  userId: string;
}

export class AutoCollectionService {
  /**
   * Process a new link and automatically assign it to a collection
   */
  static async processLinkForAutoCollection(
    link: LinkWithMetadata,
    existingCollections: Array<{ id: string; name: string; user_id: string }>
  ): Promise<AutoCollectionResult> {
    try {
      console.log('🤖 Processing link for auto-collection:', link.url);
      
      // Analyze the link to determine category
      const categoryMatch = LinkCategorizer.categorizeLink(
        link.url,
        link.title,
        link.description
      );
      
      if (!categoryMatch || categoryMatch.confidence < 0.3) {
        return {
          wasCreated: false,
          confidence: categoryMatch?.confidence || 0,
          reason: 'Confidence too low for auto-assignment'
        };
      }
      
      console.log('🎯 Category match found:', {
        category: categoryMatch.category.name,
        confidence: categoryMatch.confidence,
        reasons: categoryMatch.reasons
      });
      
      // Check if a suitable collection already exists
      const existingCollectionNames = existingCollections.map(c => c.name);
      const suggestedName = LinkCategorizer.getSuggestedCollectionName(
        categoryMatch.category,
        existingCollectionNames
      );
      
      let targetCollection = existingCollections.find(
        c => c.name.toLowerCase() === suggestedName.toLowerCase()
      );
      
      let wasCreated = false;
      
      // Create collection if it doesn't exist and confidence is high enough
      if (!targetCollection && categoryMatch.confidence >= 0.5) {
        console.log('✨ Auto-creating collection:', suggestedName);
        
        const { data: newCollection, error } = await supabase
          .from('collections')
          .insert({
            name: suggestedName,
            description: categoryMatch.category.description,
            user_id: link.userId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();
          
        if (error) {
          console.error('❌ Error creating auto-collection:', error);
          return {
            wasCreated: false,
            confidence: categoryMatch.confidence,
            reason: `Failed to create collection: ${error.message}`
          };
        }
        
        targetCollection = {
          id: newCollection.id,
          name: newCollection.name,
          user_id: newCollection.user_id
        };
        wasCreated = true;
      }
      
      if (targetCollection) {
        return {
          collectionId: targetCollection.id,
          collectionName: targetCollection.name,
          wasCreated,
          confidence: categoryMatch.confidence,
          reason: wasCreated 
            ? `Auto-created "${targetCollection.name}" collection`
            : `Assigned to existing "${targetCollection.name}" collection`
        };
      }
      
      return {
        wasCreated: false,
        confidence: categoryMatch.confidence,
        reason: 'Suitable collection exists but confidence not high enough for auto-creation'
      };
      
    } catch (error) {
      console.error('❌ Error in auto-collection processing:', error);
      return {
        wasCreated: false,
        confidence: 0,
        reason: `Processing error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
  
  /**
   * Suggest collections for existing unorganized links
   */
  static async suggestCollectionsForExistingLinks(
    userId: string,
    batchSize: number = 10
  ): Promise<{
    suggestions: Array<{
      linkId: string;
      url: string;
      title?: string;
      suggestedCollection: string;
      confidence: number;
      reasons: string[];
    }>;
    totalProcessed: number;
  }> {
    try {
      // Get unorganized links (not in any collection)
      const { data: unorganizedLinks, error } = await supabase
        .from('links')
        .select('id, url, title, description')
        .eq('user_id', userId)
        .not('id', 'in', 
          supabase
            .from('collection_links')
            .select('link_id')
        )
        .limit(batchSize);
        
      if (error) {
        throw error;
      }
      
      const suggestions = [];
      
      for (const link of unorganizedLinks || []) {
        const categoryMatch = LinkCategorizer.categorizeLink(
          link.url,
          link.title,
          link.description
        );
        
        if (categoryMatch && categoryMatch.confidence >= 0.4) {
          suggestions.push({
            linkId: link.id,
            url: link.url,
            title: link.title,
            suggestedCollection: categoryMatch.category.name,
            confidence: categoryMatch.confidence,
            reasons: categoryMatch.reasons
          });
        }
      }
      
      return {
        suggestions,
        totalProcessed: unorganizedLinks?.length || 0
      };
      
    } catch (error) {
      console.error('❌ Error suggesting collections for existing links:', error);
      return {
        suggestions: [],
        totalProcessed: 0
      };
    }
  }
  
  /**
   * Batch process multiple links for auto-collection
   */
  static async batchProcessLinks(
    links: LinkWithMetadata[],
    existingCollections: Array<{ id: string; name: string; user_id: string }>
  ): Promise<AutoCollectionResult[]> {
    const results: AutoCollectionResult[] = [];
    
    for (const link of links) {
      const result = await this.processLinkForAutoCollection(link, existingCollections);
      results.push(result);
      
      // Update existing collections if a new one was created
      if (result.wasCreated && result.collectionId && result.collectionName) {
        existingCollections.push({
          id: result.collectionId,
          name: result.collectionName,
          user_id: link.userId
        });
      }
    }
    
    return results;
  }
  
  /**
   * Get collection creation suggestions based on user's link patterns
   */
  static async getSmartCollectionSuggestions(
    userId: string
  ): Promise<Array<{
    name: string;
    description: string;
    estimatedLinks: number;
    confidence: number;
    preview: string[];
  }>> {
    try {
      // Get user's recent links for analysis
      const { data: recentLinks, error } = await supabase
        .from('links')
        .select('url, title, description')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);
        
      if (error || !recentLinks?.length) {
        return [];
      }
      
      // Analyze patterns in user's links
      const categoryStats = new Map<string, {
        count: number;
        links: Array<{ url: string; title?: string }>;
        confidence: number;
      }>();
      
      for (const link of recentLinks) {
        const match = LinkCategorizer.categorizeLink(
          link.url,
          link.title,
          link.description
        );
        
        if (match && match.confidence >= 0.4) {
          const categoryName = match.category.name;
          const existing = categoryStats.get(categoryName) || {
            count: 0,
            links: [],
            confidence: 0
          };
          
          existing.count++;
          existing.links.push({ url: link.url, title: link.title });
          existing.confidence = Math.max(existing.confidence, match.confidence);
          categoryStats.set(categoryName, existing);
        }
      }
      
      // Convert to suggestions, filtering for categories with enough links
      const suggestions = [];
      for (const [categoryName, stats] of categoryStats.entries()) {
        if (stats.count >= 3) { // Only suggest if there are 3+ links in category
          const category = COLLECTION_CATEGORIES.find(c => c.name === categoryName);
          if (category) {
            suggestions.push({
              name: category.name,
              description: category.description,
              estimatedLinks: stats.count,
              confidence: stats.confidence,
              preview: stats.links.slice(0, 3).map(l => l.title || l.url)
            });
          }
        }
      }
      
      // Sort by estimated links and confidence
      suggestions.sort((a, b) => {
        const scoreDiff = (b.estimatedLinks * b.confidence) - (a.estimatedLinks * a.confidence);
        return scoreDiff;
      });
      
      return suggestions.slice(0, 6); // Return top 6 suggestions
      
    } catch (error) {
      console.error('❌ Error getting smart collection suggestions:', error);
      return [];
    }
  }
}