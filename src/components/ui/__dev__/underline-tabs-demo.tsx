'use client'

import { useState } from 'react'
import { UnderlineTabs } from '@/components/ui/underline-tabs'

const ITEMS = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'resolved', label: 'Resolved' },
]

export function UnderlineTabsDemo() {
  const [value, setValue] = useState('all')
  return <UnderlineTabs items={ITEMS} value={value} onChange={setValue} />
}
