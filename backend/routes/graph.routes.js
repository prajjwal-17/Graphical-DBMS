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

// Health check endpoint
router.get('/health', healthCheck);

// Get full graph data
router.get('/graph', getFullGraph);

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
        description: 'Top 10 defence companies by paid capital',
        usage: '/api/query?type=top-paid-defence'
      },
      {
        type: 'oldest-trading', 
        description: 'Top 10 oldest trading companies',
        usage: '/api/query?type=oldest-trading'
      },
      {
        type: 'most-connected-directors',
        description: 'Top 5 most connected directors',
        usage: '/api/query?type=most-connected-directors'
      }
    ]
  });
});

module.exports = router;