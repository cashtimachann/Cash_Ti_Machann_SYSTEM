'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-primary-900">
      {/* Navigation */}
      <nav className="relative z-10 bg-dark-950/50 backdrop-blur-sm border-b border-primary-600/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-white">
                Cash Ti <span className="text-primary-600">Machann</span>
              </h1>
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <Link href="/login" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                  Konekte
                </Link>
                <Link href="/register" className="bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-700">
                  Enskri
                </Link>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Sèvis Finansye
              <br />
              <span className="text-primary-600">Dijital</span> pou Ayiti
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Platfòm Cash Ti Machann la ofri sèvis kòm depo, retirè, vòya lajan, ak peye faktè yo nan yon fason ki pi fasil ak pi sekirite.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register" className="bg-primary-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-primary-700 transition-colors">
                Kòmanse Kounye a
              </Link>
              <Link href="/login" className="border border-primary-600 text-primary-600 px-8 py-3 rounded-lg text-lg font-medium hover:bg-primary-600 hover:text-white transition-colors">
                Konekte
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 bg-white/5 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Karakteristik Prensipal yo
            </h2>
            <p className="text-gray-300 text-lg">
              Tout bagay ou bezwen pou jesyon lajan ou yo
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-dark-800/50 backdrop-blur-sm p-8 rounded-xl border border-primary-600/20">
              <div className="w-16 h-16 bg-primary-600 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Vòya Lajan</h3>
              <p className="text-gray-300">
                Voye lajan nan men moun yo nan yon fason ki rapid ak ki sekirite, sètènman ak sètènman.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-dark-800/50 backdrop-blur-sm p-8 rounded-xl border border-primary-600/20">
              <div className="w-16 h-16 bg-primary-600 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Peye Faktè</h3>
              <p className="text-gray-300">
                Peye faktè elektrisite, dlo, ak telefòn ou yo dirèkteman sou platfòm lan.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-dark-800/50 backdrop-blur-sm p-8 rounded-xl border border-primary-600/20">
              <div className="w-16 h-16 bg-primary-600 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Sekirite</h3>
              <p className="text-gray-300">
                Otantifikasyon 2FA ak biometri pou pwoteje kont ou ak lajan ou yo.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Pare pou Kòmanse?
          </h2>
          <p className="text-gray-300 text-lg mb-8">
            Enskri kounye a ak resevwa aksè nan tout sèvis finansye nou yo.
          </p>
          <Link href="/register" className="bg-primary-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-primary-700 transition-colors inline-block">
            Kreye Kont Ou
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-dark-950 border-t border-primary-600/20 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-gray-400">
            <p>&copy; 2025 Cash Ti Machann. Tout dwa yo rezève.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
