export default function TournamentLoading() {
  return (
    <div className="space-y-5 animate-pulse">
      {/* Header skeleton */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gray-100 shrink-0" />
          <div className="flex-1 min-w-0 space-y-2">
            <div className="h-6 bg-gray-100 rounded-lg w-48" />
            <div className="h-4 bg-gray-100 rounded w-32" />
          </div>
          <div className="h-8 bg-gray-100 rounded-xl w-24 shrink-0" />
        </div>
      </div>

      {/* Tabs skeleton */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100 shadow-sm p-2">
        <div className="flex gap-1">
          {[80, 64, 72, 56].map((w, i) => (
            <div key={i} className="h-9 bg-gray-100 rounded-xl" style={{ width: `${w}px` }} />
          ))}
        </div>
      </div>

      {/* Content skeleton */}
      <div className="space-y-3">
        <div className="h-20 bg-white/80 rounded-2xl border border-gray-100" />
        <div className="h-20 bg-white/80 rounded-2xl border border-gray-100" />
        <div className="h-20 bg-white/80 rounded-2xl border border-gray-100" />
      </div>
    </div>
  )
}
