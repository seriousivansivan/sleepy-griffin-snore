import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import DashboardClient from './dashboard-client'; // We will create this next
import type { Voucher } from '@/components/voucher-list'; // Adjust path if needed
import type { Profile } from '@/types'; // You might need to create this type based on your profile structure

// Helper function to get the profile.
// You likely have this logic in your SupabaseAuthProvider,
// so you can move it here.
async function getProfile(supabase: any, userId: string) {
  const { data: profile, error }_ =_ await supabase
    .from('profiles')
    .select('*') // Be more specific here if you can, e.g., 'user_name, credit, ...'
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }
  return profile as Profile; // Cast to your Profile type
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
  if (!profile || !profile.user_name || profile.user_companies?.length === 0) {
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
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching vouchers:', error);
    // You could render an error state here
  }

  // 6. Pass all server-fetched data to the Client Component
  return <DashboardClient profile={profile} initialVouchers={vouchers as Voucher[] || []} />;
}