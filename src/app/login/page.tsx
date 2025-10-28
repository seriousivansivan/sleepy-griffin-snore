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

  // Fixed blue color HSL values for the button
  const fixedBlue = "210 40% 50%"; // A moderate blue
  const fixedBlueHover = "210 40% 40%";

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted p-4">
      <div className="w-full max-w-4xl rounded-xl shadow-2xl overflow-hidden grid md:grid-cols-2 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-100">
        {/* Left Column (Branding) */}
        <div className="hidden md:flex flex-col justify-between p-8 bg-primary text-primary-foreground">
          <div className="flex items-center gap-3">
            <Image
              src="/siLogo.png"
              alt="App Logo"
              width={40}
              height={40}
              className="bg-white p-1 rounded-md"
            />
            <span className="text-xl font-bold">Petty Cash Voucher System</span>
          </div>
          
          {/* Animated GIF */}
          <div className="flex justify-center items-center py-8">
            <img
              src="/Login.gif"
              alt="Login Animation"
              className="max-w-full h-auto"
              style={{ maxHeight: '200px' }}
            />
          </div>

          <p className="text-sm text-primary-foreground/80">
            Streamline your expense management with ease and precision.
          </p>
        </div>

        {/* Right Column (Form) */}
        <div className="p-8 bg-card">
          <div className="mx-auto w-full max-w-sm space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold tracking-tight">
                Welcome Back
              </h2>
              <p className="mt-2 text-muted-foreground">
                Sign in to manage your petty cash vouchers.
              </p>
            </div>
            <Auth
              supabaseClient={supabase}
              appearance={{
                theme: ThemeSupa,
                variables: {
                  default: {
                    colors: {
                      brand: `hsl(${fixedBlue})`,
                      brandAccent: `hsl(${fixedBlueHover})`,
                      inputBackground: "hsl(var(--input))",
                      inputBorder: "hsl(var(--border))",
                      inputLabelText: "hsl(var(--foreground))",
                      inputText: "hsl(var(--foreground))",
                      defaultButtonBackground: `hsl(${fixedBlue})`,
                      defaultButtonText: "hsl(0 0% 98%)", // Fixed white text
                      defaultButtonBackgroundHover: `hsl(${fixedBlueHover})`,
                    },
                    radii: {
                      borderRadiusButton: "0.5rem",
                      inputBorderRadius: "0.5rem",
                    },
                  },
                },
              }}
              providers={[]}
              theme="light"
            />
          </div>
        </div>
      </div>
    </div>
  );
}