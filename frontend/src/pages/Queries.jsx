import { useState } from "react";
import GraphView from "../components/GraphView";

const Queries = () => {
  const [selectedQuery, setSelectedQuery] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const queryOptions = [
    { label: "Full Graph (getFullGraph)", value: "full-graph" },
    { label: "Company by CIN", value: "company-by-cin" },
    { label: "Director by DIN", value: "director-by-din" },
    { label: "Secondary Companies", value: "secondary-companies" },
  ];

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
        case "company-by-cin":
          const cin = prompt("Enter CIN:");
          if (!cin) {
            setLoading(false);
            return;
          }
          url = `/api/graph/company/${cin}`;
          break;
        case "director-by-din":
          const din = prompt("Enter DIN:");
          if (!din) {
            setLoading(false);
            return;
          }
          url = `/api/graph/director/${din}`;
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
      
      // Validate graph data
      if (selectedQuery === "full-graph") {
        if (!data.nodes || !data.links) {
          throw new Error("Invalid graph data structure");
        }
        console.log(`Graph data: ${data.nodes.length} nodes, ${data.links.length} links`);
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

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Run Predefined Queries</h2>

      <div className="mb-4">
        <select
          value={selectedQuery}
          onChange={(e) => setSelectedQuery(e.target.value)}
          className="p-2 border rounded mr-4 min-w-[200px]"
        >
          <option value="">Select a query</option>
          {queryOptions.map((q) => (
            <option key={q.value} value={q.value}>
              {q.label}
            </option>
          ))}
        </select>

        <button
          onClick={runQuery}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
          disabled={!selectedQuery || loading}
        >
          {loading ? "Running..." : "Run Query"}
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <strong>Error:</strong> {error}
        </div>
      )}

      {result && (
        <div className="mt-6">
          <h3 className="text-lg font-medium mb-2">Result:</h3>

          {selectedQuery === "full-graph" && result?.nodes && result?.links ? (
            <div>
              <div className="mb-2 text-sm text-gray-600">
                Graph: {result.nodes.length} nodes, {result.links.length} links
              </div>
              <GraphView nodes={result.nodes} links={result.links} />
            </div>
          ) : (
            <pre className="bg-gray-100 p-4 rounded overflow-x-auto max-h-[500px] text-sm">
              {JSON.stringify(result, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
};

export default Queries;