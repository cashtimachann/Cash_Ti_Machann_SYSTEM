import React from 'react'

interface LoadingSkeletonProps {
  viewMode: 'table' | 'cards'
  count?: number
}

const LoadingSkeleton: React.FC<LoadingSkeletonProps> = React.memo(({ viewMode, count = 8 }) => {
  if (viewMode === 'table') {
    return (
      <div className="overflow-x-auto">
        <div className="animate-pulse">
          {/* Header skeleton */}
          <div className="h-10 bg-gray-100 rounded mb-3"></div>
          {/* Row skeletons */}
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="h-12 bg-gray-50 rounded mb-2"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
      {Array.from({ length: Math.min(count, 6) }).map((_, i) => (
        <div key={i} className="h-28 bg-gray-100 rounded"></div>
      ))}
    </div>
  )
})

LoadingSkeleton.displayName = 'LoadingSkeleton'

export default LoadingSkeleton