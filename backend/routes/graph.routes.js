const express = require('express');
const router = express.Router();

const {
  getFullGraph,
  getCompanyByCIN,
  getDirectorByDIN,
  getSecondaryCompanies,
  runCustomQuery,
  healthCheck
} = require('../controllers/graph.controller');


// Get full graph data
router.get('/', getFullGraph);

// Get company by CIN
router.get('/company/:cin', getCompanyByCIN);

// Get director by DIN  
router.get('/director/:din', getDirectorByDIN);

// Get secondary companies
router.get('/secondary-companies', getSecondaryCompanies);

// Run custom queries
router.get('/query', runCustomQuery);

// Add a route to list available query types
router.get('/query-types', (req, res) => {
  res.json({
    available_queries: [
      {
        type: 'top-paid-defence',
        description: 'Top 10 defence companies by paid capital with all their directors',
        usage: '/api/query?type=top-paid-defence'
      },
      {
        type: 'oldest-trading',
        description: 'Top 10 oldest trading companies with all their directors',
        usage: '/api/query?type=oldest-trading'
      },
      {
        type: 'most-connected-directors',
        description: 'Top 5 directors with most company connections and their connected companies',
        usage: '/api/query?type=most-connected-directors'
      },
      {
        type: 'business-companies',
        description: 'Top 10 business companies by paid capital with all their directors',
        usage: '/api/query?type=business-companies'
      },
      {
        type: 'non-gov-defence',
        description: '10 non-government defence companies with all their directors',
        usage: '/api/query?type=non-gov-defence'
      },
      {
        type: 'defence-by-directors',
        description: 'Top 10 defence companies by number of directors',
        usage: '/api/query?type=defence-by-directors'
      },
      {
        type: 'union-gov-defence',
        description: 'Top 10 union government defence companies by authorized capital',
        usage: '/api/query?type=union-gov-defence'
      },
      {
        type: 'electronics-companies',
        description: '100 electronics companies with all their directors',
        usage: '/api/query?type=electronics-companies'
      },
      {
        type: 'recent-defence',
        description: '10 most recently incorporated defence companies with all their directors',
        usage: '/api/query?type=recent-defence'
      },
      {
        type: 'directors-by-capital',
        description: 'Top 10 directors by total authorized capital of their companies',
        usage: '/api/query?type=directors-by-capital'
      }
    ],
    notes: [
      'All queries return complete relationship data for visualization',
      'Company queries include all connected directors',
      'Director queries include all connected companies',
      'Results are formatted for network graph visualization'
    ]
  });
});

module.exports = router;