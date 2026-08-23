'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export type Asset = {
  id: string;
  name: string;
  asset_type: string;
  jurisdiction: string | null;
  status: string;
  current_value: number | null;
  risk_score: number | null;
  compliance_score: number | null;
  created_at: string;
};

export function useAssets() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    const { data, error: queryError } = await supabase.from('assets').select('*').order('created_at', { ascending: false });
    setAssets((data as Asset[]) ?? []);
    setError(queryError?.message ?? null);
    setLoading(false);
  }

  useEffect(() => { refresh(); }, []);

  async function createAsset(input: Pick<Asset, 'name' | 'asset_type' | 'jurisdiction'> & { current_value?: number }) {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('You must be signed in.');
    const { data: profile, error: profileError } = await supabase.from('profiles').select('organization_id').eq('id', userData.user.id).single();
    if (profileError || !profile?.organization_id) throw new Error('Your account is not linked to an organization yet.');
    const { data, error: insertError } = await supabase.from('assets').insert({ ...input, organization_id: profile.organization_id, created_by: userData.user.id }).select().single();
    if (insertError) throw insertError;
    await refresh();
    return data as Asset;
  }

  return { assets, loading, error, refresh, createAsset };
}
