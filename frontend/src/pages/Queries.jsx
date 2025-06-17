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
    { label: "Company by CIN", value: "company-by-cin" },
    { label: "Director by DIN", value: "director-by-din" },
    { label: "Secondary Companies", value: "secondary-companies" },
  ];

  // Helper function to convert company data to graph format
  const convertCompanyToGraph = (companyData) => {
    const nodes = [];
    const links = [];
    let nodeId = 1;

    // Add company node
    const companyNode = {
      id: nodeId++,
      label: companyData.name || "Unknown Company",
      properties: {
        name: companyData.name,
        cin: companyData.cin,
        class: companyData.class,
        category: companyData.category,
        sub_category: companyData.sub_category,
        authorized_cap: companyData.authorized_cap,
        paidup_cap: companyData.paidup_cap,
        registration_number: companyData.registration_number,
        email: companyData.email,
        date_of_incorporation: companyData.date_of_incorporation,
        address: companyData.address,
        state: companyData.state,
        country: companyData.country,
        pincode: companyData.pincode,
        activity_description: companyData.activity_description,
        company_status: companyData.company_status,
        company_sub_category: companyData.company_sub_category,
        roc: companyData.roc,
        listing_status: companyData.listing_status,
        principal_business_activity: companyData.principal_business_activity
      },
      nodeType: "Company",
      type: "primary"
    };
    nodes.push(companyNode);

    // Add director nodes and links
    if (companyData.directors && Array.isArray(companyData.directors)) {
      companyData.directors.forEach(director => {
        if (director.name) {
          const directorNode = {
            id: nodeId++,
            label: director.name,
            properties: {
              name: director.name,
              din: director.din,
              designation: director.designation,
              director_id: director.director_id
            },
            nodeType: "Director",
            type: "director"
          };
          nodes.push(directorNode);

          // Create link from director to company
          links.push({
            source: directorNode.id,
            target: companyNode.id,
            relationship: director.designation || "DIRECTED",
            type: "DIRECTED",
            properties: {
              designation: director.designation
            }
          });
        }
      });
    }

    return { nodes, links };
  };

  // Helper function to convert director data to graph format
  const convertDirectorToGraph = (directorData) => {
    const nodes = [];
    const links = [];
    let nodeId = 1;

    // Add director node
    const directorNode = {
      id: nodeId++,
      label: directorData.name || "Unknown Director",
      properties: {
        name: directorData.name,
        din: directorData.din,
        director_id: directorData.director_id,
        address: directorData.address,
        state: directorData.state,
        country: directorData.country,
        pincode: directorData.pincode,
        phone: directorData.phone,
        email: directorData.email
      },
      nodeType: "Director",
      type: "director"
    };
    nodes.push(directorNode);

    // Add company nodes and links
    if (directorData.companies && Array.isArray(directorData.companies)) {
      directorData.companies.forEach(company => {
        if (company.name) {
          const companyNode = {
            id: nodeId++,
            label: company.name,
            properties: {
              name: company.name,
              cin: company.cin,
              company_id: company.company_id,
              designation: company.designation
            },
            nodeType: "Company",
            type: "secondary"
          };
          nodes.push(companyNode);

          // Create link from director to company
          links.push({
            source: directorNode.id,
            target: companyNode.id,
            relationship: company.designation || "DIRECTED",
            type: "DIRECTED",
            properties: {
              designation: company.designation
            }
          });
        }
      });
    }

    return { nodes, links };
  };

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
              principal_business_activity: company.principal_business_activity
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
      let inputValue = "";

      switch (selectedQuery) {
        case "full-graph":
          url = "/api/graph";
          break;
        case "company-by-cin":
          inputValue = prompt("Enter CIN:");
          if (!inputValue) {
            setLoading(false);
            return;
          }
          url = `/api/graph/company/${inputValue}`;
          break;
        case "director-by-din":
          inputValue = prompt("Enter DIN:");
          if (!inputValue) {
            setLoading(false);
            return;
          }
          url = `/api/graph/director/${inputValue}`;
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
      case "company-by-cin":
        return result.found && (result.directors || result.name);
      case "director-by-din":
        return result.found && (result.companies || result.name);
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
      case "company-by-cin":
        return convertCompanyToGraph(result);
      case "director-by-din":
        return convertDirectorToGraph(result);
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
      case "company-by-cin":
        return `Company: ${result?.name || 'Unknown'} and its Directors`;
      case "director-by-din":
        return `Director: ${result?.name || 'Unknown'} and their Companies`;
      case "secondary-companies":
        return `Secondary Companies (${result?.count || 0} total, showing first 50)`;
      default:
        return "Graph Visualization";
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

          {shouldShowGraph() ? (
            <div>
              <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">Graph Visualization Available</h4>
                <p className="text-sm text-blue-600">
                  {selectedQuery === "full-graph" && `Displaying ${result.nodes?.length || 0} nodes and ${result.links?.length || 0} relationships`}
                  {selectedQuery === "company-by-cin" && `Showing company "${result.name}" with ${result.directors?.length || 0} directors`}
                  {selectedQuery === "director-by-din" && `Showing director "${result.name}" with ${result.companies?.length || 0} companies`}
                  {selectedQuery === "secondary-companies" && `Showing ${Math.min(result.secondary_companies?.length || 0, 50)} secondary companies`}
                </p>
              </div>

              {selectedQuery === "full-graph" ? (
                <GraphView nodes={result.nodes} links={result.links} />
              ) : (
                <SimpleGraphView 
                  nodes={getGraphData()?.nodes || []} 
                  links={getGraphData()?.links || []} 
                  title={getGraphTitle()}
                />
              )}

              <details className="mt-4">
                <summary className="cursor-pointer text-sm text-blue-600 hover:text-blue-800">
                  Show Raw JSON Data
                </summary>
                <pre className="bg-gray-100 p-4 rounded overflow-x-auto max-h-[300px] text-sm mt-2">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </details>
            </div>
          ) : (
            <div>
              <pre className="bg-gray-100 p-4 rounded overflow-x-auto max-h-[500px] text-sm">
                {JSON.stringify(result, null, 2)}
              </pre>
              {(result?.nodes && result?.links) && (
                <div className="mt-2 text-sm text-blue-600">
                  Note: This appears to be graph data. Try selecting "Full Graph" query to visualize it.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Query Information */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-800 mb-2">Query Information</h4>
        <div className="text-sm text-gray-600 space-y-1">
          <p><strong>Full Graph:</strong> Displays the complete network with all relationships</p>
          <p><strong>Company by CIN:</strong> Shows a specific company and its directors in a focused view</p>
          <p><strong>Director by DIN:</strong> Shows a specific director and their associated companies</p>
          <p><strong>Secondary Companies:</strong> Displays companies not in the original dataset (limited to 50 for performance)</p>
        </div>
      </div>
    </div>
  );
};

export default Queries;