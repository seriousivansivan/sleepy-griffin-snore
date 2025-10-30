import { Tables } from "./supabase";

export type Profile = Tables<'profiles'> & {
  user_companies: { company_id: string }[];
};