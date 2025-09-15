export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 text-center">
      <div className="max-w-md">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center">
          <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M4.938 19h14.124c1.54 0 2.502-1.667 1.732-2.5L13.732 5c-.77-.833-1.964-.833-2.732 0L3.206 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">404 - Paj la pa jwenn</h1>
        <p className="text-gray-600 mb-6">Paj ou chèche a pa egziste oswa li te deplase. Tanpri tounen sou tablodbò a.</p>
        <a href="/dashboard/admin" className="inline-block bg-primary-600 text-white px-6 py-3 rounded-md font-medium hover:bg-primary-700 transition-colors">Ale sou Tablodbò Admin</a>
      </div>
    </div>
  )
}
