// Add this line at the very top.
export const dynamic = 'force-dynamic';

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import DashboardClient from './dashboard-client'; // We will create this
import type { Voucher } from '@/components/voucher-list'; // Adjust path if needed
import type { Profile } from '@/types'; // You probably need to create this type

// Helper function to get the profile
async function getProfile(supabase: any, userId: string) {
  const { data: profile, error }_ =_ await supabase
    .from('profiles')
    .select('*') // Be specific here if you can
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }
  return profile as Profile;
}

// This is your main page. It's now an ASYNC server component.
export default async function DashboardPage() {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });

  // 1. Get the user
  const { data: { user } } = await supabase.auth.getUser();

  // 2. If NO user, redirect to login
  if (!user) {
    redirect('/login');
  }

  // 3. User exists, so get their profile
  const profile = await getProfile(supabase, user.id);

  // 4. If profile is NOT complete, redirect to profile setup
  if (!profile || !profile.user_name || profile.user_companies?.length === 0) {
    redirect('/complete-profile'); // Or '/dashboard/profile'
  }

  // 5. All checks passed! Fetch the voucher data
  const { data: vouchers, error } = await supabase
    .from('vouchers')
    .select(`
      *,
      companies(*),
      user:profiles!user_id(id, user_name)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching vouchers:', error);
  }

  // 6. Render the CLIENT component, passing all the data as props
  return (
    <DashboardClient 
      profile={profile} 
      initialVouchers={vouchers as Voucher[] || []} 
    />
  );
}