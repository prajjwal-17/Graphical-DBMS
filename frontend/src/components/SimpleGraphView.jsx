import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { X, User, Building, Info, Hash, Calendar, MapPin, Phone, Mail } from 'lucide-react';

const SimpleGraphView = ({ nodes, links, title = "Graph Visualization" }) => {
  const svgRef = useRef();
  const [selectedNode, setSelectedNode] = useState(null);

  useEffect(() => {
    if (!nodes || !links || nodes.length === 0) {
      return;
    }

    console.log('SimpleGraphView: Rendering graph with', nodes.length, 'nodes and', links.length, 'links');

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = 800;
    const height = 600;

    svg.attr('width', width).attr('height', height);

    // Add zoom and pan
    const zoom = d3.zoom()
      .scaleExtent([0.5, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    // Create main group for zooming/panning
    const g = svg.append('g');

    // Create copies for D3 to modify
    const nodesCopy = nodes.map(d => ({ ...d }));
    const linksCopy = links.map(d => ({ ...d }));

    // Color scale for different node types
    const colorScale = d3.scaleOrdinal()
      .domain(['director', 'primary', 'secondary', 'company'])
      .range(['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4']);

    // Create simulation
    const simulation = d3.forceSimulation(nodesCopy)
      .force('link', d3.forceLink(linksCopy).id(d => d.id).distance(150).strength(0.8))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(30));

    // Create arrow markers
    svg.append('defs').selectAll('marker')
      .data(['end'])
      .enter().append('marker')
      .attr('id', 'arrowhead-simple')
      .attr('viewBox', '-0 -5 10 10')
      .attr('refX', 25)
      .attr('refY', 0)
      .attr('orient', 'auto')
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
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
      .attr('marker-end', 'url(#arrowhead-simple)');

    // Create relationship labels
    const linkLabels = g.append('g')
      .attr('class', 'link-labels')
      .selectAll('text')
      .data(linksCopy)
      .enter().append('text')
      .attr('font-size', '10px')
      .attr('font-family', 'Arial, sans-serif')
      .attr('fill', '#666')
      .attr('text-anchor', 'middle')
      .attr('dy', '-5px')
      .text(d => d.relationship || d.type || 'connected')
      .style('pointer-events', 'none');

    // Create nodes
    const node = g.append('g')
      .attr('class', 'nodes')
      .selectAll('circle')
      .data(nodesCopy)
      .enter().append('circle')
      .attr('r', d => d.type === 'director' ? 15 : 12)
      .attr('fill', d => colorScale(d.type || 'secondary'))
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .on('click', function(event, d) {
        event.stopPropagation();
        setSelectedNode(d);
        d3.selectAll('circle').attr('stroke-width', 2);
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
        const text = d.label || d.name || `Node ${d.id}`;
        return text.length > 20 ? text.substring(0, 20) + '...' : text;
      })
      .attr('font-size', '11px')
      .attr('font-family', 'Arial, sans-serif')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('fill', '#333')
      .attr('font-weight', d => d.type === 'director' ? 'bold' : 'normal')
      .style('pointer-events', 'none');

    // Add tooltips
    node.append('title')
      .text(d => {
        const lines = [
          `Name: ${d.label || d.name || d.id}`,
          `Type: ${d.type || d.nodeType || 'unknown'}`,
          `Click to view details`
        ];
        return lines.join('\n');
      });

    // Click on background to deselect
    svg.on('click', function() {
      setSelectedNode(null);
      d3.selectAll('circle').attr('stroke-width', 2).attr('stroke', '#fff');
    });

    // Update positions on tick
    simulation.on('tick', () => {
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
        .attr('y', d => d.y + (d.type === 'director' ? 25 : 22));
    });

    // Drag functions
    function dragstarted(event, d) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event, d) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event, d) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    return () => {
      simulation.stop();
    };

  }, [nodes, links]);

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

  const formatValue = (key, value) => {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'string' && value.trim() === '') return 'Empty';
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return value.toString();
  };

  if (!nodes || !links) {
    return (
      <div className="p-4 text-center text-gray-500">
        No graph data available
      </div>
    );
  }

  const nodeStats = {
    directors: nodes.filter(n => n.type === 'director').length,
    companies: nodes.filter(n => n.type === 'primary' || n.type === 'secondary' || n.type === 'company').length,
    total: nodes.length
  };

  return (
    <div className="border rounded-lg p-4 bg-white">
      <div className="mb-4">
        <h4 className="text-lg font-medium mb-2">{title}</h4>
        <div className="flex gap-4 text-sm mb-2">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-red-400"></div>
            <span>Directors ({nodeStats.directors})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-teal-400"></div>
            <span>Companies ({nodeStats.companies})</span>
          </div>
        </div>
        <div className="text-xs text-gray-600">
          Total: {nodeStats.total} nodes, {links.length} relationships
        </div>
      </div>
      
      <div className="flex gap-4">
        {/* Graph Container */}
        <div className={`overflow-hidden border rounded relative transition-all duration-300 ${selectedNode ? 'w-2/3' : 'w-full'}`}>
          <svg ref={svgRef} className="w-full"></svg>
        </div>

        {/* Node Details Panel */}
        {selectedNode && (
          <div className="w-1/3 border rounded bg-gray-50 p-4 max-h-[600px] overflow-y-auto">
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

            {/* Properties */}
            {selectedNode.properties && Object.keys(selectedNode.properties).length > 0 && (
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <h5 className="font-medium text-gray-800 mb-3">Properties</h5>
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
                              <span className="text-sm text-gray-900 break-words">
                                {formatValue(key, value)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      <div className="mt-2 text-sm text-gray-600">
        <strong>Instructions:</strong> Click nodes to view details • Drag nodes to move • Mouse wheel to zoom • Drag background to pan
      </div>
    </div>
  );
};

export default SimpleGraphView;