export default function DashboardLoading() {
  return (
    <div className="animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="space-y-2">
          <div className="h-7 bg-gray-100 rounded-lg w-40" />
          <div className="h-4 bg-gray-100 rounded w-56" />
        </div>
        <div className="h-10 bg-gray-100 rounded-xl w-36 shrink-0" />
      </div>

      {/* Tournament card grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white/80 rounded-2xl border border-gray-100 p-5 space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-gray-100 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-5 bg-gray-100 rounded w-3/4" />
                <div className="h-4 bg-gray-100 rounded w-16" />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <div className="h-3 bg-gray-100 rounded w-20" />
              <div className="h-3 bg-gray-100 rounded w-16 ml-auto" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
