// controllers/graph.controller.js
const fs = require('fs');
const path = require('path');
const neo4j = require('neo4j-driver');

const driver = neo4j.driver(
  process.env.NEO4J_URI,
  neo4j.auth.basic(process.env.NEO4J_USERNAME, process.env.NEO4J_PASSWORD)
);

// Get entire graph - FIXED: Removed duplicate function
exports.getFullGraph = async (req, res) => {
  const session = driver.session();

  try {
    // Load original company CINs to detect primary vs secondary
    let originalCINs = new Set();
    
    try {
      const raw = JSON.parse(
        fs.readFileSync(path.join(__dirname, "../data/all_companies_data.json"))
      );
      
      for (const companies of Object.values(raw)) {
        for (const c of companies) {
          if (c.cin) originalCINs.add(c.cin);
        }
      }
    } catch (fileError) {
      console.warn("Could not load original companies file:", fileError.message);
      // Continue without original CINs classification
    }

    const result = await session.run(`
      MATCH (n)-[r]->(m)
      RETURN n, r, m
      LIMIT 1000
    `);

    const nodes = new Map();
    const links = [];

    result.records.forEach((record) => {
      const n = record.get("n");
      const m = record.get("m");
      const r = record.get("r");

      // node n
      const nId = n.identity.toInt();
      if (!nodes.has(nId)) {
        nodes.set(nId, {
          id: nId,
          label: n.properties.name || n.labels[0] || "Unknown",
          properties: n.properties,
          nodeType: n.labels[0] || "Unknown",
          type: n.labels.includes("Director")
            ? "director"
            : originalCINs.has(n.properties.cin)
            ? "primary"
            : "secondary",
        });
      }

      // node m
      const mId = m.identity.toInt();
      if (!nodes.has(mId)) {
        nodes.set(mId, {
          id: mId,
          label: m.properties.name || m.labels[0] || "Unknown",
          properties: m.properties,
          nodeType: m.labels[0] || "Unknown",
          type: m.labels.includes("Director")
            ? "director"
            : originalCINs.has(m.properties.cin)
            ? "primary"
            : "secondary",
        });
      }

      // edge
      links.push({
        source: nId,
        target: mId,
        type: r.type,
        properties: r.properties,
      });
    });

    res.json({
      nodes: Array.from(nodes.values()),
      links,
      totalNodes: nodes.size,
      totalLinks: links.length
    });
  } catch (err) {
    console.error("❌ Error in getFullGraph:", err);
    res.status(500).json({ error: "Failed to fetch graph data.", details: err.message });
  } finally {
    await session.close();
  }
};

// Get company by CIN
exports.getCompanyByCIN = async (req, res) => {
  const { cin } = req.params;
  const session = driver.session();

  try {
    if (!cin) {
      return res.status(400).json({ error: 'CIN parameter is required' });
    }

    const result = await session.run(
      `
      MATCH (c:Company {cin: $cin})
      OPTIONAL MATCH (d:Director)-[r:DIRECTED]->(c)
      RETURN c, collect({ 
        name: d.name, 
        din: d.din, 
        designation: r.designation,
        director_id: id(d)
      }) AS directors
      `,
      { cin: cin.toString() }
    );

    if (result.records.length === 0) {
      return res.status(404).json({ error: 'Company not found' });
    }

    const company = result.records[0].get('c').properties;
    const directors = result.records[0].get('directors').filter(d => d.name); // avoid null

    res.json({ 
      ...company, 
      directors,
      found: true
    });

  } catch (err) {
    console.error("❌ Error in getCompanyByCIN:", err);
    res.status(500).json({ error: 'Failed to fetch company', details: err.message });
  } finally {
    await session.close();
  }
};

// Get director by DIN
exports.getDirectorByDIN = async (req, res) => {
  const { din } = req.params;
  const session = driver.session();

  try {
    if (!din) {
      return res.status(400).json({ error: 'DIN parameter is required' });
    }

    const result = await session.run(
      `
      MATCH (d:Director {din: $din})
      OPTIONAL MATCH (d)-[r:DIRECTED]->(c:Company)
      RETURN d, collect({ 
        name: c.name, 
        cin: c.cin, 
        designation: r.designation,
        company_id: id(c)
      }) AS companies
      `,
      { din: din.toString() }
    );

    if (result.records.length === 0) {
      return res.status(404).json({ error: 'Director not found' });
    }

    const director = result.records[0].get('d').properties;
    const companies = result.records[0].get('companies').filter(c => c.name); // avoid null

    res.json({ 
      ...director, 
      companies,
      found: true
    });

  } catch (err) {
    console.error("❌ Error in getDirectorByDIN:", err);
    res.status(500).json({ error: 'Failed to fetch director', details: err.message });
  } finally {
    await session.close();
  }
};

