import React from 'react'

interface ViewControlsProps {
  sortBy: string
  sortDir: string
  viewMode: string
  density: string
  itemsPerPage: number
  onSortChange: (sortBy: string) => void
  onSortDirChange: (dir: string) => void
  onViewModeChange: (mode: string) => void
  onDensityChange: (density: string) => void
  onItemsPerPageChange: (count: number) => void
  onExport: () => void
}

const ViewControls: React.FC<ViewControlsProps> = React.memo(({
  sortBy,
  sortDir,
  viewMode,
  density,
  itemsPerPage,
  onSortChange,
  onSortDirChange,
  onViewModeChange,
  onDensityChange,
  onItemsPerPageChange,
  onExport
}) => {
  const handleSortDirToggle = () => {
    onSortDirChange(sortDir === 'asc' ? 'desc' : 'asc')
  }

  const handleItemsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onItemsPerPageChange(parseInt(e.target.value) || 10)
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1">
        <label className="text-xs text-gray-500">Triye pa</label>
        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value)}
          className="px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-600"
        >
          <option value="date">Dat Kreye</option>
          <option value="name">Non</option>
          <option value="balance">Balans</option>
          <option value="status">Estati</option>
        </select>
        <button
          onClick={handleSortDirToggle}
          className="px-2 py-1.5 border border-gray-300 rounded-md text-sm bg-white hover:bg-gray-50"
          title="Chanje lòd"
        >
          {sortDir === 'asc' ? '↑' : '↓'}
        </button>
      </div>
      
      <div className="flex items-center gap-1">
        <label className="text-xs text-gray-500">Vizyon</label>
        <button
          onClick={() => onViewModeChange('table')}
          className={`px-2 py-1.5 border rounded-md text-sm ${
            viewMode === 'table' 
              ? 'bg-primary-50 text-primary-700 border-primary-200' 
              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
          }`}
        >
          Tab
        </button>
        <button
          onClick={() => onViewModeChange('cards')}
          className={`px-2 py-1.5 border rounded-md text-sm ${
            viewMode === 'cards' 
              ? 'bg-primary-50 text-primary-700 border-primary-200' 
              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
          }`}
        >
          Kat
        </button>
      </div>
      
      <div className="flex items-center gap-1">
        <label className="text-xs text-gray-500">Dansite</label>
        <button
          onClick={() => onDensityChange('regular')}
          className={`px-2 py-1.5 border rounded-md text-sm ${
            density === 'regular' 
              ? 'bg-white text-gray-900 border-gray-400' 
              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
          }`}
        >
          Konfò
        </button>
        <button
          onClick={() => onDensityChange('compact')}
          className={`px-2 py-1.5 border rounded-md text-sm ${
            density === 'compact' 
              ? 'bg-white text-gray-900 border-gray-400' 
              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
          }`}
        >
          Konpakte
        </button>
      </div>
      
      <div className="flex items-center gap-1">
        <label className="text-xs text-gray-500">Pa paj</label>
        <select
          value={itemsPerPage}
          onChange={handleItemsPerPageChange}
          className="px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-600"
        >
          <option value={10}>10</option>
          <option value={25}>25</option>
          <option value={50}>50</option>
        </select>
      </div>
      
      <button
        onClick={onExport}
        className="px-3 py-1.5 rounded-md text-sm bg-primary-600 text-white hover:bg-primary-700"
      >
        Ekspòte CSV
      </button>
    </div>
  )
})

ViewControls.displayName = 'ViewControls'

export default ViewControls