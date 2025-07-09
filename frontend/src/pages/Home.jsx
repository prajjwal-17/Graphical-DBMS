import React, { useState, useEffect } from 'react';
import { Database, Network, Users, Building2, Search, GitBranch, Zap, Globe, Code, Brain } from 'lucide-react';

const HomePage = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);

  useEffect(() => {
    setIsVisible(true);
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % 5);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const technologies = [
    { icon: <Database className="w-6 h-6" />, name: "Neo4j", desc: "Graph database powering complex relationships" },
    { icon: <Globe className="w-6 h-6" />, name: "Selenium", desc: "Web scraping MCA, Wikipedia, company sites" },
    { icon: <Code className="w-6 h-6" />, name: "Node.js", desc: "Backend with custom import scripts" },
    { icon: <Brain className="w-6 h-6" />, name: "React + D3", desc: "Interactive graph visualization frontend" },
  ];

  const features = [
    { icon: <Network className="w-8 h-8" />, title: "Interactive Graph Visualization", desc: "Company-director relationships as dynamic networks" },
    { icon: <Search className="w-8 h-8" />, title: "Advanced Query Engine", desc: "Custom Cypher queries for deep structural insights" },
    { icon: <GitBranch className="w-8 h-8" />, title: "Graph Algorithms", desc: "Discover most-connected directors and sub-networks" },
    { icon: <Zap className="w-8 h-8" />, title: "Real-time Search", desc: "Instant CIN/DIN lookups with live results" },
    { icon: <Users className="w-8 h-8" />, title: "Relationship Filtering", desc: "Clean data model with optional filters" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-72 h-72 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-1000"></div>
        <div className="absolute -bottom-8 left-40 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-2000"></div>
      </div>

      <div className="relative z-10 py-12">
        <div className="max-w-7xl mx-auto px-8 space-y-20">
          {/* Hero Section */}
          <header className={`text-center transform transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <div className="inline-flex items-center gap-3 bg-gradient-to-r from-yellow-400/20 to-orange-400/20 backdrop-blur-sm border border-yellow-400/30 rounded-full px-6 py-3 mb-6">
              <Database className="w-6 h-6 text-yellow-400" />
              <span className="text-yellow-400 font-medium">Neo4j Powered</span>
            </div>
            
            <h1 className="text-6xl font-black bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 bg-clip-text text-transparent mb-6 leading-tight">
              GraphDB Explorer <br />
              <span className="text-cyan-400">using Neo4j and Crawlers</span>
            </h1>
            
            <p className="text-xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
              An advanced graph-based system that visualizes complex relationships among companies, directors, subsidiaries, and 
              board members through Neo4j integration and automated data extraction techniques.
            </p>

            <div className="flex flex-wrap justify-center gap-4 mt-8">
              <button className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-8 py-4 rounded-full font-bold hover:scale-105 transform transition-all duration-200 shadow-lg hover:shadow-yellow-400/25">
                <Network className="w-5 h-5 inline mr-2" />
                Explore Network
              </button>
              <button className="bg-white/10 backdrop-blur-sm border border-white/20 px-8 py-4 rounded-full font-semibold hover:bg-white/20 transform transition-all duration-200">
                <Search className="w-5 h-5 inline mr-2" />
                Search Database
              </button>
            </div>
          </header>

          {/* Technologies Grid */}
          <section className={`transform transition-all duration-1000 delay-300 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <h2 className="text-3xl font-bold text-center mb-12 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Powered by Cutting-Edge Technology
            </h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {technologies.map((tech, index) => (
                <div key={index} className="group bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 hover:border-cyan-400/50 transform hover:scale-105 transition-all duration-300">
                  <div className="text-cyan-400 mb-4 group-hover:scale-110 transition-transform duration-300">
                    {tech.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-white">{tech.name}</h3>
                  <p className="text-gray-400 text-sm">{tech.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Features Showcase */}
          <section className={`transform transition-all duration-1000 delay-500 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold mb-8 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Advanced Graph Analytics
                </h2>
                
                <div className="space-y-4">
                  {features.map((feature, index) => (
                    <div 
                      key={index}
                      className={`p-4 rounded-xl cursor-pointer transition-all duration-300 ${
                        activeFeature === index 
                          ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-l-4 border-purple-400' 
                          : 'hover:bg-white/5'
                      }`}
                      onMouseEnter={() => setActiveFeature(index)}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`p-2 rounded-lg ${activeFeature === index ? 'bg-purple-400/20 text-purple-400' : 'text-gray-400'}`}>
                          {feature.icon}
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold mb-1">{feature.title}</h3>
                          <p className="text-gray-400 text-sm">{feature.desc}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative">
                <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/20">
                  <div className="text-center mb-6">
                    <Building2 className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold">Live Database Stats</h3>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-cyan-400 mb-1">500+</div>
                      <div className="text-sm text-gray-400">Companies</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-400 mb-1">200+</div>
                      <div className="text-sm text-gray-400">Directors</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-purple-400 mb-1">1,000+</div>
                      <div className="text-sm text-gray-400">Relationships</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-yellow-400 mb-1">99.9%</div>
                      <div className="text-sm text-gray-400">Data Accuracy</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ER Diagram Section */}
          <section className={`transform transition-all duration-1000 delay-700 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <h2 className="text-3xl font-bold text-center mb-12 bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
              System Architecture & Data Model
            </h2>
            
            <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/20">
              <div className="text-center mb-8">
                <p className="text-gray-300 text-lg max-w-3xl mx-auto">
                  Our sophisticated entity-relationship model captures complex corporate hierarchies and 
                  cross-directorial connections across the Indian business ecosystem.
                </p>
              </div>
              
              {/* ER Diagram SVG */}
              <div className="bg-white/5 rounded-2xl p-4 overflow-auto">
                <svg viewBox="0 0 1200 800" className="w-full h-auto max-h-[600px]" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="entityGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" style={{stopColor:'#3B82F6', stopOpacity:1}} />
                      <stop offset="100%" style={{stopColor:'#1E40AF', stopOpacity:1}} />
                    </linearGradient>
                    <linearGradient id="relationGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" style={{stopColor:'#10B981', stopOpacity:1}} />
                      <stop offset="100%" style={{stopColor:'#047857', stopOpacity:1}} />
                    </linearGradient>
                    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                      <feDropShadow dx="3" dy="3" stdDeviation="2" floodColor="rgba(0,0,0,0.3)"/>
                    </filter>
                    <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                      <polygon points="0 0, 10 3.5, 0 7" fill="#64748B"/>
                    </marker>
                  </defs>
                  
                  {/* Background */}
                  <rect width="1200" height="800" fill="#1E293B"/>
                  
                  {/* Title */}
                  <text x="600" y="30" textAnchor="middle" fill="#F1F5F9" fontSize="24" fontWeight="bold">
                    Indian Corporate Ecosystem - Entity Relationship Diagram
                  </text>
                  
                  {/* Company Entity */}
                  <rect x="50" y="80" width="180" height="160" rx="10" fill="url(#entityGradient)" filter="url(#shadow)"/>
                  <text x="140" y="105" textAnchor="middle" fill="white" fontSize="16" fontWeight="bold">COMPANY</text>
                  <line x1="70" y1="115" x2="210" y2="115" stroke="white" strokeWidth="2"/>
                  <text x="140" y="130" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">🔑 CIN</text>
                  <text x="70" y="145" fill="white" fontSize="10">Company Name</text>
                  <text x="70" y="160" fill="white" fontSize="10">Registration Date</text>
                  <text x="70" y="175" fill="white" fontSize="10">Authorized Capital</text>
                  <text x="70" y="190" fill="white" fontSize="10">Paid-up Capital</text>
                  <text x="70" y="205" fill="white" fontSize="10">Company Status</text>
                  <text x="70" y="220" fill="white" fontSize="10">Activity Description</text>
                  
                  {/* Director Entity */}
                  <rect x="400" y="80" width="180" height="140" rx="10" fill="url(#entityGradient)" filter="url(#shadow)"/>
                  <text x="490" y="105" textAnchor="middle" fill="white" fontSize="16" fontWeight="bold">DIRECTOR</text>
                  <line x1="420" y1="115" x2="560" y2="115" stroke="white" strokeWidth="2"/>
                  <text x="490" y="130" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">🔑 DIN</text>
                  <text x="420" y="145" fill="white" fontSize="10">Director Name</text>
                  <text x="420" y="160" fill="white" fontSize="10">Date of Birth</text>
                  <text x="420" y="175" fill="white" fontSize="10">Nationality</text>
                  <text x="420" y="190" fill="white" fontSize="10">Qualification</text>
                  <text x="420" y="205" fill="white" fontSize="10">Address</text>
                  
                  {/* Board Member Entity */}
                  <rect x="750" y="80" width="180" height="120" rx="10" fill="url(#entityGradient)" filter="url(#shadow)"/>
                  <text x="840" y="105" textAnchor="middle" fill="white" fontSize="16" fontWeight="bold">BOARD_MEMBER</text>
                  <line x1="770" y1="115" x2="910" y2="115" stroke="white" strokeWidth="2"/>
                  <text x="840" y="130" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">🔑 Member_ID</text>
                  <text x="770" y="145" fill="white" fontSize="10">Member Name</text>
                  <text x="770" y="160" fill="white" fontSize="10">Position</text>
                  <text x="770" y="175" fill="white" fontSize="10">Appointment Date</text>
                  <text x="770" y="190" fill="white" fontSize="10">Term Duration</text>
                  
                  {/* Subsidiary Entity */}
                  <rect x="50" y="350" width="180" height="120" rx="10" fill="url(#entityGradient)" filter="url(#shadow)"/>
                  <text x="140" y="375" textAnchor="middle" fill="white" fontSize="16" fontWeight="bold">SUBSIDIARY</text>
                  <line x1="70" y1="385" x2="210" y2="385" stroke="white" strokeWidth="2"/>
                  <text x="140" y="400" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">🔑 Sub_CIN</text>
                  <text x="70" y="415" fill="white" fontSize="10">Subsidiary Name</text>
                  <text x="70" y="430" fill="white" fontSize="10">Ownership %</text>
                  <text x="70" y="445" fill="white" fontSize="10">Business Type</text>
                  <text x="70" y="460" fill="white" fontSize="10">Incorporation Date</text>
                  
                  {/* Shareholding Entity */}
                  <rect x="400" y="350" width="180" height="100" rx="10" fill="url(#entityGradient)" filter="url(#shadow)"/>
                  <text x="490" y="375" textAnchor="middle" fill="white" fontSize="16" fontWeight="bold">SHAREHOLDING</text>
                  <line x1="420" y1="385" x2="560" y2="385" stroke="white" strokeWidth="2"/>
                  <text x="490" y="400" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">🔑 Share_ID</text>
                  <text x="420" y="415" fill="white" fontSize="10">Share Percentage</text>
                  <text x="420" y="430" fill="white" fontSize="10">Share Type</text>
                  <text x="420" y="445" fill="white" fontSize="10">Valuation</text>
                  
                  {/* Financial Data Entity */}
                  <rect x="750" y="350" width="180" height="120" rx="10" fill="url(#entityGradient)" filter="url(#shadow)"/>
                  <text x="840" y="375" textAnchor="middle" fill="white" fontSize="16" fontWeight="bold">FINANCIAL_DATA</text>
                  <line x1="770" y1="385" x2="910" y2="385" stroke="white" strokeWidth="2"/>
                  <text x="840" y="400" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">🔑 Record_ID</text>
                  <text x="770" y="415" fill="white" fontSize="10">Financial Year</text>
                  <text x="770" y="430" fill="white" fontSize="10">Revenue</text>
                  <text x="770" y="445" fill="white" fontSize="10">Profit/Loss</text>
                  <text x="770" y="460" fill="white" fontSize="10">Total Assets</text>
                  
                  {/* DIRECTED Relationship */}
                  <path d="M 230 150 Q 315 120 400 150" fill="none" stroke="#64748B" strokeWidth="2" markerEnd="url(#arrowhead)"/>
                  <ellipse cx="315" cy="135" rx="40" ry="20" fill="url(#relationGradient)" filter="url(#shadow)"/>
                  <text x="315" y="140" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">DIRECTED</text>
                  <text x="315" y="115" textAnchor="middle" fill="#F1F5F9" fontSize="10">designation</text>
                  <text x="315" y="155" textAnchor="middle" fill="#F1F5F9" fontSize="10">start_date</text>
                  
                  {/* BOARD_OF Relationship */}
                  <path d="M 580 150 Q 665 120 750 150" fill="none" stroke="#64748B" strokeWidth="2" markerEnd="url(#arrowhead)"/>
                  <ellipse cx="665" cy="135" rx="35" ry="20" fill="url(#relationGradient)" filter="url(#shadow)"/>
                  <text x="665" y="140" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">BOARD_OF</text>
                  <text x="665" y="115" textAnchor="middle" fill="#F1F5F9" fontSize="10">role</text>
                  <text x="665" y="155" textAnchor="middle" fill="#F1F5F9" fontSize="10">tenure</text>
                  
                  {/* OWNS Relationship */}
                  <path d="M 140 240 Q 140 295 140 350" fill="none" stroke="#64748B" strokeWidth="2" markerEnd="url(#arrowhead)"/>
                  <ellipse cx="140" cy="295" rx="25" ry="18" fill="url(#relationGradient)" filter="url(#shadow)"/>
                  <text x="140" y="300" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">OWNS</text>
                  <text x="105" y="285" textAnchor="middle" fill="#F1F5F9" fontSize="10">stake_%</text>
                  
                  {/* HAS_SHARES Relationship */}
                  <path d="M 230 400 Q 315 400 400 400" fill="none" stroke="#64748B" strokeWidth="2" markerEnd="url(#arrowhead)"/>
                  <ellipse cx="315" cy="400" rx="45" ry="18" fill="url(#relationGradient)" filter="url(#shadow)"/>
                  <text x="315" y="405" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">HAS_SHARES</text>
                  <text x="315" y="385" textAnchor="middle" fill="#F1F5F9" fontSize="10">acquired_date</text>
                  
                  {/* REPORTS Relationship */}
                  <path d="M 580 400 Q 665 400 750 400" fill="none" stroke="#64748B" strokeWidth="2" markerEnd="url(#arrowhead)"/>
                  <ellipse cx="665" cy="400" rx="35" ry="18" fill="url(#relationGradient)" filter="url(#shadow)"/>
                  <text x="665" y="405" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">REPORTS</text>
                  <text x="665" y="385" textAnchor="middle" fill="#F1F5F9" fontSize="10">filing_date</text>
                  
                  {/* FINANCIAL_OF Relationship */}
                  <path d="M 230 200 Q 490 250 750 380" fill="none" stroke="#64748B" strokeWidth="2" markerEnd="url(#arrowhead)"/>
                  <ellipse cx="490" cy="290" rx="50" ry="18" fill="url(#relationGradient)" filter="url(#shadow)"/>
                  <text x="490" y="295" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">FINANCIAL_OF</text>
                  <text x="490" y="275" textAnchor="middle" fill="#F1F5F9" fontSize="10">reporting_period</text>
                  
                  {/* Cardinality Labels */}
                  <text x="260" y="140" fill="#F59E0B" fontSize="10" fontWeight="bold">1</text>
                  <text x="370" y="140" fill="#F59E0B" fontSize="10" fontWeight="bold">M</text>
                  <text x="610" y="140" fill="#F59E0B" fontSize="10" fontWeight="bold">M</text>
                  <text x="720" y="140" fill="#F59E0B" fontSize="10" fontWeight="bold">1</text>
                  <text x="150" y="270" fill="#F59E0B" fontSize="10" fontWeight="bold">1</text>
                  <text x="150" y="340" fill="#F59E0B" fontSize="10" fontWeight="bold">M</text>
                  <text x="260" y="390" fill="#F59E0B" fontSize="10" fontWeight="bold">1</text>
                  <text x="370" y="390" fill="#F59E0B" fontSize="10" fontWeight="bold">M</text>
                  <text x="610" y="390" fill="#F59E0B" fontSize="10" fontWeight="bold">1</text>
                  <text x="720" y="390" fill="#F59E0B" fontSize="10" fontWeight="bold">M</text>
                  
                  {/* Legend */}
                  <rect x="50" y="550" width="350" height="200" rx="10" fill="rgba(30, 41, 59, 0.9)" stroke="#475569" strokeWidth="1"/>
                  <text x="225" y="575" textAnchor="middle" fill="#F1F5F9" fontSize="16" fontWeight="bold">LEGEND</text>
                  
                  <rect x="70" y="590" width="40" height="20" rx="3" fill="url(#entityGradient)"/>
                  <text x="120" y="605" fill="#F1F5F9" fontSize="12">Entity (Tables)</text>
                  
                  <ellipse cx="90" cy="630" rx="20" ry="10" fill="url(#relationGradient)"/>
                  <text x="120" y="635" fill="#F1F5F9" fontSize="12">Relationship</text>
                  
                  <text x="70" y="660" fill="#F59E0B" fontSize="12" fontWeight="bold">🔑</text>
                  <text x="90" y="660" fill="#F1F5F9" fontSize="12">Primary Key</text>
                  
                  <text x="70" y="680" fill="#F59E0B" fontSize="12" fontWeight="bold">1</text>
                  <text x="90" y="680" fill="#F1F5F9" fontSize="12">One</text>
                  <text x="130" y="680" fill="#F59E0B" fontSize="12" fontWeight="bold">M</text>
                  <text x="150" y="680" fill="#F1F5F9" fontSize="12">Many</text>
                  
                  <line x1="70" y1="700" x2="100" y2="700" stroke="#64748B" strokeWidth="2" markerEnd="url(#arrowhead)"/>
                  <text x="110" y="705" fill="#F1F5F9" fontSize="12">Relationship Direction</text>
                  
                  {/* Data Sources Box */}
                  <rect x="450" y="550" width="300" height="180" rx="10" fill="rgba(30, 41, 59, 0.9)" stroke="#475569" strokeWidth="1"/>
                  <text x="600" y="575" textAnchor="middle" fill="#F1F5F9" fontSize="16" fontWeight="bold">DATA SOURCES</text>
                  
                  <text x="470" y="600" fill="#10B981" fontSize="12" fontWeight="bold">• MCA (Ministry of Corporate Affairs)</text>
                  <text x="480" y="615" fill="#F1F5F9" fontSize="10">Company registrations, director details</text>
                  
                  <text x="470" y="640" fill="#10B981" fontSize="12" fontWeight="bold">• Wikipedia Corporate Pages</text>
                  <text x="480" y="655" fill="#F1F5F9" fontSize="10">Public company information, history</text>
                  
                  <text x="470" y="680" fill="#10B981" fontSize="12" fontWeight="bold">• Company Websites</text>
                  <text x="480" y="695" fill="#F1F5F9" fontSize="10">Board members, financial reports</text>
                  
                  <text x="470" y="720" fill="#10B981" fontSize="12" fontWeight="bold">• Regulatory Filings</text>
                  <text x="480" y="735" fill="#F1F5F9" fontSize="10">Annual reports, shareholding patterns</text>
                  
                  {/* Graph Database Notes */}
                  <rect x="800" y="550" width="350" height="200" rx="10" fill="rgba(30, 41, 59, 0.9)" stroke="#475569" strokeWidth="1"/>
                  <text x="975" y="575" textAnchor="middle" fill="#F1F5F9" fontSize="16" fontWeight="bold">NEO4J GRAPH MODEL</text>
                  
                  <text x="820" y="600" fill="#3B82F6" fontSize="12" fontWeight="bold">Nodes (Entities):</text>
                  <text x="830" y="615" fill="#F1F5F9" fontSize="10">Company, Director, Board_Member, Subsidiary</text>
                  
                  <text x="820" y="640" fill="#10B981" fontSize="12" fontWeight="bold">Relationships:</text>
                  <text x="830" y="655" fill="#F1F5F9" fontSize="10">DIRECTED, BOARD_OF, OWNS, HAS_SHARES</text>
                  <text x="830" y="670" fill="#F1F5F9" fontSize="10">REPORTS, FINANCIAL_OF, RELATED_TO</text>
                  
                  <text x="820" y="695" fill="#F59E0B" fontSize="12" fontWeight="bold">Graph Algorithms:</text>
                  <text x="830" y="710" fill="#F1F5F9" fontSize="10">• PageRank for influential directors</text>
                  <text x="830" y="725" fill="#F1F5F9" fontSize="10">• Community detection for business groups</text>
                  <text x="830" y="740" fill="#F1F5F9" fontSize="10">• Shortest path for connections</text>
                </svg>
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer className={`pt-12 text-center border-t border-white/10 transform transition-all duration-1000 delay-900 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <div className="flex flex-wrap justify-center items-center gap-8 mb-6">
              <div className="flex items-center gap-2 text-gray-400">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                System Online
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <Database className="w-4 h-4" />
                Neo4j v5.0
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <Globe className="w-4 h-4" />
                Real-time Sync
              </div>
            </div>
            
            <p className="text-gray-500 text-sm">
              Built by <span className="text-yellow-400 font-semibold">Prajjwal Rawat</span> |  
              Powered by Neo4j, Node.js, Selenium & React
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default HomePage;