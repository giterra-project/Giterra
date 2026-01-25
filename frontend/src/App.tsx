import { useState } from 'react'

import PlanetExperience, { type ViewMode } from './scenes/PlanetExperience'

function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('overview')

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <PlanetExperience viewMode={viewMode} onViewModeChange={setViewMode} />

      {viewMode === 'detail' && (
        <button
          type="button"
          onClick={() => setViewMode('overview')}
          style={{
            position: 'absolute',
            top: 16,
            left: 16,
            padding: '10px 12px',
            borderRadius: 10,
            border: '1px solid rgba(255,255,255,0.2)',
            background: 'rgba(0,0,0,0.6)',
            color: '#fff',
            cursor: 'pointer',
            fontSize: 14,
            lineHeight: 1,
            backdropFilter: 'blur(8px)',
          }}
        >
          뒤로/축소
        </button>
      )}
    </div>
  )
}

export default App
