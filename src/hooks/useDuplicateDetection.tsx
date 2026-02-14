import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface NearbyIssue {
  id: string;
  title: string;
  issue_type: string;
  status: string;
  latitude: number;
  longitude: number;
  address: string | null;
  distance_km: number;
  created_at: string;
}

export function useDuplicateDetection() {
  const [nearbyIssues, setNearbyIssues] = useState<NearbyIssue[]>([]);
  const [isChecking, setIsChecking] = useState(false);

  const checkDuplicates = useCallback(async (
    latitude: number,
    longitude: number,
    title: string,
    radiusKm: number = 0.5
  ) => {
    if (!latitude || !longitude) return;
    
    setIsChecking(true);
    try {
      const { data, error } = await supabase.rpc('find_nearby_issues', {
        p_latitude: latitude,
        p_longitude: longitude,
        p_title: title || '',
        p_radius_km: radiusKm,
      });

      if (error) {
        console.error('Duplicate detection error:', error);
        setNearbyIssues([]);
        return;
      }

      // Also filter by title similarity (simple word matching)
      const titleWords = title.toLowerCase().split(/\s+/).filter(w => w.length > 3);
      
      const scored = (data || []).map((issue: any) => {
        const issueWords = issue.title.toLowerCase().split(/\s+/);
        const matchCount = titleWords.filter(w => issueWords.some((iw: string) => iw.includes(w) || w.includes(iw))).length;
        const similarity = titleWords.length > 0 ? matchCount / titleWords.length : 0;
        return { ...issue, similarity };
      });

      // Show issues that are nearby (within radius) - sorted by distance
      setNearbyIssues(scored);
    } catch (err) {
      console.error('Duplicate detection failed:', err);
      setNearbyIssues([]);
    } finally {
      setIsChecking(false);
    }
  }, []);

  const clearDuplicates = useCallback(() => {
    setNearbyIssues([]);
  }, []);

  return { nearbyIssues, isChecking, checkDuplicates, clearDuplicates };
}
