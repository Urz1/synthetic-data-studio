"use client"

import { useEffect, useRef } from "react"

type AuthMode = "login" | "register" | "generic"

function safeDecodeJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split(".")
  if (parts.length < 2) return null

  try {
    const base64Url = parts[1]
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/")
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=")
    const json = atob(padded)
    return JSON.parse(json)
  } catch {
    return null
  }
}

function gtagEvent(name: string, params: Record<string, unknown>) {
  const w = window as unknown as { gtag?: (...args: unknown[]) => void }
  if (typeof w.gtag === "function") {
    w.gtag("event", name, params)
  }
}

const LOADING_TEXT: Record<AuthMode, string> = {
  login: "Signing in...",
  register: "Creating account...",
  generic: "Please wait...",
}

export function AuthFormEnhancer({
  formId,
  mode,
}: {
  formId: string
  mode: AuthMode
}) {
  const isSubmittingRef = useRef(false)
  const originalTextRef = useRef<string>("")

  useEffect(() => {
    // Find form with retry for hydration timing
    let form: HTMLFormElement | null = null
    let attempts = 0
    const maxAttempts = 10
    
    const findForm = () => {
      form = document.getElementById(formId) as HTMLFormElement | null
      if (!form && attempts < maxAttempts) {
        attempts++
        setTimeout(findForm, 50)
        return
      }
      if (form) {
        attachListeners(form)
      }
    }

    const getSubmitButton = (formEl: HTMLFormElement): HTMLButtonElement | null => {
      // Try multiple selectors to find the submit button
      return (
        formEl.querySelector('button[type="submit"]') as HTMLButtonElement ||
        formEl.querySelector('button:not([type="button"])') as HTMLButtonElement ||
        null
      )
    }

    const setSubmittingUI = (formEl: HTMLFormElement, button: HTMLButtonElement | null) => {
      if (isSubmittingRef.current) return
      isSubmittingRef.current = true

      formEl.dataset.submitting = "1"
      formEl.setAttribute("aria-busy", "true")

      if (button) {
        if (button.disabled) return
        originalTextRef.current = button.textContent ?? ""
        button.disabled = true
        // Add spinner and loading text
        button.innerHTML = `
          <svg class="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          ${LOADING_TEXT[mode]}
        `
      }
    }

    const resetUI = (formEl: HTMLFormElement, button: HTMLButtonElement | null) => {
      isSubmittingRef.current = false
      delete formEl.dataset.submitting
      formEl.removeAttribute("aria-busy")
      
      if (button && originalTextRef.current) {
        button.disabled = false
        button.textContent = originalTextRef.current
      }
    }

    const handleSubmit = async (event: Event, formEl: HTMLFormElement) => {
      const submitter = (event as SubmitEvent).submitter as HTMLElement | null
      if (submitter && (submitter as HTMLButtonElement).disabled) return
      if (isSubmittingRef.current) return

      event.preventDefault()

      const submitButton = 
        (submitter?.tagName === "BUTTON" ? submitter as HTMLButtonElement : null) ||
        getSubmitButton(formEl)

      setSubmittingUI(formEl, submitButton)

      const formData = new FormData(formEl)
      const endpoint = formEl.getAttribute("action") || (mode === "login" ? "/api/auth/login" : "/api/auth/register")

      gtagEvent("auth_intent", {
        method: "password",
        location: "form",
        mode,
      })

      let navigated = false
      try {
        const res = await fetch(endpoint, {
          method: "POST",
          body: formData,
          headers: {
            Accept: "application/json",
            "x-synth-xhr": "1",
          },
          credentials: "same-origin",
        })

        const data = await res.json().catch(() => null)

        if (!data || typeof data !== "object") {
          formEl.submit()
          navigated = true
          return
        }

        if (!data.ok) {
          if (typeof data.redirect === "string") {
            window.location.assign(data.redirect)
            navigated = true
            return
          }
          // Reset UI and show form again on error without redirect
          resetUI(formEl, submitButton)
          return
        }

        if (typeof data.token === "string" && data.token.length > 0) {
          try {
            localStorage.setItem("token", data.token)
          } catch {
            // Ignore storage failures
          }

          const payload = safeDecodeJwtPayload(data.token)
          const uid =
            (payload && (payload.sub as string)) ||
            (payload && ((payload.user_id as string) || (payload.uid as string))) ||
            undefined

          gtagEvent("auth_success", {
            method: "password",
            mode,
            uid,
          })
        }

        // Validate redirect is a proper path (not empty, not external)
        const redirectPath = typeof data.redirect === "string" && data.redirect.startsWith("/") && data.redirect.length > 1
          ? data.redirect
          : "/dashboard"
        
        window.location.assign(redirectPath)
        navigated = true
        return
      } catch (err) {
        console.error("AuthFormEnhancer error:", err)
        // On error, reset UI so user can try again
        resetUI(formEl, submitButton)
      }
    }

    const attachListeners = (formEl: HTMLFormElement) => {
      const onSubmit = (e: Event) => handleSubmit(e, formEl)
      
      // Capture submit to run before any other handlers
      formEl.addEventListener("submit", onSubmit, true)
      
      // Cleanup function
      return () => {
        formEl.removeEventListener("submit", onSubmit, true)
      }
    }

    findForm()

    // Cleanup
    return () => {
      if (form) {
        delete form.dataset.submitting
        form.removeAttribute("aria-busy")
      }
    }
  }, [formId, mode])

  return null
}

