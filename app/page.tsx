"use client"

import type { ComponentType } from "react"
import { useEffect, useState } from "react"

export default function Page() {
  const [AppComponent, setAppComponent] = useState<ComponentType | null>(null)

  useEffect(() => {
    let isMounted = true

    import("@/src/App")
      .then((module) => {
        if (isMounted) {
          setAppComponent(() => module.default || module.App || null)
        }
      })
      .catch((err) => {
        console.error("Failed to load client app", err)
      })

    return () => {
      isMounted = false
    }
  }, [])

  if (!AppComponent) {
    return null
  }

  const Component = AppComponent
  return <Component />
}