// Get secondary companies
exports.getSecondaryCompanies = async (req, res) => {
  const session = driver.session();

  try {
    let originalCINs = new Set();
    
    // Try to read original CINs from file
    try {
      const raw = JSON.parse(
        fs.readFileSync(path.join(__dirname, "../data/all_companies_data.json"))
      );

      for (const companies of Object.values(raw)) {
        for (const c of companies) {
          if (c.cin) originalCINs.add(c.cin);
        }
      }
    } catch (fileError) {
      console.warn("Could not load original companies file:", fileError.message);
      // If file doesn't exist, return all companies
      const result = await session.run(`MATCH (c:Company) RETURN c LIMIT 100`);
      const allCompanies = result.records.map((r) => r.get("c").properties);
      return res.status(200).json(allCompanies);
    }

    // Get all companies from DB
    const result = await session.run(`MATCH (c:Company) RETURN c`);

    const secondary = result.records
      .map((r) => r.get("c").properties)
      .filter((c) => c.cin && !originalCINs.has(c.cin));

    res.status(200).json({
      secondary_companies: secondary,
      count: secondary.length,
      original_count: originalCINs.size
    });
  } catch (error) {
    console.error("❌ Error in getSecondaryCompanies:", error);
    res.status(500).json({ 
      error: "Internal Server Error", 
      details: error.message 
    });
  } finally {
    await session.close();
  }
};

