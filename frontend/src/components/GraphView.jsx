import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { X, User, Building, Info, Hash, Calendar, MapPin, Phone, Mail } from 'lucide-react';

const GraphView = ({ nodes, links }) => {
  const svgRef = useRef();
  const [simulation, setSimulation] = useState(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, k: 1 });
  const [selectedNode, setSelectedNode] = useState(null);

  useEffect(() => {
    if (!nodes || !links || nodes.length === 0) {
      console.log('GraphView: No data to render');
      return;
    }

    // Deduplicate nodes by ID
    const uniqueNodes = [];
    const nodeMap = new Map();
    
    nodes.forEach(node => {
      if (!nodeMap.has(node.id)) {
        nodeMap.set(node.id, node);
        uniqueNodes.push(node);
      } else {
        // Merge properties if needed
        const existing = nodeMap.get(node.id);
        if (node.label && !existing.label) existing.label = node.label;
        if (node.name && !existing.name) existing.name = node.name;
        if (node.type && !existing.type) existing.type = node.type;
        if (node.nodeType && !existing.nodeType) existing.nodeType = node.nodeType;
      }
    });

    // Deduplicate links
    const uniqueLinks = [];
    const linkSet = new Set();
    
    links.forEach(link => {
      const linkKey = `${link.source}-${link.target}-${link.relationship || 'default'}`;
      const reverseLinkKey = `${link.target}-${link.source}-${link.relationship || 'default'}`;
      
      if (!linkSet.has(linkKey) && !linkSet.has(reverseLinkKey)) {
        linkSet.add(linkKey);
        uniqueLinks.push(link);
      }
    });

    console.log('GraphView: Rendering deduplicated graph with', uniqueNodes.length, 'nodes and', uniqueLinks.length, 'links');

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = 1200;
    const height = 800;

    svg.attr('width', width).attr('height', height);

    // Add zoom and pan
    const zoom = d3.zoom()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        const { transform } = event;
        setTransform({ x: transform.x, y: transform.y, k: transform.k });
        g.attr('transform', transform);
      });

    svg.call(zoom);

    // Create main group for zooming/panning
    const g = svg.append('g');

    // Create copies for D3 to modify
    const nodesCopy = uniqueNodes.map(d => ({ ...d }));
    const linksCopy = uniqueLinks.map(d => ({ ...d }));

    // Enhanced color scale for different node types
    const colorScale = d3.scaleOrdinal()
      .domain(['director', 'primary', 'secondary', 'company', 'person'])
      .range(['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7']);

    // Create simulation with improved forces
    const sim = d3.forceSimulation(nodesCopy)
      .force('link', d3.forceLink(linksCopy).id(d => d.id).distance(200).strength(0.6))
      .force('charge', d3.forceManyBody().strength(-500))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(d => d.type === 'director' ? 30 : 25))
      .force('x', d3.forceX(width / 2).strength(0.1))
      .force('y', d3.forceY(height / 2).strength(0.1));

    setSimulation(sim);

    // Create arrow markers for directed edges
    svg.append('defs').selectAll('marker')
      .data(['end'])
      .enter().append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '-0 -5 10 10')
      .attr('refX', 20)
      .attr('refY', 0)
      .attr('orient', 'auto')
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('xoverflow', 'visible')
      .append('svg:path')
      .attr('d', 'M 0,-5 L 10 ,0 L 0,5')
      .attr('fill', '#666')
      .style('stroke', 'none');

    // Create links
    const link = g.append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(linksCopy)
      .enter().append('line')
      .attr('stroke', '#666')
      .attr('stroke-opacity', 0.8)
      .attr('stroke-width', 2)
      .attr('marker-end', 'url(#arrowhead)');

    // Create relationship labels on links
    const linkLabels = g.append('g')
      .attr('class', 'link-labels')
      .selectAll('text')
      .data(linksCopy)
      .enter().append('text')
      .attr('font-size', '8px')
      .attr('font-family', 'Arial, sans-serif')
      .attr('fill', '#666')
      .attr('text-anchor', 'middle')
      .attr('dy', '-2px')
      .text(d => d.relationship || d.type || 'connected')
      .style('pointer-events', 'none');

    // Create nodes with improved sizing and click handling
    const node = g.append('g')
      .attr('class', 'nodes')
      .selectAll('circle')
      .data(nodesCopy)
      .enter().append('circle')
      .attr('r', d => {
        if (d.type === 'director' || d.nodeType === 'director') return 12;
        if (d.type === 'primary' || d.nodeType === 'primary') return 10;
        return 8;
      })
      .attr('fill', d => colorScale(d.type || d.nodeType || 'secondary'))
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .on('click', function(event, d) {
        event.stopPropagation();
        setSelectedNode(d);
        // Add visual feedback
        d3.selectAll('circle').attr('stroke-width', 2);
        d3.select(this).attr('stroke-width', 4).attr('stroke', '#ff4444');
      })
      .call(d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended));

    // Add node labels with better positioning
    const labels = g.append('g')
      .attr('class', 'labels')
      .selectAll('text')
      .data(nodesCopy)
      .enter().append('text')
      .text(d => {
        const text = d.label || d.name || `Node ${d.id}`;
        // Truncate long company names
        return text.length > 25 ? text.substring(0, 25) + '...' : text;
      })
      .attr('font-size', '9px')
      .attr('font-family', 'Arial, sans-serif')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('fill', '#333')
      .attr('font-weight', d => (d.type === 'director' || d.nodeType === 'director') ? 'bold' : 'normal')
      .style('pointer-events', 'none');

    // Add enhanced tooltips
    node.append('title')
      .text(d => {
        const lines = [
          `Name: ${d.label || d.name || d.id}`,
          `Type: ${d.type || d.nodeType || 'unknown'}`,
          `ID: ${d.id}`,
          `Click to view details`
        ];
        if (d.cin) lines.push(`CIN: ${d.cin}`);
        if (d.din) lines.push(`DIN: ${d.din}`);
        return lines.join('\n');
      });

    // Click on background to deselect
    svg.on('click', function() {
      setSelectedNode(null);
      d3.selectAll('circle').attr('stroke-width', 2).attr('stroke', '#fff');
    });

    // Update positions on each tick
    sim.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);

      // Position link labels at the midpoint of each link
      linkLabels
        .attr('x', d => (d.source.x + d.target.x) / 2)
        .attr('y', d => (d.source.y + d.target.y) / 2);

      node
        .attr('cx', d => d.x)
        .attr('cy', d => d.y);

      labels
        .attr('x', d => d.x)
        .attr('y', d => d.y + (d.type === 'director' || d.nodeType === 'director' ? 20 : 18));
    });

    // Drag functions
    function dragstarted(event, d) {
      if (!event.active) sim.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event, d) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event, d) {
      if (!event.active) sim.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    // Cleanup function
    return () => {
      sim.stop();
    };

  }, [nodes, links]);

  // Control functions
  const resetView = () => {
    if (svgRef.current) {
      const svg = d3.select(svgRef.current);
      svg.transition().duration(750).call(
        d3.zoom().transform,
        d3.zoomIdentity
      );
    }
  };

  const centerGraph = () => {
    if (simulation) {
      simulation.alphaTarget(0.3).restart();
      setTimeout(() => {
        simulation.alphaTarget(0);
      }, 1000);
    }
  };

  const zoomIn = () => {
    if (svgRef.current) {
      const svg = d3.select(svgRef.current);
      svg.transition().duration(300).call(
        d3.zoom().scaleBy,
        1.5
      );
    }
  };

  const zoomOut = () => {
    if (svgRef.current) {
      const svg = d3.select(svgRef.current);
      svg.transition().duration(300).call(
        d3.zoom().scaleBy,
        0.67
      );
    }
  };

  const toggleLabels = () => {
    const svg = d3.select(svgRef.current);
    const linkLabels = svg.selectAll('.link-labels text');
    const currentOpacity = linkLabels.style('opacity');
    linkLabels.style('opacity', currentOpacity === '0' ? '1' : '0');
  };

  // Helper function to format property values
  const formatValue = (key, value) => {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'string' && value.trim() === '') return 'Empty';
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return value.toString();
  };

  // Helper function to get appropriate icon for property
  const getPropertyIcon = (key) => {
    const keyLower = key.toLowerCase();
    if (keyLower.includes('name') || keyLower.includes('director')) return User;
    if (keyLower.includes('company') || keyLower.includes('cin')) return Building;
    if (keyLower.includes('id') || keyLower.includes('din')) return Hash;
    if (keyLower.includes('date') || keyLower.includes('time')) return Calendar;
    if (keyLower.includes('address') || keyLower.includes('location')) return MapPin;
    if (keyLower.includes('phone') || keyLower.includes('mobile')) return Phone;
    if (keyLower.includes('email') || keyLower.includes('mail')) return Mail;
    return Info;
  };

  if (!nodes || !links) {
    return (
      <div className="p-4 text-center text-gray-500">
        No graph data available
      </div>
    );
  }

  // Calculate statistics
  const uniqueNodes = new Map();
  nodes.forEach(node => {
    if (!uniqueNodes.has(node.id)) {
      uniqueNodes.set(node.id, node);
    }
  });

  const nodeStats = {
    directors: Array.from(uniqueNodes.values()).filter(n => n.type === 'director' || n.nodeType === 'director').length,
    primary: Array.from(uniqueNodes.values()).filter(n => n.type === 'primary' || n.nodeType === 'primary').length,
    secondary: Array.from(uniqueNodes.values()).filter(n => n.type === 'secondary' || n.nodeType === 'secondary').length,
    total: uniqueNodes.size
  };

  return (
    <div className="border rounded-lg p-4 bg-white">
      <div className="mb-4 flex justify-between items-center">
        <div>
          <h4 className="text-lg font-medium mb-2">Enhanced Graph Visualization</h4>
          <div className="flex gap-4 text-sm mb-2">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-red-400"></div>
              <span>Directors ({nodeStats.directors})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-teal-400"></div>
              <span>Primary Companies ({nodeStats.primary})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-blue-400"></div>
              <span>Secondary Companies ({nodeStats.secondary})</span>
            </div>
          </div>
          <div className="text-xs text-gray-600">
            Total: {nodeStats.total} nodes, {links.length} relationships
          </div>
        </div>
        
        {/* Enhanced Control Panel */}
        <div className="flex gap-2">
          <button
            onClick={zoomIn}
            className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
            title="Zoom In"
          >
            +
          </button>
          <button
            onClick={zoomOut}
            className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
            title="Zoom Out"
          >
            -
          </button>
          <button
            onClick={centerGraph}
            className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
            title="Re-center Nodes"
          >
            Center
          </button>
          <button
            onClick={toggleLabels}
            className="px-3 py-1 bg-purple-500 text-white rounded text-sm hover:bg-purple-600"
            title="Toggle Relationship Labels"
          >
            Labels
          </button>
          <button
            onClick={resetView}
            className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
            title="Reset View"
          >
            Reset
          </button>
        </div>
      </div>
      
      <div className="flex gap-4">
        {/* Graph Container */}
        <div className={`overflow-hidden border rounded relative transition-all duration-300 ${selectedNode ? 'w-2/3' : 'w-full'}`}>
          <svg ref={svgRef} className="w-full"></svg>
          
          {/* Enhanced status indicators */}
          <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white px-3 py-2 rounded text-xs">
            <div>Zoom: {Math.round(transform.k * 100)}%</div>
            <div>Nodes: {nodeStats.total}</div>
            <div>Links: {links.length}</div>
          </div>
        </div>

        {/* Node Details Panel */}
        {selectedNode && (
          <div className="w-1/3 border rounded bg-gray-50 p-4 max-h-[800px] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Node Details</h3>
              <button 
                onClick={() => setSelectedNode(null)}
                className="p-1 hover:bg-gray-200 rounded"
                title="Close Details"
              >
                <X size={16} />
              </button>
            </div>

            {/* Node Header */}
            <div className="bg-white rounded-lg p-4 mb-4 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div 
                  className="w-6 h-6 rounded-full flex-shrink-0"
                  style={{ 
                    backgroundColor: selectedNode.type === 'director' ? '#ff6b6b' : 
                                   selectedNode.type === 'primary' ? '#4ecdc4' : '#45b7d1'
                  }}
                ></div>
                <div>
                  <h4 className="font-medium text-gray-900">
                    {selectedNode.label || selectedNode.name || `Node ${selectedNode.id}`}
                  </h4>
                  <p className="text-sm text-gray-600 capitalize">
                    {selectedNode.type || selectedNode.nodeType || 'Unknown Type'}
                  </p>
                </div>
              </div>
            </div>

            {/* Basic Properties */}
            <div className="bg-white rounded-lg p-4 mb-4 shadow-sm">
              <h5 className="font-medium text-gray-800 mb-3">Basic Information</h5>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">ID:</span>
                  <span className="text-sm font-mono">{selectedNode.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Node Type:</span>
                  <span className="text-sm capitalize">{selectedNode.nodeType || 'Unknown'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Category:</span>
                  <span className="text-sm capitalize">{selectedNode.type || 'Unknown'}</span>
                </div>
              </div>
            </div>

            {/* All Properties */}
            {selectedNode.properties && Object.keys(selectedNode.properties).length > 0 && (
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <h5 className="font-medium text-gray-800 mb-3">All Properties</h5>
                <div className="space-y-3">
                  {Object.entries(selectedNode.properties).map(([key, value]) => {
                    const IconComponent = getPropertyIcon(key);
                    return (
                      <div key={key} className="border-b border-gray-100 pb-2 last:border-b-0">
                        <div className="flex items-start gap-2">
                          <IconComponent size={14} className="text-gray-400 mt-1 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                              <span className="text-sm font-medium text-gray-700 capitalize">
                                {key.replace(/_/g, ' ')}:
                              </span>
                            </div>
                            <div className="mt-1">
                              {typeof value === 'object' ? (
                                <pre className="text-xs bg-gray-50 p-2 rounded border overflow-x-auto">
                                  {JSON.stringify(value, null, 2)}
                                </pre>
                              ) : (
                                <span className="text-sm text-gray-900 break-words">
                                  {formatValue(key, value)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Raw JSON (collapsible) */}
            <details className="bg-white rounded-lg p-4 shadow-sm mt-4">
              <summary className="font-medium text-gray-800 cursor-pointer">
                Raw JSON Data
              </summary>
              <pre className="text-xs bg-gray-50 p-3 rounded border mt-3 overflow-x-auto">
                {JSON.stringify(selectedNode, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </div>
      
      <div className="mt-2 text-sm text-gray-600">
        <div className="mb-1">
          <strong>Controls:</strong> Click nodes to view details • Drag nodes to move • Mouse wheel to zoom • Drag background to pan
        </div>
        <div>
          <strong>Features:</strong> Relationship labels on edges • Directional arrows • Deduplication • Enhanced tooltips • Detailed node information panel
        </div>
      </div>
    </div>
  );
};

export default GraphView;