import { useRef, useState, useCallback } from 'react'
import type { ReactNode } from 'react'
import { RefreshCw } from 'lucide-react'

const THRESHOLD = 70
const MAX_PULL = 110

type Props = {
  onRefresh: () => Promise<void>
  children: ReactNode
}

export default function PullToRefresh({ onRefresh, children }: Props) {
  const [pullY, setPullY] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const startY = useRef(0)
  const active = useRef(false)

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (window.scrollY > 0) return
    startY.current = e.touches[0].clientY
    active.current = true
  }, [])

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!active.current || refreshing) return
    const dy = e.touches[0].clientY - startY.current
    if (dy > 0) {
      // Square-root damping gives a natural rubber-band feel
      setPullY(Math.min(MAX_PULL, Math.sqrt(dy) * 7))
    }
  }, [refreshing])

  const onTouchEnd = useCallback(async () => {
    if (!active.current) return
    active.current = false
    if (pullY >= THRESHOLD) {
      setRefreshing(true)
      setPullY(48)
      try {
        await onRefresh()
      } finally {
        setRefreshing(false)
        setPullY(0)
      }
    } else {
      setPullY(0)
    }
  }, [pullY, onRefresh])

  const progress = Math.min(1, pullY / THRESHOLD)

  return (
    <div onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd} className="relative">
      {/* Indicator */}
      <div
        className="absolute left-0 right-0 flex justify-center pointer-events-none z-50"
        style={{ top: pullY - 40, opacity: progress, transition: pullY === 0 ? 'opacity 0.3s' : undefined }}
      >
        <div className="bg-white rounded-full shadow-md p-2">
          <RefreshCw
            size={20}
            className="text-amber-500"
            style={{
              transform: refreshing ? undefined : `rotate(${progress * 270}deg)`,
              animation: refreshing ? 'spin 0.8s linear infinite' : undefined,
            }}
          />
        </div>
      </div>

      {/* Content */}
      <div
        style={{
          transform: `translateY(${pullY}px)`,
          transition: pullY === 0 ? 'transform 0.3s ease' : undefined,
        }}
      >
        {children}
      </div>
    </div>
  )
}
