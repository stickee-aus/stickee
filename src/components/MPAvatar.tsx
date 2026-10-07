'use client'

interface MPAvatarProps {
  id: string
  name: string
  partyColor: string
}

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
}

export function MPAvatar({ id, name, partyColor }: MPAvatarProps) {
  return (
    <div className="relative h-16 w-16 shrink-0">
      <div
        className="absolute inset-0 flex items-center justify-center rounded-2xl text-xl font-bold text-white shadow-sm"
        style={{ backgroundColor: partyColor }}
      >
        {getInitials(name)}
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`https://i.pravatar.cc/128?u=${id}`}
        alt={name}
        width={64}
        height={64}
        className="absolute inset-0 h-16 w-16 rounded-2xl object-cover shadow-sm"
        onError={e => { e.currentTarget.style.display = 'none' }}
      />
    </div>
  )
}
