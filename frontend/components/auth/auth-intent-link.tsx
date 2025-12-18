"use client"

import Link from "next/link"
import type { ComponentProps } from "react"

export function AuthIntentLink({
  eventLocation,
  mode,
  onClick,
  ...props
}: ComponentProps<typeof Link> & {
  eventLocation: string
  mode: "login" | "register"
}) {
  return (
    <Link
      {...props}
      onClick={(e) => {
        try {
          const w = window as unknown as { gtag?: (...args: any[]) => void }
          if (typeof w.gtag === "function") {
            w.gtag("event", "auth_intent", {
              method: "cta",
              location: eventLocation,
              mode,
            })
          }
        } catch {
          // no-op
        }

        onClick?.(e)
      }}
    />
  )
}
