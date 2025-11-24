"use client"

import { ShieldAlert } from "lucide-react"
import { Link } from "react-router-dom"

export const UnauthorizedPage = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-[#060d27] via-[#0f1e46] to-[#132553] p-6">
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-border/50 bg-card/85 p-10 text-center shadow-lg">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/15 text-primary">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h1 className="mt-6 text-3xl font-semibold text-foreground">Access restricted</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          You do not have permission to view this page or your session has expired. Please sign in with an authorized
          account to continue.
        </p>
        <div className="mt-6 flex flex-col gap-3 text-sm">
          <Link
            to="/login"
            className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow transition hover:bg-primary/90"
          >
            Go to sign in
          </Link>
          <Link to="/" className="text-sm font-medium text-primary hover:underline">
            Return to home
          </Link>
        </div>
      </div>
    </div>
  )
}

export default UnauthorizedPage