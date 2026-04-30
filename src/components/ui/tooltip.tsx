
import {
  useState,
  useRef,
  useEffect,
  useLayoutEffect,
  type ReactNode,
} from "react"
import { createPortal } from "react-dom"
import { cn } from "@/lib/utils"

type TooltipSide = "top" | "right" | "bottom" | "left"

interface TooltipProps {
  content: ReactNode
  side?: TooltipSide
  delay?: number
  children: ReactNode
  className?: string
}

const GAP = 8

function Tooltip({
  content,
  side = "top",
  delay = 200,
  children,
  className,
}: TooltipProps) {
  const [visible, setVisible] = useState(false)
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null)
  const [entered, setEntered] = useState(false)
  const [mounted, setMounted] = useState(false)

  const triggerRef = useRef<HTMLSpanElement>(null)
  const tooltipRef = useRef<HTMLSpanElement>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Measure and position as soon as tooltip mounts (before paint).
  useLayoutEffect(() => {
    if (!visible || !triggerRef.current || !tooltipRef.current) return

    function updatePosition() {
      const triggerEl = triggerRef.current
      const tooltipEl = tooltipRef.current
      if (!triggerEl || !tooltipEl) return

      const trigger = triggerEl.getBoundingClientRect()
      const tooltip = tooltipEl.getBoundingClientRect()

      let top = 0
      let left = 0
      switch (side) {
        case "top":
          top = trigger.top - tooltip.height - GAP
          left = trigger.left + trigger.width / 2 - tooltip.width / 2
          break
        case "bottom":
          top = trigger.bottom + GAP
          left = trigger.left + trigger.width / 2 - tooltip.width / 2
          break
        case "left":
          top = trigger.top + trigger.height / 2 - tooltip.height / 2
          left = trigger.left - tooltip.width - GAP
          break
        case "right":
          top = trigger.top + trigger.height / 2 - tooltip.height / 2
          left = trigger.right + GAP
          break
      }

      const padding = 4
      const maxLeft = window.innerWidth - tooltip.width - padding
      const maxTop = window.innerHeight - tooltip.height - padding
      left = Math.max(padding, Math.min(left, maxLeft))
      top = Math.max(padding, Math.min(top, maxTop))

      setCoords({ top, left })
    }

    updatePosition()
    window.addEventListener("scroll", updatePosition, true)
    window.addEventListener("resize", updatePosition)
    return () => {
      window.removeEventListener("scroll", updatePosition, true)
      window.removeEventListener("resize", updatePosition)
    }
  }, [visible, side])

  // Once the tooltip has been placed at the correct coords, wait one frame
  // so the browser commits that paint at opacity:0, then flip `entered` so
  // the CSS transition runs in-place (no flying from 0,0).
  useEffect(() => {
    if (!visible || !coords) return
    const id = requestAnimationFrame(() => setEntered(true))
    return () => cancelAnimationFrame(id)
  }, [visible, coords])

  function show() {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => setVisible(true), delay)
  }

  function hide() {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setVisible(false)
    setEntered(false)
    setCoords(null)
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  return (
    <span
      ref={triggerRef}
      className="relative inline-flex"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      {mounted &&
        visible &&
        createPortal(
          <span
            ref={tooltipRef}
            role="tooltip"
            data-slot="tooltip"
            style={{
              position: "fixed",
              top: coords?.top ?? 0,
              left: coords?.left ?? 0,
              opacity: entered ? 1 : 0,
              transform: entered ? "scale(1)" : "scale(0.96)",
              transformOrigin: "center",
              transition:
                "opacity 150ms ease-out, transform 150ms ease-out",
              pointerEvents: "none",
              visibility: coords ? "visible" : "hidden",
            }}
            className={cn(
              "z-50 whitespace-nowrap rounded-lg bg-foreground px-2.5 py-1.5 text-xs text-background shadow-md",
              className
            )}
          >
            {content}
          </span>,
          document.body
        )}
    </span>
  )
}

export { Tooltip }
