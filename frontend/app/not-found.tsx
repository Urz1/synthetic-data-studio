"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Home, Search, FileQuestion } from "lucide-react";
import Image from "next/image";

export default function NotFound() {
  const router = useRouter();

  const handleGoBack = () => {
    // Check if user came from within the app
    if (typeof window !== "undefined" && window.history.length > 2) {
      router.back();
    } else {
      // Fallback to dashboard
      router.push("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center space-y-8">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-xl overflow-hidden flex items-center justify-center bg-primary/10 border border-primary/20">
              <Image
                src="/FInal_Logo.png"
                alt="Synth Studio"
                width={40}
                height={40}
                className="object-contain"
              />
            </div>
            <span className="text-xl font-semibold text-white">
              Synth Studio
            </span>
          </Link>
        </div>

        {/* Animated Icon */}
        <div className="relative mx-auto w-64 h-64">
          {/* Orbiting elements */}
          <div className="absolute inset-0 animate-spin-slow">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full border-2 border-dashed border-primary/30" />
          </div>

          {/* Center icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
              <div className="relative bg-gradient-to-br from-slate-700 to-slate-800 rounded-3xl p-8 border border-primary/20 shadow-2xl">
                <FileQuestion className="h-16 w-16 text-primary" />
              </div>
            </div>
          </div>

          {/* Floating badges */}
          <div className="absolute top-1/4 right-0 animate-float">
            <div className="bg-primary/10 backdrop-blur-sm border border-primary/20 rounded-full px-3 py-1">
              <span className="text-xs font-mono text-primary">404</span>
            </div>
          </div>
          <div className="absolute bottom-1/4 left-0 animate-float-delayed">
            <div className="bg-primary/10 backdrop-blur-sm border border-primary/20 rounded-full px-3 py-1">
              <span className="text-xs font-mono text-primary">NOT_FOUND</span>
            </div>
          </div>
        </div>

        {/* Error Message */}
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold text-white">
            This data point is missing
          </h1>
          <p className="text-lg text-slate-400 max-w-md mx-auto">
            Our synthetic systems couldn't find the requested path. It might
            have been moved, deleted, or never existed in this timeline.
          </p>
        </div>

        {/* Error Code Display */}
        <div className="inline-block">
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg px-4 py-2">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              <span className="font-mono text-slate-400">Error Code:</span>
              <span className="font-mono text-primary">404_NOT_FOUND</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <Button onClick={handleGoBack} size="lg" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </Button>
          <Button asChild variant="outline" size="lg" className="gap-2">
            <Link href="/dashboard">
              <Home className="h-4 w-4" />
              Dashboard
            </Link>
          </Button>
          <Button asChild variant="ghost" size="lg" className="gap-2">
            <Link href="/help">
              <Search className="h-4 w-4" />
              Get Help
            </Link>
          </Button>
        </div>

        {/* Footer Links */}
        <div className="pt-8 flex flex-wrap justify-center gap-6 text-sm text-slate-500">
          <Link href="/help" className="hover:text-slate-300 transition-colors">
            Help Center
          </Link>
          <Link
            href="https://docs.synthdata.studio/"
            className="hover:text-slate-300 transition-colors"
          >
            Documentation
          </Link>
          <a
            href="mailto:support@synthstudio.ai"
            className="hover:text-slate-300 transition-colors"
          >
            Contact Support
          </a>
        </div>

        {/* Copyright */}
        <div className="text-xs text-slate-600">
          © {new Date().getFullYear()} Synth Studio. All rights reserved.
        </div>
      </div>

      <style jsx>{`
        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        @keyframes float-delayed {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-15px);
          }
        }
        .animate-spin-slow {
          animation: spin-slow 20s linear infinite;
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float-delayed 3s ease-in-out infinite 1.5s;
        }
      `}</style>
    </div>
  );
}
