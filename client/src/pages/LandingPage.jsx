import React from 'react'

function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0b0f14] text-gray-200">
      {/* Background gradient overlay */}
      <div className="fixed inset-0 bg-gradient-to-br from-[#0b0f14] via-[#0e1117] to-[#0b0f14] pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(34,197,94,0.05),transparent_50%)] pointer-events-none" />
      
      <div className="relative z-10">
        {/* Navigation */}
        <nav className="border-b border-gray-800/50 backdrop-blur-sm bg-[#0b0f14]/80 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="text-2xl font-semibold tracking-tight text-green-400/90">
              Canopy
            </div>
            <div className="flex items-center gap-6">
              <a href="#features" className="text-sm text-gray-400 hover:text-gray-200 transition-colors">
                Features
              </a>
              <a href="#flow" className="text-sm text-gray-400 hover:text-gray-200 transition-colors">
                System Flow
              </a>
              <a href="#dashboard" className="text-sm text-gray-400 hover:text-gray-200 transition-colors">
                Dashboard
              </a>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-6 py-24 md:py-32">
          <div className="max-w-4xl">
            <h1 className="text-6xl md:text-7xl font-bold tracking-tight mb-6 leading-[1.1] text-gray-100">
              Satellite-verified carbon credits,
              <span className="block mt-2 bg-gradient-to-r from-green-400/90 to-teal-400/90 bg-clip-text text-transparent">
                automated by AI
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-400 mb-8 leading-relaxed max-w-3xl">
              Combining satellite imagery analysis, machine learning verification, and blockchain technology 
              to create transparent, trustless carbon credit infrastructure.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-4 mt-10">
              <button className="px-8 py-3.5 bg-gradient-to-r from-green-500/20 to-teal-500/20 border border-green-500/30 text-green-400 rounded-lg hover:from-green-500/30 hover:to-teal-500/30 hover:border-green-500/50 transition-all duration-200 font-medium tracking-wide">
                Connect Wallet
              </button>
              <button className="px-8 py-3.5 bg-transparent border border-gray-700 text-gray-300 rounded-lg hover:border-gray-600 hover:text-gray-200 transition-all duration-200 font-medium tracking-wide">
                View Architecture
              </button>
            </div>
          </div>
        </section>

        {/* Feature Grid */}
        <section id="features" className="max-w-7xl mx-auto px-6 py-20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Satellite Analysis Card */}
            <div className="bg-[#0e1117]/50 border border-gray-800/50 rounded-lg p-6 hover:border-green-500/30 transition-all duration-300 hover:bg-[#0e1117]/70">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500/20 to-teal-500/20 border border-green-500/30 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-100 mb-2">Satellite Analysis</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Multi-spectral satellite imagery processing for forest canopy assessment and carbon stock estimation.
              </p>
            </div>

            {/* AI Verification Engine Card */}
            <div className="bg-[#0e1117]/50 border border-gray-800/50 rounded-lg p-6 hover:border-green-500/30 transition-all duration-300 hover:bg-[#0e1117]/70">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500/20 to-teal-500/20 border border-green-500/30 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-100 mb-2">AI Verification Engine</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Machine learning models trained on NDVI and spectral indices for automated carbon credit validation.
              </p>
            </div>

            {/* Oracle-Based Trust Card */}
            <div className="bg-[#0e1117]/50 border border-gray-800/50 rounded-lg p-6 hover:border-green-500/30 transition-all duration-300 hover:bg-[#0e1117]/70">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500/20 to-teal-500/20 border border-green-500/30 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-100 mb-2">Oracle-Based Trust</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Decentralized oracle network ensuring satellite data integrity and tamper-proof verification records.
              </p>
            </div>

            {/* Dynamic Carbon NFTs Card */}
            <div className="bg-[#0e1117]/50 border border-gray-800/50 rounded-lg p-6 hover:border-green-500/30 transition-all duration-300 hover:bg-[#0e1117]/70">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500/20 to-teal-500/20 border border-green-500/30 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-100 mb-2">Dynamic Carbon NFTs</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                On-chain NFTs representing verifiable carbon credits with metadata linked to satellite verification.
              </p>
            </div>
          </div>
        </section>

        {/* System Flow Section */}
        <section id="flow" className="max-w-7xl mx-auto px-6 py-20">
          <div className="mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-100 mb-4">System Flow</h2>
            <p className="text-gray-400 text-lg">End-to-end pipeline from forest registration to credit retirement</p>
          </div>
          
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6">
            {/* Flow Steps */}
            {['Register Forest', 'Analyze', 'Verify', 'Mint', 'Retire'].map((step, index) => (
              <React.Fragment key={step}>
                <div className="flex-1 bg-[#0e1117]/50 border border-gray-800/50 rounded-lg p-6 text-center hover:border-green-500/30 transition-all duration-300">
                  <div className="text-xs font-mono text-green-400/70 mb-2 tracking-wider">STEP {index + 1}</div>
                  <div className="text-base font-semibold text-gray-200 font-mono">{step}</div>
                </div>
                {index < 4 && (
                  <div className="hidden md:block text-gray-700 text-2xl">→</div>
                )}
              </React.Fragment>
            ))}
          </div>
          
          {/* Flow Description */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-5 gap-6">
            <div className="text-sm text-gray-500 font-mono">
              Forest owner submits geospatial boundaries and metadata
            </div>
            <div className="text-sm text-gray-500 font-mono">
              Satellite data pipeline processes NDVI and canopy metrics
            </div>
            <div className="text-sm text-gray-500 font-mono">
              ML models validate carbon sequestration estimates
            </div>
            <div className="text-sm text-gray-500 font-mono">
              Verified credits minted as on-chain NFTs
            </div>
            <div className="text-sm text-gray-500 font-mono">
              Credits retired upon carbon offset claims
            </div>
          </div>
        </section>

        {/* Dashboard Preview Section */}
        <section id="dashboard" className="max-w-7xl mx-auto px-6 py-20">
          <div className="mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-100 mb-4">Dashboard</h2>
            <p className="text-gray-400 text-lg">Real-time monitoring of forest registrations and credit issuance</p>
          </div>
          
          <div className="bg-[#0e1117]/50 border border-gray-800/50 rounded-lg p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* Stats Cards */}
              <div className="bg-[#0b0f14]/50 border border-gray-800/30 rounded-lg p-6">
                <div className="text-sm font-mono text-gray-500 mb-2 tracking-wider">FORESTS REGISTERED</div>
                <div className="text-4xl font-bold text-gray-100 mb-1">247</div>
                <div className="text-xs text-green-400/70 font-mono">+12 this month</div>
              </div>
              
              <div className="bg-[#0b0f14]/50 border border-gray-800/30 rounded-lg p-6">
                <div className="text-sm font-mono text-gray-500 mb-2 tracking-wider">VERIFICATION STATUS</div>
                <div className="text-4xl font-bold text-gray-100 mb-1">89.2%</div>
                <div className="text-xs text-green-400/70 font-mono">Active verification rate</div>
              </div>
              
              <div className="bg-[#0b0f14]/50 border border-gray-800/30 rounded-lg p-6">
                <div className="text-sm font-mono text-gray-500 mb-2 tracking-wider">CREDITS ISSUED</div>
                <div className="text-4xl font-bold text-gray-100 mb-1">18.4K</div>
                <div className="text-xs text-green-400/70 font-mono">tCO₂e verified</div>
              </div>
            </div>
            
            {/* Recent Activity Table */}
            <div className="border-t border-gray-800/50 pt-6">
              <div className="text-sm font-semibold text-gray-300 mb-4 font-mono tracking-wide">RECENT ACTIVITY</div>
              <div className="space-y-3">
                {[
                  { id: 'FST-0247', forest: 'Amazon Rainforest Reserve', status: 'Verified', credits: '1,240 tCO₂e' },
                  { id: 'FST-0246', forest: 'Congo Basin Project', status: 'Analyzing', credits: '—' },
                  { id: 'FST-0245', forest: 'Southeast Asia Initiative', status: 'Verified', credits: '892 tCO₂e' },
                ].map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 bg-[#0b0f14]/30 border border-gray-800/30 rounded-lg hover:border-gray-800/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="font-mono text-xs text-gray-500 w-20">{item.id}</div>
                      <div className="text-sm text-gray-300">{item.forest}</div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className={`text-xs font-mono px-3 py-1 rounded ${
                        item.status === 'Verified' 
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                          : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                      }`}>
                        {item.status}
                      </div>
                      <div className="text-sm text-gray-400 font-mono w-24 text-right">{item.credits}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-gray-800/50 mt-20 py-12">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="text-gray-500 text-sm font-mono mb-4 md:mb-0">
                Canopy Protocol — Verified Carbon Infrastructure
              </div>
              <div className="text-gray-600 text-xs font-mono">
                © 2024
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}

export default LandingPage