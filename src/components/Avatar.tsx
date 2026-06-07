interface AvatarProps {
  name: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizes = { sm: 'w-7 h-7 text-xs', md: 'w-9 h-9 text-sm', lg: 'w-12 h-12 text-base' }

const colors = [
  'bg-amber-400', 'bg-rose-400', 'bg-violet-400',
  'bg-teal-400', 'bg-sky-400', 'bg-orange-400',
]

function colorFor(name: string) {
  let hash = 0
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) & 0xffff
  return colors[hash % colors.length]
}

export default function Avatar({ name, size = 'md', className = '' }: AvatarProps) {
  const initial = name.trim().charAt(0).toUpperCase() || '?'
  return (
    <div
      className={`${sizes[size]} ${colorFor(name)} rounded-full flex items-center justify-center font-semibold text-white flex-shrink-0 ${className}`}
    >
      {initial}
    </div>
  )
}
