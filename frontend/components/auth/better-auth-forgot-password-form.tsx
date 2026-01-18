"use client";

import * as React from "react";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestPasswordReset } from "@/lib/auth-client";

export function BetterAuthForgotPasswordForm() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;

    try {
      // Use the named export from lib/auth-client
      const { data, error } = await requestPasswordReset({
        email,
        redirectTo: "/reset-password",
      });

      if (error) {
        toast.error(error.message || "Failed to send reset link");
      } else {
        setSuccess(true);
        toast.success("Reset link sent to your email");
      }
    } catch (err) {
      console.error(err);
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-4 text-green-600 text-sm">
        <p className="font-medium">Check your email</p>
        <p className="mt-1">
          If an account exists for {/** Optional: show email here */} that
          address, we've sent a password reset link.
        </p>
        <Button
          variant="outline"
          className="mt-4 w-full"
          onClick={() => setSuccess(false)}
        >
          Send another link
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          required
          disabled={loading}
        />
      </div>

      <Button
        type="submit"
        variant="default" // Changed from secondary for better visibility as a primary action
        className="w-full min-h-[44px]"
        disabled={loading}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Sending...
          </>
        ) : (
          "Send reset link"
        )}
      </Button>
    </form>
  );
}
