import { useState } from "react";
import GraphView from "../components/GraphView";
import SimpleGraphView from "../components/SimpleGraphView";

const Queries = () => {
  const [selectedQuery, setSelectedQuery] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const queryOptions = [
    { label: "Full Graph (getFullGraph)", value: "full-graph" },
    { label: "Secondary Companies", value: "secondary-companies" },
  ];

  // Helper function to convert secondary companies to graph format
  const convertSecondaryCompaniesToGraph = (secondaryData) => {
    const nodes = [];
    const links = [];
    let nodeId = 1;

    // Create a central "Secondary Companies" node
    const centralNode = {
      id: nodeId++,
      label: "Secondary Companies",
      properties: {
        name: "Secondary Companies",
        type: "collection",
        count: secondaryData.secondary_companies?.length || 0
      },
      nodeType: "Collection",
      type: "primary"
    };
    nodes.push(centralNode);

    // Add individual secondary company nodes
    if (secondaryData.secondary_companies && Array.isArray(secondaryData.secondary_companies)) {
      secondaryData.secondary_companies.slice(0, 50).forEach(company => { // Limit to 50 for performance
        if (company.name || company.cin) {
          const companyNode = {
            id: nodeId++,
            label: company.name || company.cin || "Unknown Company",
            properties: {
              name: company.name,
              cin: company.cin,
              class: company.class,
              category: company.category,
              sub_category: company.sub_category,
              authorized_cap: company.authorized_cap,
              paidup_cap: company.paidup_cap,
              registration_number: company.registration_number,
              email: company.email,
              date_of_incorporation: company.date_of_incorporation,
              address: company.address,
              state: company.state,
              country: company.country,
              pincode: company.pincode,
              activity_description: company.activity_description,
              company_status: company.company_status,
              roc: company.roc,
              listing_status: company.listing_status,
              principal_business_activity: company.principal_business_activity,
              primary_info: company.primary_info || {}
            },
            nodeType: "Company",
            type: "secondary"
          };
          nodes.push(companyNode);

          // Create link from central node to company
          links.push({
            source: centralNode.id,
            target: companyNode.id,
            relationship: "CONTAINS",
            type: "CONTAINS",
            properties: {}
          });
        }
      });
    }

    return { nodes, links };
  };

  const runQuery = async () => {
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      let url = "";

      switch (selectedQuery) {
        case "full-graph":
          url = "/api/graph";
          break;
        case "secondary-companies":
          url = "/api/graph/secondary-companies";
          break;
        default:
          setLoading(false);
          return;
      }

      console.log("Fetching from:", url);
      const res = await fetch(url);
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      
      const data = await res.json();
      console.log("Received data:", data);
      
      // Enhanced validation and debugging for graph data
      if (selectedQuery === "full-graph") {
        if (!data.nodes || !data.links) {
          console.error("Invalid graph data structure:", data);
          throw new Error("Invalid graph data structure - missing nodes or links");
        }
        
        if (!Array.isArray(data.nodes) || !Array.isArray(data.links)) {
          console.error("Nodes or links are not arrays:", { nodes: data.nodes, links: data.links });
          throw new Error("Invalid graph data - nodes and links must be arrays");
        }
        
        console.log(`Graph data validated: ${data.nodes.length} nodes, ${data.links.length} links`);
      }
      
      setResult(data);
    } catch (err) {
      console.error("Query failed:", err);
      setError(err.message);
      setResult({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  // Function to determine if we should show graph visualization
  const shouldShowGraph = () => {
    if (!result || result.error) return false;
    
    switch (selectedQuery) {
      case "full-graph":
        return result.nodes && result.links && result.nodes.length > 0;
      case "secondary-companies":
        return result.secondary_companies && result.secondary_companies.length > 0;
      default:
        return false;
    }
  };

  // Function to get graph data based on query type
  const getGraphData = () => {
    if (!result) return null;

    switch (selectedQuery) {
      case "full-graph":
        return { nodes: result.nodes, links: result.links };
      case "secondary-companies":
        return convertSecondaryCompaniesToGraph(result);
      default:
        return null;
    }
  };

  // Function to get graph title
  const getGraphTitle = () => {
    switch (selectedQuery) {
      case "full-graph":
        return "Full Network Graph";
      case "secondary-companies":
        return `Secondary Companies (${result?.count || 0} total, showing first 50)`;
      default:
        return "Graph Visualization";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 transform transition-all duration-500 ease-out animate-fade-in">
          <h2 className="text-4xl font-bold text-white mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Run Predefined Queries
          </h2>
          <p className="text-slate-400 text-lg">Execute network analysis queries and visualize graph data</p>
        </div>

        {/* Query Controls */}
        <div className="mb-8 transform transition-all duration-500 ease-out delay-100 animate-fade-in">
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700 shadow-2xl">
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <div className="flex-1 min-w-0">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Select Query Type
                </label>
                <select
                  value={selectedQuery}
                  onChange={(e) => setSelectedQuery(e.target.value)}
                  className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-white 
                           focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                           transition-all duration-300 ease-in-out hover:bg-slate-600"
                >
                  <option value="" className="bg-slate-700">Select a query</option>
                  {queryOptions.map((q) => (
                    <option key={q.value} value={q.value} className="bg-slate-700">
                      {q.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex-shrink-0">
                <button
                  onClick={runQuery}
                  className={`px-8 py-3 rounded-lg font-semibold text-white transition-all duration-300 ease-in-out transform 
                    ${!selectedQuery || loading 
                      ? 'bg-slate-600 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 hover:scale-105 hover:shadow-lg active:scale-95'
                    }
                    ${loading ? 'animate-pulse' : ''}
                  `}
                  disabled={!selectedQuery || loading}
                >
                  {loading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Running...</span>
                    </div>
                  ) : "Run Query"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 transform transition-all duration-500 ease-out animate-slide-down">
            <div className="bg-red-900/20 border border-red-500/50 text-red-300 px-6 py-4 rounded-xl backdrop-blur-sm">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <strong>Error:</strong>
                <span>{error}</span>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="transform transition-all duration-500 ease-out animate-fade-in-up">
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 shadow-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-700">
                <h3 className="text-xl font-semibold text-white flex items-center space-x-2">
                  <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Query Results</span>
                </h3>
              </div>

              <div className="p-6">
                {shouldShowGraph() ? (
                  <div className="space-y-6">
                    {/* Graph Info Card */}
                    <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-lg p-4 border border-blue-500/30">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
                        <h4 className="font-semibold text-blue-300">Graph Visualization</h4>
                      </div>
                      <p className="text-sm text-blue-200">
                        {selectedQuery === "full-graph" && `Displaying ${result.nodes?.length || 0} nodes and ${result.links?.length || 0} relationships`}
                        {selectedQuery === "secondary-companies" && `Showing ${Math.min(result.secondary_companies?.length || 0, 50)} secondary companies`}
                      </p>
                    </div>

                    {/* Graph Visualization */}
                    <div className="bg-slate-900/50 rounded-lg border border-slate-600 overflow-hidden">
                      {selectedQuery === "full-graph" ? (
                        <GraphView nodes={result.nodes} links={result.links} />
                      ) : (
                        <SimpleGraphView 
                          nodes={getGraphData()?.nodes || []} 
                          links={getGraphData()?.links || []} 
                          title={getGraphTitle()}
                        />
                      )}
                    </div>

                    {/* Raw Data Toggle */}
                    <details className="group">
                      <summary className="cursor-pointer text-slate-300 hover:text-white transition-colors duration-200 flex items-center space-x-2 py-2">
                        <svg className="w-4 h-4 transform group-open:rotate-90 transition-transform duration-200" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className="font-medium">Show Raw JSON Data</span>
                      </summary>
                      <div className="mt-3 bg-slate-900 rounded-lg border border-slate-600 overflow-hidden">
                        <pre className="p-4 text-sm text-slate-300 overflow-x-auto max-h-[400px] scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800">
                          {JSON.stringify(result, null, 2)}
                        </pre>
                      </div>
                    </details>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-slate-900 rounded-lg border border-slate-600 overflow-hidden">
                      <pre className="p-4 text-sm text-slate-300 overflow-x-auto max-h-[500px] scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800">
                        {JSON.stringify(result, null, 2)}
                      </pre>
                    </div>
                    {(result?.nodes && result?.links) && (
                      <div className="text-sm text-blue-400 bg-blue-900/20 rounded-lg p-3 border border-blue-500/30">
                        💡 This appears to be graph data. Try selecting "Full Graph" query to visualize it.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Query Information */}
        <div className="mt-8 transform transition-all duration-500 ease-out delay-200 animate-fade-in">
          <div className="bg-slate-800/30 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
            <h4 className="font-semibold text-white mb-4 flex items-center space-x-2">
              <svg className="w-5 h-5 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <span>Available Queries</span>
            </h4>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600 transition-all duration-300 hover:bg-slate-700/50">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <strong className="text-slate-200">Full Graph</strong>
                </div>
                <p className="text-slate-400">Displays the complete network with all relationships and connections</p>
              </div>
              <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600 transition-all duration-300 hover:bg-slate-700/50">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                  <strong className="text-slate-200">Secondary Companies</strong>
                </div>
                <p className="text-slate-400">Shows companies not in the original dataset (limited to 50 for optimal performance)</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slide-down {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out forwards;
        }
        
        .animate-slide-down {
          animation: slide-down 0.4s ease-out forwards;
        }
        
        .scrollbar-thin {
          scrollbar-width: thin;
        }
        
        .scrollbar-thumb-slate-600::-webkit-scrollbar-thumb {
          background-color: #475569;
          border-radius: 0.375rem;
        }
        
        .scrollbar-track-slate-800::-webkit-scrollbar-track {
          background-color: #1e293b;
        }
        
        .scrollbar-thin::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
      `}</style>
    </div>
  );
};

export default Queries;