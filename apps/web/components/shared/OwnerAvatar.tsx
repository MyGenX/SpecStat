export function OwnerAvatar({ owner }: { owner: string }) {
  const initials = owner
    .split(/[-_]/)
    .map((s) => s[0]?.toUpperCase() ?? '')
    .slice(0, 2)
    .join('')
  return (
    <span
      className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary/20 text-primary text-[10px] font-semibold"
      title={owner}
    >
      {initials || owner[0]?.toUpperCase()}
    </span>
  )
}
