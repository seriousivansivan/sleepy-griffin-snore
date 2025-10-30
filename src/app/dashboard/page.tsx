import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import DashboardClient from './dashboard-client';
import type { Voucher } from '@/components/voucher-list';
import type { Profile } from '@/types';

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
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });

  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  const profile = await getProfile(supabase, session.user.id);

  if (!profile || !profile.user_name || profile.user_companies.length === 0) {
    redirect('/complete-profile');
  }

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
    // You could render an error state here, or redirect to a generic error page
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Error loading dashboard data.</p>
      </div>
    );
  }

  return <DashboardClient profile={profile} initialVouchers={vouchers as Voucher[] || []} />;
}