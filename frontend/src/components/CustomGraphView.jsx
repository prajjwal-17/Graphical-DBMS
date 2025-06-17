import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { X, User, Building, Info, Hash, Calendar, MapPin, Phone, Mail, TrendingUp, Clock, Network, ZoomIn, ZoomOut, RotateCcw, Maximize2, Eye, EyeOff, BarChart3 } from 'lucide-react';

const CustomGraphView = ({ nodes, links, queryType, title }) => {
  const svgRef = useRef();
  const [simulation, setSimulation] = useState(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, k: 1 });
  const [selectedNode, setSelectedNode] = useState(null);
  const [showStats, setShowStats] = useState(true);

  useEffect(() => {
    if (!nodes || !links || nodes.length === 0) {
      console.log('CustomGraphView: No data to render');
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
        if (node.properties && !existing.properties) existing.properties = node.properties;
        if (node.nodeType && !existing.nodeType) existing.nodeType = node.nodeType;
      }
    });

    // Deduplicate links
    const uniqueLinks = [];
    const linkSet = new Set();
    
    links.forEach(link => {
      const linkKey = `${link.source}-${link.target}-${link.type || 'default'}`;
      const reverseLinkKey = `${link.target}-${link.source}-${link.type || 'default'}`;
      
      if (!linkSet.has(linkKey) && !linkSet.has(reverseLinkKey)) {
        linkSet.add(linkKey);
        uniqueLinks.push(link);
      }
    });

    console.log('CustomGraphView: Rendering', uniqueNodes.length, 'nodes and', uniqueLinks.length, 'links for query:', queryType);

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = 1200;
    const height = 700;

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

    // Query-specific color schemes
    const getColorScheme = () => {
      switch (queryType) {
        case 'top-paid-defence':
          return {
            Company: '#dc2626', // Red for defence companies
            Director: '#7c3aed'  // Purple for directors
          };
        case 'oldest-trading':
          return {
            Company: '#059669', // Green for trading companies
            Director: '#0891b2'  // Blue for directors
          };
        case 'most-connected-directors':
          return {
            Company: '#ea580c', // Orange for companies
            Director: '#be123c'  // Deep pink for highly connected directors
          };
        default:
          return {
            Company: '#4f46e5',
            Director: '#dc2626'
          };
      }
    };

    const colorScheme = getColorScheme();

    // Enhanced node sizing based on query type and properties
    const getNodeSize = (node) => {
      const baseSize = node.nodeType === 'Director' ? 12 : 10;
      
      switch (queryType) {
        case 'top-paid-defence':
          if (node.nodeType === 'Company' && node.properties?.paid_capital) {
            const capital = parseFloat(node.properties.paid_capital) || 0;
            return Math.max(baseSize, Math.min(25, baseSize + (capital / 10000000) * 2));
          }
          break;
        case 'oldest-trading':
          if (node.nodeType === 'Company' && node.properties?.inc_date) {
            const year = new Date(node.properties.inc_date).getFullYear();
            if (year < 2000) return baseSize + 4; // Older companies get larger nodes
          }
          break;
        case 'most-connected-directors':
          if (node.nodeType === 'Director') {
            return Math.max(baseSize, Math.min(20, baseSize + 6)); // Larger for connected directors
          }
          break;
      }
      
      return baseSize;
    };

    // Create simulation with query-specific forces
    const sim = d3.forceSimulation(nodesCopy)
      .force('link', d3.forceLink(linksCopy).id(d => d.id).distance(150).strength(0.7))
      .force('charge', d3.forceManyBody().strength(queryType === 'most-connected-directors' ? -800 : -600))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(d => getNodeSize(d) + 5))
      .force('x', d3.forceX(width / 2).strength(0.1))
      .force('y', d3.forceY(height / 2).strength(0.1));

    setSimulation(sim);

    // Create arrow markers
    svg.append('defs').selectAll('marker')
      .data(['end'])
      .enter().append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '-0 -5 10 10')
      .attr('refX', 25)
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
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', 2)
      .attr('marker-end', 'url(#arrowhead)');

    // Create relationship labels
    const linkLabels = g.append('g')
      .attr('class', 'link-labels')
      .selectAll('text')
      .data(linksCopy)
      .enter().append('text')
      .attr('font-size', '8px')
      .attr('font-family', 'Arial, sans-serif')
      .attr('fill', '#555')
      .attr('text-anchor', 'middle')
      .attr('dy', '-2px')
      .text(d => {
        if (d.properties?.designation) return d.properties.designation;
        return d.type || 'DIRECTED';
      })
      .style('pointer-events', 'none')
      .style('opacity', 0.8);

    // Create nodes
    const node = g.append('g')
      .attr('class', 'nodes')
      .selectAll('circle')
      .data(nodesCopy)
      .enter().append('circle')
      .attr('r', getNodeSize)
      .attr('fill', d => colorScheme[d.nodeType] || '#64748b')
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .on('click', function(event, d) {
        event.stopPropagation();
        setSelectedNode(d);
        // Visual feedback
        d3.selectAll('circle').attr('stroke-width', 2).attr('stroke', '#fff');
        d3.select(this).attr('stroke-width', 4).attr('stroke', '#ff4444');
      })
      .call(d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended));

    // Add node labels
    const labels = g.append('g')
      .attr('class', 'labels')
      .selectAll('text')
      .data(nodesCopy)
      .enter().append('text')
      .text(d => {
        const text = d.label || d.properties?.name || `Node ${d.id}`;
        return text.length > 20 ? text.substring(0, 20) + '...' : text;
      })
      .attr('font-size', '9px')
      .attr('font-family', 'Arial, sans-serif')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('fill', '#333')
      .attr('font-weight', d => d.nodeType === 'Director' ? 'bold' : 'normal')
      .style('pointer-events', 'none');

    // Enhanced tooltips with query-specific information
    node.append('title')
      .text(d => {
        const lines = [
          `Name: ${d.label || d.properties?.name || d.id}`,
          `Type: ${d.nodeType || 'unknown'}`,
          `ID: ${d.id}`
        ];
        
        // Add query-specific tooltip information
        if (queryType === 'top-paid-defence' && d.properties?.paid_capital) {
          const capitalCrores = (parseFloat(d.properties.paid_capital) / 10000000).toFixed(2);
          lines.push(`Paid Capital: ₹${capitalCrores} Crores`);
        }
        
        if (queryType === 'oldest-trading' && d.properties?.inc_date) {
          lines.push(`Incorporation: ${d.properties.inc_date}`);
        }

        if (d.properties?.cin) lines.push(`CIN: ${d.properties.cin}`);
        if (d.properties?.din) lines.push(`DIN: ${d.properties.din}`);
        
        lines.push('Click for details');
        return lines.join('\n');
      });

    // Click on background to deselect
    svg.on('click', function() {
      setSelectedNode(null);
      d3.selectAll('circle').attr('stroke-width', 2).attr('stroke', '#fff');
    });

    // Update positions on tick
    sim.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);

      linkLabels
        .attr('x', d => (d.source.x + d.target.x) / 2)
        .attr('y', d => (d.source.y + d.target.y) / 2);

      node
        .attr('cx', d => d.x)
        .attr('cy', d => d.y);

      labels
        .attr('x', d => d.x)
        .attr('y', d => d.y + getNodeSize(d) + 12);
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

    return () => {
      sim.stop();
    };

  }, [nodes, links, queryType]);

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
      setTimeout(() => simulation.alphaTarget(0), 1000);
    }
  };

  const zoomIn = () => {
    if (svgRef.current) {
      const svg = d3.select(svgRef.current);
      svg.transition().duration(300).call(d3.zoom().scaleBy, 1.5);
    }
  };

  const zoomOut = () => {
    if (svgRef.current) {
      const svg = d3.select(svgRef.current);
      svg.transition().duration(300).call(d3.zoom().scaleBy, 0.67);
    }
  };

  const toggleLabels = () => {
    const svg = d3.select(svgRef.current);
    const linkLabels = svg.selectAll('.link-labels text');
    const currentOpacity = linkLabels.style('opacity');
    linkLabels.style('opacity', currentOpacity === '0' ? '0.8' : '0');
  };

  // Helper functions
  const formatValue = (key, value) => {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'string' && value.trim() === '') return 'Empty';
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    
    // Special formatting for specific fields
    if (key.toLowerCase().includes('capital') && !isNaN(value)) {
      const crores = (parseFloat(value) / 10000000).toFixed(2);
      return `₹${crores} Crores (${value})`;
    }
    
    return value.toString();
  };

  const getPropertyIcon = (key) => {
    const keyLower = key.toLowerCase();
    if (keyLower.includes('name') || keyLower.includes('director')) return User;
    if (keyLower.includes('company') || keyLower.includes('cin')) return Building;
    if (keyLower.includes('id') || keyLower.includes('din')) return Hash;
    if (keyLower.includes('date') || keyLower.includes('time')) return Calendar;
    if (keyLower.includes('address') || keyLower.includes('location')) return MapPin;
    if (keyLower.includes('phone') || keyLower.includes('mobile')) return Phone;
    if (keyLower.includes('email') || keyLower.includes('mail')) return Mail;
    if (keyLower.includes('capital') || keyLower.includes('paid')) return TrendingUp;
    if (keyLower.includes('inc_date') || keyLower.includes('incorporation')) return Clock;
    return Info;
  };

  // Get query-specific icon
  const getQueryIcon = () => {
    switch (queryType) {
      case 'top-paid-defence': return TrendingUp;
      case 'oldest-trading': return Clock;
      case 'most-connected-directors': return Network;
      default: return Info;
    }
  };

  if (!nodes || !links) {
    return (
      <div className="p-8 text-center text-gray-500">
        <div className="text-lg mb-2">No graph data available</div>
        <div className="text-sm">The query returned no results to visualize</div>
      </div>
    );
  }

  // Calculate statistics
  const stats = {
    companies: nodes.filter(n => n.nodeType === 'Company').length,
    directors: nodes.filter(n => n.nodeType === 'Director').length,
    totalNodes: nodes.length,
    totalLinks: links.length
  };

  const QueryIcon = getQueryIcon();

  return (
    <div className="border rounded-lg bg-white overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 border-b p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <QueryIcon className="w-6 h-6 text-blue-600" />
            <div>
              <h4 className="text-lg font-semibold text-gray-900">{title}</h4>
              <div className="text-sm text-gray-600">Custom Query Visualization</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowStats(!showStats)}
              className="flex items-center gap-2 px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
            >
              <BarChart3 className="w-4 h-4" />
              {showStats ? 'Hide' : 'Show'} Stats
            </button>
          </div>
        </div>

        {/* Statistics Panel */}
        {showStats && (
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="text-xl font-bold text-blue-600">{stats.totalNodes}</div>
              <div className="text-xs text-blue-800">Total Nodes</div>
            </div>
            <div className="bg-green-50 rounded-lg p-3">
              <div className="text-xl font-bold text-green-600">{stats.totalLinks}</div>
              <div className="text-xs text-green-800">Relationships</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-3">
              <div className="text-xl font-bold text-purple-600">{stats.companies}</div>
              <div className="text-xs text-purple-800">Companies</div>
            </div>
            <div className="bg-orange-50 rounded-lg p-3">
              <div className="text-xl font-bold text-orange-600">{stats.directors}</div>
              <div className="text-xs text-orange-800">Directors</div>
            </div>
          </div>
        )}
      </div>

      {/* Graph Container */}
      <div className="relative">
        {/* Graph Controls */}
        <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
          <button
            onClick={zoomIn}
            className="p-2 bg-white border rounded-lg shadow-md hover:bg-gray-50 transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={zoomOut}
            className="p-2 bg-white border rounded-lg shadow-md hover:bg-gray-50 transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={resetView}
            className="p-2 bg-white border rounded-lg shadow-md hover:bg-gray-50 transition-colors"
            title="Reset View"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={centerGraph}
            className="p-2 bg-white border rounded-lg shadow-md hover:bg-gray-50 transition-colors"
            title="Re-center Graph"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          <button
            onClick={toggleLabels}
            className="p-2 bg-white border rounded-lg shadow-md hover:bg-gray-50 transition-colors"
            title="Toggle Edge Labels"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>

        {/* SVG Graph */}
        <svg
          ref={svgRef}
          className="w-full border-b bg-gray-50"
          style={{ minHeight: '600px' }}
        ></svg>

        {/* Transform Info */}
        <div className="absolute bottom-4 left-4 bg-white bg-opacity-90 rounded px-2 py-1 text-xs text-gray-600">
          Zoom: {transform.k.toFixed(2)}x | Pan: ({Math.round(transform.x)}, {Math.round(transform.y)})
        </div>
      </div>

      {/* Node Details Panel */}
      {selectedNode && (
        <div className="border-t bg-gray-50 p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div 
                className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                style={{ 
                  backgroundColor: selectedNode.nodeType === 'Company' ? '#4f46e5' : '#dc2626'
                }}
              />
              <div>
                <h5 className="font-semibold text-gray-900">
                  {selectedNode.label || selectedNode.properties?.name || `Node ${selectedNode.id}`}
                </h5>
                <p className="text-sm text-gray-600">{selectedNode.nodeType || 'Unknown Type'}</p>
              </div>
            </div>
            <button
              onClick={() => setSelectedNode(null)}
              className="p-1 hover:bg-gray-200 rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {selectedNode.properties && Object.keys(selectedNode.properties).length > 0 && (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              <h6 className="font-medium text-gray-800 text-sm">Properties:</h6>
              <div className="grid gap-2">
                {Object.entries(selectedNode.properties).map(([key, value]) => {
                  const IconComponent = getPropertyIcon(key);
                  return (
                    <div key={key} className="flex items-start gap-2 bg-white rounded p-2 border">
                      <IconComponent className="w-4 h-4 mt-0.5 text-gray-500 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-medium text-gray-700 capitalize">
                          {key.replace(/_/g, ' ')}
                        </div>
                        <div className="text-sm text-gray-900 break-words">
                          {formatValue(key, value)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {(!selectedNode.properties || Object.keys(selectedNode.properties).length === 0) && (
            <div className="text-sm text-gray-500 italic">
              No additional properties available for this node.
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="border-t bg-white p-4">
        <h6 className="font-medium text-gray-800 text-sm mb-2">Legend:</h6>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-blue-600 border-2 border-white"></div>
            <span className="text-sm text-gray-600">Companies</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-red-600 border-2 border-white"></div>
            <span className="text-sm text-gray-600">Directors</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-0.5 bg-gray-400"></div>
            <span className="text-sm text-gray-600">Relationships</span>
          </div>
        </div>
        <div className="mt-2 text-xs text-gray-500">
          • Click and drag nodes to reposition • Use mouse wheel to zoom • Click on nodes for details
        </div>
      </div>
    </div>
  );
};

export default CustomGraphView;