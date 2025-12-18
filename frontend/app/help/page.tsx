"use client"

import Link from "next/link"
import { AppShell } from "@/components/layout/app-shell"
import { PageHeader } from "@/components/layout/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/lib/auth-context"
import ProtectedRoute from "@/components/layout/protected-route"
import {
  BookOpen,
  MessageSquare,
  Mail,
  ExternalLink,
  FileText,
  Video,
  HelpCircle,
  Keyboard,
} from "lucide-react"

const resources = [
  {
    icon: BookOpen,
    title: "Documentation",
    description: "Comprehensive guides for all features",
    href: "https://docs.synthdata.studio/",
    external: true,
  },
  {
    icon: Video,
    title: "Video Tutorials",
    description: "Step-by-step walkthroughs",
    href: "#",
    badge: "Coming Soon",
  },
  {
    icon: FileText,
    title: "API Reference",
    description: "Complete API documentation",
    href: "https://docs.synthdata.studio/docs/developer-guide/api-integration",
    external: true,
  },
  {
    icon: MessageSquare,
    title: "Community",
    description: "Join discussions on GitHub",
    href: "https://github.com/Urz1/synthetic-data-studio/discussions",
    external: true,
  },
]

const faqs = [
  {
    question: "What is differential privacy?",
    answer: "Differential privacy is a mathematical framework that provides provable privacy guarantees. It ensures that the output of a computation is nearly the same whether or not any individual's data is included.",
  },
  {
    question: "How do I choose the right epsilon value?",
    answer: "Lower epsilon means stronger privacy but potentially lower utility. For sensitive data like healthcare, use ε ≤ 5. For less sensitive data, ε ≤ 10 is often acceptable.",
  },
  {
    question: "Can I export my synthetic data?",
    answer: "Yes! Navigate to your generator, click 'Generate Data', and download as CSV, JSON, or Parquet. Exports include privacy certificates.",
  },
  {
    question: "How do I run an evaluation?",
    answer: "Go to Evaluations → New Evaluation, select your generator, and run. We'll measure utility, privacy leakage, and statistical similarity.",
  },
]

const shortcuts = [
  { keys: ["⌘", "K"], description: "Quick command palette" },
  { keys: ["⌘", "/"], description: "Toggle sidebar" },
  { keys: ["Esc"], description: "Close modal" },
]

export default function HelpPage() {
  const { user } = useAuth()

  return (
    <ProtectedRoute>
      <AppShell user={user || { full_name: "", email: "" }}>
        <PageHeader
          title="Help & Documentation"
          description="Resources, guides, and answers to common questions"
        />

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Resources */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                Resources
              </CardTitle>
              <CardDescription>Learning materials and documentation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {resources.map((resource) => (
                <Link
                  key={resource.title}
                  href={resource.href}
                  target={resource.external ? "_blank" : undefined}
                  rel={resource.external ? "noopener noreferrer" : undefined}
                  className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors group"
                >
                  <div className="p-2 rounded-md bg-primary/10">
                    <resource.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{resource.title}</span>
                      {resource.badge && (
                        <Badge variant="secondary" className="text-xs">{resource.badge}</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{resource.description}</p>
                  </div>
                  {resource.external && (
                    <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </Link>
              ))}
            </CardContent>
          </Card>

          {/* Keyboard Shortcuts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Keyboard className="h-5 w-5 text-primary" />
                Keyboard Shortcuts
              </CardTitle>
              <CardDescription>Navigate faster with keyboard</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {shortcuts.map((shortcut) => (
                <div key={shortcut.description} className="flex items-center justify-between py-2">
                  <span className="text-sm text-muted-foreground">{shortcut.description}</span>
                  <div className="flex gap-1">
                    {shortcut.keys.map((key) => (
                      <kbd
                        key={key}
                        className="px-2 py-1 text-xs font-mono bg-muted rounded border"
                      >
                        {key}
                      </kbd>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* FAQs */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-primary" />
              Frequently Asked Questions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {faqs.map((faq) => (
                <div key={faq.question} className="space-y-2 p-4 rounded-lg bg-muted/30">
                  <h4 className="font-medium">{faq.question}</h4>
                  <p className="text-sm text-muted-foreground">{faq.answer}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card className="mt-6">
          <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-4 py-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h4 className="font-medium">Still need help?</h4>
                <p className="text-sm text-muted-foreground">Our team is here to assist you</p>
              </div>
            </div>
            <Button asChild>
              <Link href="mailto:support@synthdata.studio">Contact Support</Link>
            </Button>
          </CardContent>
        </Card>
      </AppShell>
    </ProtectedRoute>
  )
}