// Run custom queries - FIXED: Better error handling and query validation
// Run custom queries - FIXED: Proper filtering for top 10 unique companies
// Run custom queries - FIXED: Proper filtering for top 10 unique companies
// Run custom queries - FIXED: Proper deduplication and filtering for unique companies
exports.runCustomQuery = async (req, res) => {
  const session = driver.session();
  const { type } = req.query;

  try {
    if (!type) {
      return res.status(400).json({
        error: 'Query type is required',
        available_types: ['top-paid-defence', 'oldest-trading', 'most-connected-directors']
      });
    }

    let result;
    let queryDescription = '';

    switch (type) {
      case 'top-paid-defence':
        queryDescription = 'Top 10 defence companies by paid capital';
        result = await session.run(`
          // First, find the top 10 unique defence companies by name and paid capital
          MATCH (c:Company)
          WHERE toLower(c.activity) CONTAINS 'defence'
            AND c.paid_capital IS NOT NULL
            AND toFloat(c.paid_capital) > 0
          WITH c.name as company_name, 
               max(toFloat(c.paid_capital)) as max_paid_capital,
               collect(c) as company_nodes
          ORDER BY max_paid_capital DESC
          LIMIT 10
          
          // For each unique company, pick one representative node and get all its relationships
          WITH company_name, max_paid_capital, company_nodes[0] as representative_company
          OPTIONAL MATCH (representative_company)<-[r:DIRECTED]-(d:Director)
          
          RETURN representative_company as c, d, r, max_paid_capital
          ORDER BY max_paid_capital DESC
        `);
        break;

      case 'oldest-trading':
        queryDescription = 'Top 10 oldest trading companies';
        result = await session.run(`
          // First, find the top 10 unique oldest trading companies by name
          MATCH (c:Company)
          WHERE toLower(c.activity) CONTAINS 'trading'
            AND c.inc_date IS NOT NULL
          WITH c.name as company_name, 
               min(c.inc_date) as earliest_date,
               collect(c) as company_nodes
          ORDER BY earliest_date ASC
          LIMIT 10
          
          // For each unique company, pick one representative node and get all its relationships
          WITH company_name, earliest_date, company_nodes[0] as representative_company
          OPTIONAL MATCH (representative_company)<-[r:DIRECTED]-(d:Director)
          
          RETURN representative_company as c, d, r, earliest_date
          ORDER BY earliest_date ASC
        `);
        break;

      case 'most-connected-directors':
        queryDescription = 'Top 5 most connected directors';
        result = await session.run(`
          // Find directors with most unique company connections
          MATCH (d:Director)-[r:DIRECTED]->(c:Company)
          WITH d, count(DISTINCT c.name) AS unique_company_count, collect(DISTINCT c)[0..10] as connected_companies
          ORDER BY unique_company_count DESC
          LIMIT 5
          
          // Get all relationships for these top directors
          WITH d, unique_company_count, connected_companies
          UNWIND connected_companies as company
          MATCH (d)-[r:DIRECTED]->(company)
          
          RETURN d, company as c, r, unique_company_count
          ORDER BY unique_company_count DESC, d.name
        `);
        break;

      default:
        return res.status(400).json({
          error: 'Invalid query type',
          provided: type,
          available_types: ['top-paid-defence', 'oldest-trading', 'most-connected-directors']
        });
    }

    if (!result || result.records.length === 0) {
      return res.json({
        query_type: type,
        description: queryDescription,
        nodes: [],
        links: [],
        message: 'No data found for this query'
      });
    }

    const nodes = new Map();
    const links = [];
    const processedLinks = new Set();
    const uniqueCompanies = new Set(); // Track unique company names

    result.records.forEach(record => {
      const c = record.get('c');
      const d = record.get('d');
      const r = record.get('r');

      // Only add company if we haven't seen this company name before
      const companyName = c.properties.name;
      if (!uniqueCompanies.has(companyName)) {
        uniqueCompanies.add(companyName);
        
        const companyId = c.identity.toInt();
        if (!nodes.has(companyId)) {
          nodes.set(companyId, {
            id: companyId,
            label: companyName || 'Unknown Company',
            nodeType: 'Company',
            properties: c.properties
          });
        }

        // Add director node and relationship (if exists)
        if (d && r) {
          const directorId = d.identity.toInt();
          if (!nodes.has(directorId)) {
            nodes.set(directorId, {
              id: directorId,
              label: d.properties.name || 'Unknown Director',
              nodeType: 'Director',
              properties: d.properties
            });
          }

          // Create unique link identifier
          const linkKey = `${directorId}-${companyId}-${r.type}-${r.properties.designation || 'default'}`;
          if (!processedLinks.has(linkKey)) {
            processedLinks.add(linkKey);
            links.push({
              source: directorId,
              target: companyId,
              type: r.type,
              properties: r.properties
            });
          }
        }
      }
    });

    // Build response with proper statistics
    const companyNodes = Array.from(nodes.values()).filter(node => node.nodeType === 'Company');
    const directorNodes = Array.from(nodes.values()).filter(node => node.nodeType === 'Director');

    let responseData = {
      query_type: type,
      description: queryDescription,
      nodes: Array.from(nodes.values()),
      links,
      total_records: result.records.length,
      unique_nodes: nodes.size,
      total_links: links.length,
      summary: {
        unique_companies: companyNodes.length,
        total_directors: directorNodes.length,
        total_relationships: links.length
      }
    };

    // Add specific debug info for defence companies
    if (type === 'top-paid-defence') {
      responseData.debug_info = {
        companies_found: companyNodes.map(c => ({
          name: c.properties.name,
          paid_capital: c.properties.paid_capital,
          formatted_capital: (parseFloat(c.properties.paid_capital || 0) / 10000000).toFixed(2) + ' Crores',
          directors_count: links.filter(link => link.target === c.id).length
        })).sort((a, b) => parseFloat(b.paid_capital) - parseFloat(a.paid_capital))
      };
    }

    res.json(responseData);

  } catch (err) {
    console.error("❌ Error in runCustomQuery:", err);
    res.status(500).json({
      error: 'Failed to run query',
      query_type: type,
      details: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  } finally {
    await session.close();
  }
};

// Alternative approach using a cleaner two-step process



// Health check endpoint
exports.healthCheck = async (req, res) => {
  const session = driver.session();
  try {
    await session.run('RETURN 1');
    res.json({ status: 'healthy', database: 'connected' });
  } catch (err) {
    console.error("Database health check failed:", err);
    res.status(500).json({ 
      status: 'unhealthy', 
      database: 'disconnected',
      error: err.message 
    });
  } finally {
    await session.close();
  }
};