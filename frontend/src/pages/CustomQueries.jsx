import { useState } from "react";
import CustomGraphView from "../components/CustomGraphView";

const CustomQueries = () => {
  const [selectedQuery, setSelectedQuery] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const customQueryOptions = [
    { 
      label: "Top Paid Defence Companies", 
      value: "top-paid-defence",
      description: "Top 10 defence companies by paid capital with ALL their directors",
      category: "Defence",
      icon: "🛡️"
    },
    { 
      label: "Oldest Trading Companies", 
      value: "oldest-trading",
      description: "Top 10 oldest trading companies with ALL their directors",
      category: "Trading",
      icon: "📈"
    },
    { 
      label: "Top Business Companies", 
      value: "business-companies",
      description: "Top 10 business companies by paid capital with ALL their directors",
      category: "Business",
      icon: "🏢"
    },
    { 
      label: "Non-Government Defence", 
      value: "non-gov-defence",
      description: "10 non-government defence companies with ALL their directors",
      category: "Defence",
      icon: "🛡️"
    },
    { 
      label: "Defence by Director Count", 
      value: "defence-by-directors",
      description: "Top 10 defence companies by number of directors",
      category: "Defence",
      icon: "👥"
    },
    { 
      label: "Union Government Defence", 
      value: "union-gov-defence",
      description: "Top 10 union government defence companies by authorized capital",
      category: "Defence",
      icon: "🏛️"
    },
    { 
      label: "Electronics Companies", 
      value: "electronics-companies",
      description: "Top Defence Electronics companies with ALL their directors",
      category: "Electronics",
      icon: "💻"
    },
    { 
      label: "Recent Defence Companies", 
      value: "recent-defence",
      description: "10 most recently incorporated defence companies with ALL their directors",
      category: "Defence",
      icon: "🆕"
    },
    { 
      label: "Directors by Capital", 
      value: "directors-by-capital",
      description: "Top 10 directors by total authorized capital of their companies",
      category: "Directors",
      icon: "💰"
    }
  ];

  const queryCategories = customQueryOptions.reduce((acc, query) => {
    if (!acc[query.category]) {
      acc[query.category] = [];
    }
    acc[query.category].push(query);
    return acc;
  }, {});

  const runCustomQuery = async () => {
    if (!selectedQuery) return;

    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const url = `/api/graph/query?type=${selectedQuery}`;
      const res = await fetch(url);
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      
      const data = await res.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      setResult(data);
    } catch (err) {
      setError(err.message);
      setResult({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return 'N/A';
    const num = parseFloat(amount);
    if (num >= 10000000) {
      return `₹${(num / 10000000).toFixed(2)} Cr`;
    } else if (num >= 100000) {
      return `₹${(num / 100000).toFixed(2)} L`;
    } else {
      return `₹${num.toLocaleString()}`;
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      'Defence': 'from-red-500 to-red-600',
      'Trading': 'from-blue-500 to-blue-600',
      'Business': 'from-green-500 to-green-600',
      'Directors': 'from-purple-500 to-purple-600',
      'Electronics': 'from-orange-500 to-orange-600'
    };
    return colors[category] || 'from-gray-500 to-gray-600';
  };

  const getStats = () => {
    if (!result || result.error) return null;
    return {
      nodes: result.nodes?.length || 0,
      links: result.links?.length || 0,
      companies: result.nodes?.filter(n => n.nodeType === 'Company').length || 0,
      directors: result.nodes?.filter(n => n.nodeType === 'Director').length || 0,
    };
  };

  const getCompanyDirectorBreakdown = () => {
    if (!result || result.error || !result.nodes || !result.links) return null;

    const companies = result.nodes.filter(n => n.nodeType === 'Company');
    const directors = result.nodes.filter(n => n.nodeType === 'Director');
    
    const companyDirectorMap = {};
    
    companies.forEach(company => {
      const companyDirectors = result.links
        .filter(link => link.target === company.id)
        .map(link => {
          const director = directors.find(d => d.id === link.source);
          return {
            director: director,
            relationship: link.properties
          };
        })
        .filter(item => item.director);
      
      companyDirectorMap[company.id] = {
        company: company,
        directors: companyDirectors,
        directorCount: companyDirectors.length
      };
    });

    return companyDirectorMap;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-6">
      {/* Header */}
      <div className="mb-8 text-center">
        <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-4">
          Custom Network Queries
        </h2>
        <p className="text-gray-300 text-lg">
          Explore specialized patterns in the corporate network
        </p>
      </div>

      {/* Query Selection */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6 mb-8 transition-all duration-300 hover:bg-gray-800/70">
        <h3 className="text-xl font-semibold mb-6 text-blue-300">Select Query Type</h3>
        
        <div className="space-y-6 mb-6">
          {Object.entries(queryCategories).map(([category, queries]) => (
            <div key={category} className="space-y-4">
              <div className={`inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r ${getCategoryColor(category)} text-white font-medium shadow-lg`}>
                {category} ({queries.length})
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {queries.map((option) => (
                  <div 
                    key={option.value}
                    className={`group relative overflow-hidden rounded-xl p-4 cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                      selectedQuery === option.value 
                        ? 'bg-gradient-to-r from-blue-600/30 to-purple-600/30 border-2 border-blue-400 shadow-2xl shadow-blue-500/25' 
                        : 'bg-gray-800/40 border border-gray-600/50 hover:bg-gray-700/50 hover:border-gray-500'
                    }`}
                    onClick={() => setSelectedQuery(option.value)}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="customQuery"
                        value={option.value}
                        checked={selectedQuery === option.value}
                        onChange={() => setSelectedQuery(option.value)}
                        className="mt-1 text-blue-500 focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xl">{option.icon}</span>
                          <h5 className="font-semibold text-white group-hover:text-blue-300 transition-colors">
                            {option.label}
                          </h5>
                        </div>
                        <p className="text-sm text-gray-300">{option.description}</p>
                      </div>
                    </div>
                    {selectedQuery === option.value && (
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl animate-pulse"></div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={runCustomQuery}
            className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:from-blue-700 hover:to-purple-700 hover:shadow-lg hover:shadow-blue-500/25 transform hover:scale-105"
            disabled={!selectedQuery || loading}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                Running Query...
              </div>
            ) : (
              "Run Query"
            )}
          </button>
          
          {selectedQuery && (
            <div className="text-sm text-gray-300 bg-gray-800/50 px-4 py-2 rounded-lg">
              <strong className="text-blue-300">Query:</strong> {customQueryOptions.find(q => q.value === selectedQuery)?.description}
            </div>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-900/30 border border-red-500/50 rounded-xl p-4 mb-6 backdrop-blur-sm animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-sm font-bold">!</span>
            </div>
            <div>
              <h4 className="font-semibold text-red-300">Query Error</h4>
              <p className="text-sm text-red-200 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {result && !result.error && (
        <div className="space-y-8 animate-in fade-in duration-500">
          {/* Statistics */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6">
            <h3 className="text-xl font-semibold mb-6 text-blue-300">Query Results</h3>
            
            <div className="grid md:grid-cols-4 gap-4 mb-6">
              {(() => {
                const stats = getStats();
                const statItems = [
                  { label: "Total Nodes", value: stats?.nodes || 0, color: "blue", icon: "🔗" },
                  { label: "Relationships", value: stats?.links || 0, color: "green", icon: "📊" },
                  { label: "Companies", value: stats?.companies || 0, color: "purple", icon: "🏢" },
                  { label: "Directors", value: stats?.directors || 0, color: "orange", icon: "👥" }
                ];
                
                return statItems.map((stat, index) => (
                  <div key={stat.label} 
                       className={`bg-gradient-to-br from-${stat.color}-500/20 to-${stat.color}-600/20 rounded-xl p-4 border border-${stat.color}-500/30 transform hover:scale-105 transition-all duration-300`}
                       style={{ animationDelay: `${index * 100}ms` }}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">{stat.icon}</span>
                      <div className={`text-2xl font-bold text-${stat.color}-300`}>{stat.value}</div>
                    </div>
                    <div className={`text-sm text-${stat.color}-200`}>{stat.label}</div>
                  </div>
                ));
              })()}
            </div>

            <div className="text-sm text-gray-300 bg-gray-900/50 rounded-lg p-4">
              <p><strong className="text-blue-300">Query Type:</strong> {result.query_type}</p>
              <p><strong className="text-blue-300">Description:</strong> {result.description}</p>
            </div>
          </div>

          {/* Company-Director Breakdown */}
          {(() => {
            const breakdown = getCompanyDirectorBreakdown();
            return breakdown ? (
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6">
                <h3 className="text-xl font-semibold mb-6 text-blue-300">Company-Director Details</h3>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {Object.values(breakdown).slice(0, 10).map((item, index) => (
                    <div key={item.company.id} 
                         className="bg-gray-900/50 rounded-xl p-4 border border-gray-600/30 hover:bg-gray-900/70 transition-all duration-300 transform hover:scale-[1.02]">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h4 className="font-semibold text-white text-lg mb-2">
                            {index + 1}. {item.company.properties.name || 'Unknown Company'}
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {item.company.properties.paid_capital && (
                              <span className="bg-green-500/20 text-green-300 px-3 py-1 rounded-full text-sm border border-green-500/30">
                                💰 {formatCurrency(item.company.properties.paid_capital)}
                              </span>
                            )}
                            <span className="bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full text-sm border border-purple-500/30">
                              👥 {item.directorCount} Directors
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {item.directors.length > 0 && (
                        <div className="mt-4">
                          <h5 className="font-medium text-gray-300 mb-3">Directors:</h5>
                          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {item.directors.slice(0, 6).map((directorInfo, dirIndex) => (
                              <div key={`${directorInfo.director.id}-${dirIndex}`} 
                                   className="bg-gray-800/50 rounded-lg p-3 border border-gray-600/20 hover:bg-gray-700/50 transition-all duration-200">
                                <div className="font-medium text-white text-sm">
                                  {directorInfo.director.properties.name || 'Unknown Director'}
                                </div>
                                {directorInfo.relationship.designation && (
                                  <div className="text-gray-400 text-xs mt-1">
                                    {directorInfo.relationship.designation}
                                  </div>
                                )}
                              </div>
                            ))}
                            {item.directors.length > 6 && (
                              <div className="bg-gray-700/30 rounded-lg p-3 border border-gray-600/20 flex items-center justify-center">
                                <span className="text-gray-400 text-sm">+{item.directors.length - 6} more</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : null;
          })()}

          {/* Graph Visualization */}
          {result.nodes && result.links && result.nodes.length > 0 && (
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6">
              <h3 className="text-xl font-semibold mb-4 text-blue-300">Network Visualization</h3>
              <div className="mb-4 p-4 bg-blue-900/30 rounded-xl border border-blue-500/30">
                <p className="text-sm text-blue-200">
                  <strong>Visualization:</strong> {result.nodes.filter(n => n.nodeType === 'Company').length} companies 
                  connected to {result.nodes.filter(n => n.nodeType === 'Director').length} directors 
                  through {result.links.length} relationships
                </p>
              </div>
              <div className="bg-gray-900/50 rounded-xl p-4">
                <CustomGraphView 
                  nodes={result.nodes} 
                  links={result.links}
                  queryType={selectedQuery}
                  title={result.description}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CustomQueries;