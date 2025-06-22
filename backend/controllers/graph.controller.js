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
        available_types: [
          'top-paid-defence', 
          'oldest-trading', 
          'most-connected-directors',
          'business-companies',
          'non-gov-defence',
          'defence-by-directors',
          'union-gov-defence',
          'electronics-companies',
          'recent-defence',
          'directors-by-capital'
        ]
      });
    }

    let result;
    let queryDescription = '';

    switch (type) {
      case 'top-paid-defence':
        queryDescription = 'Top 10 defence companies by paid capital';
        result = await session.run(`
          MATCH (c:Company)
          WHERE toLower(c.activity) CONTAINS 'defence'
            AND c.paid_capital IS NOT NULL
            AND toFloat(c.paid_capital) > 0
          WITH c.name as company_name, 
               max(toFloat(c.paid_capital)) as max_paid_capital,
               collect(c) as company_nodes
          ORDER BY max_paid_capital DESC
          LIMIT 10
          
          WITH company_name, max_paid_capital, company_nodes[0] as representative_company
          OPTIONAL MATCH (representative_company)<-[r:DIRECTED]-(d:Director)
          
          RETURN representative_company as c, d, r, max_paid_capital
          ORDER BY max_paid_capital DESC
        `);
        break;

      case 'oldest-trading':
        queryDescription = 'Top 10 oldest trading companies';
        result = await session.run(`
          MATCH (c:Company)
          WHERE toLower(c.activity) CONTAINS 'trading'
            AND c.inc_date IS NOT NULL
          WITH c.name as company_name, 
               min(c.inc_date) as earliest_date,
               collect(c) as company_nodes
          ORDER BY earliest_date ASC
          LIMIT 10
          
          WITH company_name, earliest_date, company_nodes[0] as representative_company
          OPTIONAL MATCH (representative_company)<-[r:DIRECTED]-(d:Director)
          
          RETURN representative_company as c, d, r, earliest_date
          ORDER BY earliest_date ASC
        `);
        break;

      case 'most-connected-directors':
  queryDescription = 'Top 5 most connected directors';
  result = await session.run(`
    MATCH (d:Director)-[:DIRECTED]->(c:Company)
    WITH d, count(DISTINCT c.name) AS unique_company_count, collect(DISTINCT c)[0..10] as connected_companies
    ORDER BY unique_company_count DESC
    LIMIT 5

    UNWIND connected_companies as company
    OPTIONAL MATCH (d)-[rel:DIRECTED]->(company)

    RETURN d, company as c, rel as r, toString(unique_company_count) as unique_company_count_str
    ORDER BY unique_company_count DESC, d.name
  `);
  break;


      case 'business-companies':
        queryDescription = 'Top 10 business companies by paid capital';
        result = await session.run(`
          MATCH (c:Company)
          WHERE toLower(c.activity) CONTAINS 'business'
            AND c.paid_capital IS NOT NULL
          WITH c.name as company_name, 
               max(toFloat(c.paid_capital)) as max_paid_capital,
               collect(c) as company_nodes
          ORDER BY max_paid_capital DESC
          LIMIT 10
          
          WITH company_name, max_paid_capital, company_nodes[0] as representative_company
          OPTIONAL MATCH (representative_company)<-[r:DIRECTED]-(d:Director)
          
          RETURN representative_company as c, d, r, max_paid_capital
          ORDER BY max_paid_capital DESC
        `);
        break;

      case 'non-gov-defence':
        queryDescription = 'Non-government defence companies';
        result = await session.run(`
          MATCH (c:Company)
          WHERE toLower(c.sub_category) CONTAINS 'non' 
            AND (
              toLower(c.activity) CONTAINS 'defence' OR
              ANY(info IN c.primary_info WHERE toLower(info) CONTAINS 'defence')
            )
          WITH c.name as company_name, 
               collect(c) as company_nodes
          LIMIT 10
          
          WITH company_name, company_nodes[0] as representative_company
          OPTIONAL MATCH (representative_company)<-[r:DIRECTED]-(d:Director)
          
          RETURN representative_company as c, d, r
        `);
        break;

      case 'defence-by-directors':
        queryDescription = 'Defence companies by director count';
        result = await session.run(`
          MATCH (c:Company)<-[r:DIRECTED]-(d:Director)
          WHERE (
            toLower(c.activity) CONTAINS 'defence' OR
            ANY(info IN c.primary_info WHERE toLower(info) CONTAINS 'defence')
          )
          WITH c, count(DISTINCT d) AS director_count
          ORDER BY director_count DESC
          LIMIT 10
          
          MATCH (c)<-[r:DIRECTED]-(d:Director)
          RETURN c, d, r, director_count
          ORDER BY director_count DESC
        `);
        break;

      case 'union-gov-defence':
        queryDescription = 'Union government defence companies by capital';
        result = await session.run(`
          MATCH (c:Company)
          WHERE toLower(c.sub_category) CONTAINS 'union government company'
            AND (
              toLower(c.activity) CONTAINS 'defence' OR
              ANY(info IN c.primary_info WHERE toLower(info) CONTAINS 'defence')
            )
            AND c.auth_capital IS NOT NULL
          WITH c.name as company_name, 
               max(toFloat(c.auth_capital)) as max_auth_capital,
               collect(c) as company_nodes
          ORDER BY max_auth_capital DESC
          LIMIT 10
          
          WITH company_name, max_auth_capital, company_nodes[0] as representative_company
          OPTIONAL MATCH (representative_company)<-[r:DIRECTED]-(d:Director)
          
          RETURN representative_company as c, d, r, max_auth_capital
          ORDER BY max_auth_capital DESC
        `);
        break;

      case 'electronics-companies':
        queryDescription = 'Electronics companies';
        result = await session.run(`
          MATCH (c:Company)
          WHERE toLower(c.activity) CONTAINS 'electronics'
             OR ANY(info IN c.primary_info WHERE toLower(info) CONTAINS 'electronics')
          WITH c.name as company_name, 
               collect(c) as company_nodes
          LIMIT 100
          
          WITH company_name, company_nodes[0] as representative_company
          OPTIONAL MATCH (representative_company)<-[r:DIRECTED]-(d:Director)
          
          RETURN representative_company as c, d, r
          ORDER BY company_name
        `);
        break;

      case 'recent-defence':
        queryDescription = 'Most recently incorporated defence companies';
        result = await session.run(`
          MATCH (c:Company)
          WHERE (
            toLower(c.activity) CONTAINS 'defence' OR
            ANY(info IN c.primary_info WHERE toLower(info) CONTAINS 'defence')
          )
          AND c.inc_date IS NOT NULL
          WITH c.name as company_name, 
               max(c.inc_date) as latest_inc_date,
               collect(c) as company_nodes
          ORDER BY latest_inc_date DESC
          LIMIT 10
          
          WITH company_name, latest_inc_date, company_nodes[0] as representative_company
          OPTIONAL MATCH (representative_company)<-[r:DIRECTED]-(d:Director)
          
          RETURN representative_company as c, d, r, latest_inc_date
          ORDER BY latest_inc_date DESC
        `);
        break;

      case 'directors-by-capital':
        queryDescription = 'Directors by total authorized capital';
        result = await session.run(`
          MATCH (d:Director)-[r:DIRECTED]->(c:Company)
          WHERE c.auth_capital IS NOT NULL
          WITH d, SUM(toFloat(c.auth_capital)) AS total_authorized_capital
          ORDER BY total_authorized_capital DESC
          LIMIT 10
          
          MATCH (d)-[r:DIRECTED]->(c:Company)
          RETURN d, c, r, total_authorized_capital
          ORDER BY total_authorized_capital DESC
        `);
        break;

      default:
        return res.status(400).json({
          error: 'Invalid query type',
          provided: type,
          available_types: [
            'top-paid-defence', 
            'oldest-trading', 
            'most-connected-directors',
            'business-companies',
            'non-gov-defence',
            'defence-by-directors',
            'union-gov-defence',
            'electronics-companies',
            'recent-defence',
            'directors-by-capital'
          ]
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

    // Process the results to include ALL relationships
    const nodes = new Map();
    const links = [];
    const companyDirectors = new Map();
    const directorCompanies = new Map();

    result.records.forEach(record => {
      const company = record.get('c');
      const director = record.get('d');
      const relationship = record.get('r');

      // Add company node if exists
      if (company && !nodes.has(company.identity.toString())) {
        nodes.set(company.identity.toString(), {
          id: company.identity.toString(),
          label: company.properties.name || 'Unknown Company',
          nodeType: 'Company',
          properties: {
            ...company.properties,
            ...(type === 'top-paid-defence' && { paid_capital: record.get('max_paid_capital') }),
            ...(type === 'oldest-trading' && { inc_date: record.get('earliest_date') }),
            ...(type === 'business-companies' && { paid_capital: record.get('max_paid_capital') }),
            ...(type === 'union-gov-defence' && { auth_capital: record.get('max_auth_capital') }),
            ...(type === 'recent-defence' && { inc_date: record.get('latest_inc_date') })
          }
        });
        companyDirectors.set(company.identity.toString(), new Set());
      }

      // Add director node if exists
      if (director && !nodes.has(director.identity.toString())) {
        nodes.set(director.identity.toString(), {
          id: director.identity.toString(),
          label: director.properties.name || 'Unknown Director',
          nodeType: 'Director',
          properties: {
            ...director.properties,
            ...(type === 'most-connected-directors' && { connection_count: record.get('unique_company_count') }),
            ...(type === 'directors-by-capital' && { total_authorized_capital: record.get('total_authorized_capital') }),
            ...(type === 'defence-by-directors' && { director_count: record.get('director_count') })
          }
        });
        directorCompanies.set(director.identity.toString(), new Set());
      }

      // Add relationship if exists
      if (relationship) {
        if (company && director) {
          const companyId = company.identity.toString();
          const directorId = director.identity.toString();

          // Add company->director relationship
          const directorsForCompany = companyDirectors.get(companyId) || new Set();
          if (!directorsForCompany.has(directorId)) {
            directorsForCompany.add(directorId);
            links.push({
              source: directorId,
              target: companyId,
              type: relationship.type,
              properties: relationship.properties
            });
          }

          // Add director->company relationship
          const companiesForDirector = directorCompanies.get(directorId) || new Set();
          if (!companiesForDirector.has(companyId)) {
            companiesForDirector.add(companyId);
          }
        }
      }
    });

    // Calculate statistics
    const companyNodes = Array.from(nodes.values()).filter(n => n.nodeType === 'Company');
    const directorNodes = Array.from(nodes.values()).filter(n => n.nodeType === 'Director');

    // Prepare response
    const response = {
      query_type: type,
      description: queryDescription,
      nodes: Array.from(nodes.values()),
      links: links,
      statistics: {
        total_nodes: nodes.size,
        total_links: links.length,
        companies: companyNodes.length,
        directors: directorNodes.length,
        ...(type === 'most-connected-directors' && {
          top_directors: directorNodes
            .sort((a, b) => (b.properties.connection_count || 0) - (a.properties.connection_count || 0))
            .slice(0, 5)
            .map(d => ({
              name: d.label,
              connection_count: d.properties.connection_count
            }))
        }),
        ...(type === 'directors-by-capital' && {
          top_directors: directorNodes
            .sort((a, b) => (b.properties.total_authorized_capital || 0) - (a.properties.total_authorized_capital || 0))
            .slice(0, 5)
            .map(d => ({
              name: d.label,
              total_authorized_capital: d.properties.total_authorized_capital
            }))
        })
      }
    };

    // Add query-specific debug info
    if (['top-paid-defence', 'business-companies'].includes(type)) {
      response.debug_info = {
        companies: companyNodes
          .sort((a, b) => parseFloat(b.properties.paid_capital || 0) - parseFloat(a.properties.paid_capital || 0))
          .map(c => ({
            name: c.label,
            paid_capital: c.properties.paid_capital,
            formatted_capital: (parseFloat(c.properties.paid_capital || 0) / 10000000).toFixed(2) + ' Crores',
            directors_count: links.filter(l => l.target === c.id).length
          }))
      };
    }

    if (type === 'union-gov-defence') {
      response.debug_info = {
        companies: companyNodes
          .sort((a, b) => parseFloat(b.properties.auth_capital || 0) - parseFloat(a.properties.auth_capital || 0))
          .map(c => ({
            name: c.label,
            authorized_capital: c.properties.auth_capital,
            formatted_capital: (parseFloat(c.properties.auth_capital || 0) / 10000000).toFixed(2) + ' Crores',
            directors_count: links.filter(l => l.target === c.id).length
          }))
      };
    }

    if (type === 'oldest-trading' || type === 'recent-defence') {
      response.debug_info = {
        companies: companyNodes
          .sort((a, b) => new Date(a.properties.inc_date) - new Date(b.properties.inc_date))
          .map(c => ({
            name: c.label,
            incorporation_date: c.properties.inc_date,
            directors_count: links.filter(l => l.target === c.id).length
          }))
      };
    }

    if (type === 'defence-by-directors') {
      response.debug_info = {
        companies: companyNodes
          .sort((a, b) => (b.properties.director_count || 0) - (a.properties.director_count || 0))
          .map(c => ({
            name: c.label,
            director_count: c.properties.director_count,
            directors: links
              .filter(l => l.target === c.id)
              .map(l => nodes.get(l.source).label)
          }))
      };
    }

    return res.json(response);

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