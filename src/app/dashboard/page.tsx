import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies as nextCookies } from 'next/headers'; // Rename import to avoid conflict
import { redirect } from 'next/navigation';
import DashboardClient from './dashboard-client';
import type { Voucher } from '@/components/voucher-list';
import type { Profile } from '@/components/providers/supabase-auth-provider';

// Helper function to get the profile.
async function getProfile(supabase: any, userId: string) {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*, user_companies(company_id)')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }
  return profile as Profile;
}

export default async function DashboardPage() {
  // Explicitly wrap nextCookies() in a function to satisfy Next.js 15's dynamic API usage warning.
  const supabase = createServerComponentClient({ cookies: () => nextCookies() });

  // 1. Get the session
  const { data: { session } } = await supabase.auth.getSession();

  // 2. Handle unauthenticated users
  if (!session) {
    redirect('/login');
  }

  // 3. Get the user's profile
  const profile = await getProfile(supabase, session.user.id);

  // 4. Handle profile completion
  if (!profile || !profile.user_name || profile.user_companies.length === 0) {
    redirect('/complete-profile');
  }

  // 5. Fetch initial data (vouchers)
  const { data: vouchers, error } = await supabase
    .from('vouchers')
    .select(`
      *,
      companies(*),
      user:profiles!user_id(id, user_name)
    `)
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching vouchers:', error);
  }

  // 6. Pass all server-fetched data to the Client Component
  return <DashboardClient profile={profile} initialVouchers={vouchers as Voucher[] || []} />;
}