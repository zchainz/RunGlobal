import { supabase } from './supabase.js';

export const db = {
  async getProfile(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async updateProfile(userId, updates) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getAllProfiles() {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('rank', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getHealthData(userId) {
    const { data, error } = await supabase
      .from('health_data')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async upsertHealthData(userId, healthData) {
    const { data, error } = await supabase
      .from('health_data')
      .upsert({
        user_id: userId,
        ...healthData
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getUserRaces(userId) {
    const { data, error } = await supabase
      .from('races')
      .select(`
        *,
        challenger:profiles!races_challenger_id_fkey(username, full_name, picture),
        opponent:profiles!races_opponent_id_fkey(username, full_name, picture),
        winner:profiles!races_winner_id_fkey(username, full_name)
      `)
      .or(`challenger_id.eq.${userId},opponent_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async createRace(challengerId, raceData) {
    const { data, error } = await supabase
      .from('races')
      .insert({
        challenger_id: challengerId,
        challenger_data: raceData,
        status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateRace(raceId, updates) {
    const { data, error } = await supabase
      .from('races')
      .update(updates)
      .eq('id', raceId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};
