export function getHeroUrl(pictures?: string | Array<string>) {
  const first = Array.isArray(pictures) ? pictures[0] : pictures
  if (!first) {
    return 'https://images.unsplash.com/photo-1529336953121-ad3c0f3f1f59?q=80&w=1600&auto=format&fit=crop'
  }

  const s = String(first)

  if (s.startsWith('data:')) return s
  if (s.startsWith('http://') || s.startsWith('https://')) return s

  return `data:image/jpeg;base64,${s}`
}
