export function TagChip({ tag }: { tag: string }) {
  return (
    <span className="text-[10px] px-1.5 py-0.5 bg-muted rounded font-medium text-muted-foreground">
      {tag}
    </span>
  )
}

export function TagChipList({ tags, max = 3 }: { tags: string[]; max?: number }) {
  const visible = tags.slice(0, max)
  const overflow = tags.length - max
  return (
    <div className="flex flex-wrap gap-1">
      {visible.map((t) => (
        <TagChip key={t} tag={t} />
      ))}
      {overflow > 0 && (
        <span className="text-[10px] px-1.5 py-0.5 bg-muted rounded font-medium text-muted-foreground">
          +{overflow}
        </span>
      )}
    </div>
  )
}
