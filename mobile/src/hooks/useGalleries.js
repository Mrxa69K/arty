import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../config/supabase';
import { useAuth } from '../contexts/AuthContext';

export function useGalleries() {
  const { user } = useAuth();
  const [galleries, setGalleries] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchGalleries = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('galleries')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      if (!error) setGalleries(data || []);
    } catch (err) {
      console.error('Error fetching galleries:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchGalleries(); }, [fetchGalleries]);

  const createGallery = async (galleryData) => {
    const { data, error } = await supabase
      .from('galleries')
      .insert({ owner_id: user.id, ...galleryData })
      .select()
      .single();
    if (!error) setGalleries(prev => [data, ...prev]);
    return { data, error };
  };

  const deleteGallery = async (galleryId) => {
    const { error } = await supabase.from('galleries').delete().eq('id', galleryId);
    if (!error) setGalleries(prev => prev.filter(g => g.id !== galleryId));
    return { error };
  };

  return { galleries, loading, fetchGalleries, createGallery, deleteGallery };
}
