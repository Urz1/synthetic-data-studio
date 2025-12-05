"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ArrowRight, Shield, Zap, Database, Lock, BarChart, CheckCircle2, Play, Menu, X, Github, Twitter } from "lucide-react"
import { motion, useScroll, useTransform } from "framer-motion"
import { useState, useEffect } from "react"

export default function LandingPage() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { scrollYProgress } = useScroll()
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0])
  const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95])

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const features = [
    {
      icon: <Shield className="h-6 w-6 text-cyan-400" />,
      title: "Differential Privacy",
      description: "Mathematically guaranteed privacy protection using industry-standard epsilon-delta definitions."
    },
    {
      icon: <Zap className="h-6 w-6 text-purple-400" />,
      title: "Instant Generation",
      description: "Generate millions of rows in seconds with our optimized schema-based and model-based engines."
    },
    {
      icon: <Database className="h-6 w-6 text-blue-400" />,
      title: "Multi-Database Support",
      description: "Seamlessly connect to Postgres, MySQL, and Snowflake to train on your existing data."
    },
    {
      icon: <Lock className="h-6 w-6 text-emerald-400" />,
      title: "GDPR & HIPAA Compliant",
      description: "Built-in compliance reports ensure your synthetic data meets strict regulatory standards."
    },
    {
      icon: <BarChart className="h-6 w-6 text-orange-400" />,
      title: "Statistical Fidelity",
      description: "Maintain correlations and distributions. Your analytics won't know the difference."
    },
    {
      icon: <CheckCircle2 className="h-6 w-6 text-pink-400" />,
      title: "Automated Evaluation",
      description: "Get detailed quality reports comparing real vs. synthetic data distributions automatically."
    }
  ]

  return (
    <div className="min-h-screen bg-[#0B0D14] text-white overflow-x-hidden selection:bg-purple-500/30">
      {/* Navbar */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${isScrolled ? "bg-[#0B0D14]/80 backdrop-blur-md border-b border-white/10" : "bg-transparent"}`}>
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tighter">
            <div className="h-10 w-10 rounded-lg overflow-hidden flex items-center justify-center">
              <Image 
                                src="/FInal_Logo.png" 
                alt="Synth Studio Logo" 
                width={40} 
                height={40}
                className="object-contain"
              />
            </div>
            Synth Studio
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">Features</Link>
            <Link href="#how-it-works" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">How it Works</Link>
            <Link href="#pricing" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">Pricing</Link>
            <Link href="/login" className="text-sm font-medium text-white hover:text-purple-400 transition-colors">Sign In</Link>
            <Button className="bg-white text-black hover:bg-gray-200 rounded-full px-6" asChild>
              <Link href="/register">Get Started</Link>
            </Button>
          </div>

          {/* Mobile Menu Toggle */}
          <button className="md:hidden text-white" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {/* Mobile Nav */}
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden absolute top-20 left-0 w-full bg-[#0B0D14] border-b border-white/10 p-6 flex flex-col gap-4"
          >
            <Link href="#features" className="text-gray-300" onClick={() => setMobileMenuOpen(false)}>Features</Link>
            <Link href="#how-it-works" className="text-gray-300" onClick={() => setMobileMenuOpen(false)}>How it Works</Link>
            <Link href="/login" className="text-gray-300" onClick={() => setMobileMenuOpen(false)}>Sign In</Link>
            <Button className="w-full bg-white text-black" asChild>
              <Link href="/register">Get Started</Link>
            </Button>
          </motion.div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-purple-600/20 rounded-full blur-[120px] -z-10" />
        <div className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-blue-600/10 rounded-full blur-[100px] -z-10" />

        <div className="container mx-auto px-6 text-center relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm text-purple-300 mb-8"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
            </span>
            v2.0 is now live with Schema Generator
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60"
          >
            Unlock Data Utility <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">Without Compromising Privacy</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10"
          >
            Generate high-fidelity synthetic data that mirrors your real data's statistical properties while guaranteeing differential privacy. Compliant with GDPR, HIPAA, and CCPA.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Button size="lg" className="h-12 px-8 rounded-full bg-white text-black hover:bg-gray-200 text-base" asChild>
              <Link href="/register">Start Generating Free</Link>
            </Button>
            <Button size="lg" variant="outline" className="h-12 px-8 rounded-full border-white/20 hover:bg-white/10 text-base gap-2" asChild>
              <Link href="https://github.com/synthstudio" target="_blank">
                <Github className="h-5 w-5" />
                Star on GitHub
              </Link>
            </Button>
          </motion.div>

          {/* Abstract Dashboard Preview */}
          <motion.div 
            style={{ opacity, scale }}
            className="mt-20 relative mx-auto max-w-5xl rounded-xl border border-white/10 bg-black/50 backdrop-blur-sm shadow-2xl overflow-hidden aspect-[16/9]"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/10 to-blue-500/10" />
            <div className="p-4 border-b border-white/10 flex gap-2">
              <div className="h-3 w-3 rounded-full bg-red-500/50" />
              <div className="h-3 w-3 rounded-full bg-yellow-500/50" />
              <div className="h-3 w-3 rounded-full bg-green-500/50" />
            </div>
            <div className="p-8 grid grid-cols-3 gap-8">
              <div className="col-span-2 space-y-4">
                <div className="h-8 w-1/3 bg-white/10 rounded animate-pulse" />
                <div className="h-64 bg-white/5 rounded-lg border border-white/10 relative overflow-hidden">
                  <div className="absolute bottom-0 left-0 right-0 h-full flex items-end justify-around p-4 gap-2">
                    {[40, 70, 50, 90, 60, 80, 45].map((h, i) => (
                      <div key={i} className="w-full bg-purple-500/40 rounded-t" style={{ height: `${h}%` }} />
                    ))}
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="h-32 bg-white/5 rounded-lg border border-white/10 p-4">
                  <div className="h-4 w-1/2 bg-white/10 rounded mb-2" />
                  <div className="text-3xl font-bold text-green-400">98.5%</div>
                  <div className="text-xs text-gray-500 mt-1">Privacy Score</div>
                </div>
                <div className="h-32 bg-white/5 rounded-lg border border-white/10 p-4">
                  <div className="h-4 w-1/2 bg-white/10 rounded mb-2" />
                  <div className="text-3xl font-bold text-blue-400">1.2M</div>
                  <div className="text-xs text-gray-500 mt-1">Rows Generated</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Trusted By */}
      <section className="py-10 border-y border-white/5 bg-white/5">
        <div className="container mx-auto px-6">
          <p className="text-center text-sm text-gray-500 mb-8">TRUSTED BY INNOVATIVE TEAMS AT</p>
          <div className="flex flex-wrap justify-center gap-12 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
            {/* Mock Logos */}
            {["Acme Corp", "GlobalBank", "HealthPlus", "DataFlow", "SecureAI"].map((name) => (
              <div key={name} className="text-xl font-bold text-white flex items-center gap-2">
                <div className="h-6 w-6 bg-white/20 rounded-full" />
                {name}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 relative">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Everything you need to <br />synthesize data safely</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              From raw data to production-ready synthetic datasets, we provide the complete toolkit for data teams.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-purple-500/50 hover:bg-white/[0.07] transition-all group"
              >
                <div className="mb-4 p-3 rounded-lg bg-white/5 w-fit group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-400 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-24 bg-gradient-to-b from-transparent to-purple-900/10">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-5xl font-bold mb-6">From Real to Synthetic <br />in 3 Simple Steps</h2>
              <div className="space-y-8">
                {[
                  { title: "Choose Your Source", desc: "Connect a database for model-based training OR define a JSON schema for instant generation." },
                  { title: "Generate & Protect", desc: "Create synthetic data with differential privacy guarantees. PII is automatically detected and protected." },
                  { title: "Validate Compliance", desc: "Run automated compliance checks (GDPR, HIPAA) and quality evaluations before you export." }
                ].map((step, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-purple-600/20 text-purple-400 flex items-center justify-center font-bold border border-purple-500/30">
                      {i + 1}
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold mb-1">{step.title}</h3>
                      <p className="text-gray-400">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Button className="mt-8 bg-purple-600 hover:bg-purple-700 text-white rounded-full px-8" asChild>
                <Link href="/register">Start Your Journey <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-blue-500/20 blur-3xl -z-10" />
              <div className="bg-[#0B0D14] border border-white/10 rounded-2xl p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-4">
                  <div className="font-mono text-sm text-gray-400">generating_data.py</div>
                  <div className="flex gap-2">
                    <div className="h-3 w-3 rounded-full bg-red-500/50" />
                    <div className="h-3 w-3 rounded-full bg-yellow-500/50" />
                    <div className="h-3 w-3 rounded-full bg-green-500/50" />
                  </div>
                </div>
                <div className="space-y-2 font-mono text-sm">
                  <div className="flex gap-2">
                    <span className="text-purple-400">$</span>
                    <span className="text-white">synth-studio generate --rows 1000000</span>
                  </div>
                  <div className="text-gray-500">Initializing generator...</div>
                  <div className="text-gray-500">Loading privacy budget (epsilon=1.0)...</div>
                  <div className="text-blue-400">Training completed in 45s</div>
                  <div className="text-green-400">
                    Generating records... [====================] 100%
                  </div>
                  <div className="text-white">Done! Output saved to ./synthetic_data.csv</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="relative rounded-3xl bg-gradient-to-r from-purple-900/50 to-blue-900/50 border border-white/10 p-12 text-center overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
            
            <h2 className="text-3xl md:text-5xl font-bold mb-6 relative z-10">Ready to secure your data?</h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto relative z-10">
              Join thousands of data scientists and engineers who trust Synth Studio for their synthetic data needs.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 relative z-10">
              <Button size="lg" className="bg-white text-black hover:bg-gray-200 rounded-full px-8 h-12 text-base" asChild>
                <Link href="/register">Get Started for Free</Link>
              </Button>
              <Button size="lg" variant="outline" className="border-white/20 hover:bg-white/10 rounded-full px-8 h-12 text-base" asChild>
                <Link href="/contact">Contact Sales</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-[#050609] pt-16 pb-8">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-2">
              <div className="flex items-center gap-2 font-bold text-xl tracking-tighter mb-4">
                <div className="h-10 w-10 rounded-lg overflow-hidden flex items-center justify-center">
                  <Image 
                                    src="/FInal_Logo.png" 
                    alt="Synth Studio Logo" 
                    width={40} 
                    height={40}
                    className="object-contain"
                  />
                </div>
                Synth Studio
              </div>
              <p className="text-gray-400 max-w-xs">
                The enterprise standard for privacy-preserving synthetic data generation and evaluation.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><Link href="#" className="hover:text-white transition-colors">Features</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Integrations</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Enterprise</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Changelog</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><Link href="#" className="hover:text-white transition-colors">About</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Blog</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Careers</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Contact</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-gray-500 text-sm">
              © 2024 Synth Studio Inc. All rights reserved.
            </div>
            <div className="flex gap-6">
              <Link href="#" className="text-gray-500 hover:text-white transition-colors"><Twitter className="h-5 w-5" /></Link>
              <Link href="#" className="text-gray-500 hover:text-white transition-colors"><Github className="h-5 w-5" /></Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
