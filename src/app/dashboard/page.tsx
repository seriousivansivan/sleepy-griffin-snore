import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import DashboardClient from './dashboard-client';
import type { Voucher } from '@/components/voucher-list';
import type { Profile } from '@/components/providers/supabase-auth-provider'; // Corrected import path for Profile type

// Helper function to get the profile.
async function getProfile(supabase: any, userId: string) {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*, user_companies(company_id)') // Select user_companies as well
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }
  return profile as Profile;
}

export default async function DashboardPage() {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });

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
    .eq('user_id', session.user.id) // Filter vouchers by the current user
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching vouchers:', error);
    // You could render an error state here
  }

  // 6. Pass all server-fetched data to the Client Component
  return <DashboardClient profile={profile} initialVouchers={vouchers as Voucher[] || []} />;
}