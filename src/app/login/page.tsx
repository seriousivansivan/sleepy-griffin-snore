"use client";

import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { useSupabaseAuth } from "@/components/providers/supabase-auth-provider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Image from "next/image";

export default function LoginPage() {
  const { session, loading } = useSupabaseAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && session) {
      router.replace("/dashboard");
    }
  }, [session, loading, router]);

  if (loading || session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center animated-gradient-bg p-4">
      <div className="max-w-md w-full space-y-8 animate-in fade-in slide-in-from-bottom-10 duration-700">
        <div className="text-center text-white">
          <Image
            src="/siLogo.png"
            alt="App Logo"
            width={64}
            height={64}
            className="mx-auto mb-4"
          />
          <h2 className="text-4xl font-extrabold tracking-tight">
            Welcome Back
          </h2>
          <p className="mt-2 text-lg opacity-80">
            Sign in to manage your petty cash vouchers.
          </p>
        </div>
        <div className="p-8 rounded-xl shadow-2xl backdrop-blur-md bg-white/10 border border-white/20">
          <Auth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: "hsl(var(--primary))",
                    brandAccent: "hsl(var(--primary-foreground))",
                    // Customizing the Auth component to fit the dark/glass theme
                    inputBackground: "rgba(255, 255, 255, 0.1)",
                    inputBorder: "rgba(255, 255, 255, 0.3)",
                    inputLabelText: "hsl(0 0% 98%)",
                    inputText: "hsl(0 0% 98%)",
                    defaultButtonBackground: "hsl(var(--primary))",
                    defaultButtonText: "hsl(var(--primary-foreground))",
                    defaultButtonBackgroundHover: "hsl(var(--primary) / 0.9)",
                  },
                  radii: {
                    borderRadiusButton: "0.5rem",
                    inputBorderRadius: "0.5rem",
                  },
                },
              },
            }}
            providers={[]}
            theme="dark" // Use dark theme for better contrast against the background
          />
        </div>
      </div>
    </div>
  );
}