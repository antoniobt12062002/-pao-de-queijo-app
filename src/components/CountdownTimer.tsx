import { useState, useEffect } from 'react'
import { Clock } from 'lucide-react'

export default function CountdownTimer({ closesAt }: { closesAt: string }) {
  const [remaining, setRemaining] = useState('')

  useEffect(() => {
    const update = () => {
      const diff = new Date(closesAt).getTime() - Date.now()
      if (diff <= 0) { setRemaining('Encerrado'); return }
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setRemaining(h > 0 ? `${h}h ${m}m` : `${m}m ${s}s`)
    }
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [closesAt])

  return (
    <span className="flex items-center gap-1 text-xs text-gray-500">
      <Clock size={12} />
      {remaining}
    </span>
  )
}
