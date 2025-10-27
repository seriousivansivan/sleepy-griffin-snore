"use client";

import { useState, useEffect } from "react";
import { useSupabaseAuth } from "@/components/providers/supabase-auth-provider";
import { toast } from "sonner";

export function useUserEmail(userId: string) {
  const { supabase } = useSupabaseAuth();
  const [email, setEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setEmail(null);
      setIsLoading(false);
      return;
    }

    const fetchEmail = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke(
          "admin-get-user-email",
          {
            body: { userId },
          }
        );

        if (error) throw error;

        if (data.email) {
          setEmail(data.email);
        } else {
          setEmail("Email not available");
        }
      } catch (error) {
        console.error("Error fetching user email:", error);
        setEmail("Error loading email");
        // Do not show toast error here, as it might be distracting.
      } finally {
        setIsLoading(false);
      }
    };

    fetchEmail();
  }, [userId, supabase]);

  return { email, isLoading };
}