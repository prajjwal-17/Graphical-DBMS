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
      description: "Top 10 defence companies by paid capital with their directors"
    },
    { 
      label: "Oldest Trading Companies", 
      value: "oldest-trading",
      description: "Top 10 oldest trading companies with their directors"
    },
    { 
      label: "Most Connected Directors", 
      value: "most-connected-directors",
      description: "Top 5 directors with the most company connections"
    }
  ];

  const runCustomQuery = async () => {
    if (!selectedQuery) return;

    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const url = `/api/graph/query?type=${selectedQuery}`;
      console.log("Fetching custom query from:", url);
      
      const res = await fetch(url);
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      
      const data = await res.json();
      console.log("Received custom query data:", data);
      
      // Validate the response structure
      if (data.error) {
        throw new Error(data.error);
      }

      if (!data.nodes || !Array.isArray(data.nodes)) {
        console.warn("Invalid or missing nodes in response");
      }

      if (!data.links || !Array.isArray(data.links)) {
        console.warn("Invalid or missing links in response");
      }
      
      setResult(data);
    } catch (err) {
      console.error("Custom query failed:", err);
      setError(err.message);
      setResult({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  // Function to get query description
  const getQueryDescription = () => {
    const query = customQueryOptions.find(q => q.value === selectedQuery);
    return query ? query.description : '';
  };

  // Function to get formatted statistics
  const getQueryStats = () => {
    if (!result || result.error) return null;

    const stats = {
      nodes: result.nodes?.length || 0,
      links: result.links?.length || 0,
      companies: result.nodes?.filter(n => n.nodeType === 'Company').length || 0,
      directors: result.nodes?.filter(n => n.nodeType === 'Director').length || 0,
      totalRecords: result.total_records || 0,
      uniqueNodes: result.unique_nodes || 0
    };

    return stats;
  };

  // Function to format debug info for display
  const getDebugInfo = () => {
    if (!result?.debug_info) return null;
    return result.debug_info;
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Custom Network Queries</h2>
        <p className="text-gray-600">
          Run specialized queries to explore specific patterns in the corporate network
        </p>
      </div>

      {/* Query Selection Section */}
      <div className="bg-white rounded-lg border p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">Select Query Type</h3>
        
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          {customQueryOptions.map((option) => (
            <div 
              key={option.value}
              className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                selectedQuery === option.value 
                  ? 'border-blue-500 bg-blue-50 shadow-md' 
                  : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
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
                  className="mt-1"
                />
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">{option.label}</h4>
                  <p className="text-sm text-gray-600">{option.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={runCustomQuery}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
            disabled={!selectedQuery || loading}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                Running Query...
              </div>
            ) : (
              "Run Query"
            )}
          </button>
          
          {selectedQuery && (
            <div className="text-sm text-gray-600">
              <strong>Query:</strong> {getQueryDescription()}
            </div>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
              <span className="text-white text-xs font-bold">!</span>
            </div>
            <div>
              <h4 className="font-medium text-red-800">Query Error</h4>
              <p className="text-sm text-red-600 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Results Section */}
      {result && !result.error && (
        <div className="space-y-6">
          {/* Query Statistics */}
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-semibold mb-4">Query Results</h3>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              {(() => {
                const stats = getQueryStats();
                return stats ? (
                  <>
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-blue-600">{stats.nodes}</div>
                      <div className="text-sm text-blue-800">Total Nodes</div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-green-600">{stats.links}</div>
                      <div className="text-sm text-green-800">Relationships</div>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-purple-600">{stats.companies}</div>
                      <div className="text-sm text-purple-800">Companies</div>
                    </div>
                    <div className="bg-orange-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-orange-600">{stats.directors}</div>
                      <div className="text-sm text-orange-800">Directors</div>
                    </div>
                  </>
                ) : null;
              })()}
            </div>

            <div className="text-sm text-gray-600">
              <p><strong>Query Type:</strong> {result.query_type}</p>
              <p><strong>Description:</strong> {result.description}</p>
              {result.total_records && <p><strong>Total Records:</strong> {result.total_records}</p>}
            </div>
          </div>

          {/* Debug Information (for defence companies) */}
          {getDebugInfo() && (
            <div className="bg-gray-50 rounded-lg border p-6">
              <h3 className="text-lg font-semibold mb-4">Query Details</h3>
              <div className="space-y-3">
                <p className="text-sm">
                  <strong>Unique Companies Found:</strong> {getDebugInfo().unique_companies_found}
                </p>
                {getDebugInfo().companies_list && (
                  <div>
                    <h4 className="font-medium text-gray-800 mb-2">Top Companies by Paid Capital:</h4>
                    <div className="grid gap-2">
                      {getDebugInfo().companies_list.slice(0, 5).map((company, index) => (
                        <div key={index} className="flex justify-between items-center bg-white rounded p-3 border">
                          <span className="font-medium">{company.name}</span>
                          <span className="text-sm text-gray-600">₹{company.formatted_capital}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Graph Visualization */}
          {result.nodes && result.links && result.nodes.length > 0 && (
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-semibold mb-4">Network Visualization</h3>
              <CustomGraphView 
                nodes={result.nodes} 
                links={result.links}
                queryType={selectedQuery}
                title={result.description}
              />
            </div>
          )}

          {/* Raw Data (Collapsible) */}
          <details className="bg-white rounded-lg border">
            <summary className="cursor-pointer p-6 font-medium text-gray-800 hover:bg-gray-50 rounded-lg">
              Show Raw Query Response
            </summary>
            <div className="px-6 pb-6">
              <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto max-h-96 text-sm">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          </details>
        </div>
      )}

      {/* No Results Message */}
      {result && result.message && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-yellow-500 flex items-center justify-center">
              <span className="text-white text-xs">i</span>
            </div>
            <div>
              <h4 className="font-medium text-yellow-800">No Data Found</h4>
              <p className="text-sm text-yellow-600 mt-1">{result.message}</p>
            </div>
          </div>
        </div>
      )}

      {/* Query Information Panel */}
      <div className="mt-8 bg-gray-50 rounded-lg border p-6">
        <h4 className="font-semibold text-gray-800 mb-4">Available Custom Queries</h4>
        <div className="grid md:grid-cols-3 gap-6">
          {customQueryOptions.map((option) => (
            <div key={option.value} className="bg-white rounded-lg p-4 border">
              <h5 className="font-medium text-gray-900 mb-2">{option.label}</h5>
              <p className="text-sm text-gray-600 mb-3">{option.description}</p>
              <div className="text-xs text-gray-500">
                <code>/api/graph/query?type={option.value}</code>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h5 className="font-medium text-blue-800 mb-2">How to Use</h5>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Select a query type from the options above</li>
            <li>• Click "Run Query" to execute the Neo4j query</li>
            <li>• View results in both statistical summary and network graph format</li>
            <li>• Click on nodes in the graph to view detailed information</li>
            <li>• Use graph controls to zoom, pan, and manipulate the visualization</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CustomQueries;