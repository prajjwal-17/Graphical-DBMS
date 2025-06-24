const express = require("express");
const router = express.Router();
const neo4j = require("neo4j-driver");
const { body, validationResult } = require("express-validator");

// Initialize driver
const driver = neo4j.driver(
  process.env.NEO4J_URI,
  neo4j.auth.basic(process.env.NEO4J_USERNAME, process.env.NEO4J_PASSWORD)
);

// Validation rules
const companyDirectorValidation = [
  body('company.cin').notEmpty().withMessage('CIN is required'),
  body('company.name').notEmpty().withMessage('Company name is required'),
  body('director.din').notEmpty().withMessage('DIN is required'),
  body('director.name').notEmpty().withMessage('Director name is required'),
  body('director.designation').notEmpty().withMessage('Designation is required')
];

// Main form submission endpoint
router.post("/company-director", companyDirectorValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const session = driver.session();
  const { company, director, otherCompanies = [] } = req.body;

  try {
    // Transaction for atomic operations
    const tx = session.beginTransaction();

    // 1. Create/Update Company
    await tx.run(
      `MERGE (c:Company {cin: $cin})
       SET c += {
         name: $name,
         state: $state,
         paid_capital: $paid_capital,
         inc_date: date($inc_date),
         address: $address,
         category: $category,
         sub_category: $sub_category,
         activity: $activity
       }`,
      {
        cin: company.cin,
        name: company.name,
        state: company.state || null,
        paid_capital: company.paid_capital || null,
        inc_date: company.inc_date || null,
        address: company.address || null,
        category: company.category || null,
        sub_category: company.sub_category || null,
        activity: company.activity || null
      }
    );

    // 2. Create/Update Director
    await tx.run(
      `MERGE (d:Director {din: $din})
       SET d.name = $name`,
      {
        din: director.din,
        name: director.name
      }
    );

    // 3. Create relationship between Director and Primary Company
    await tx.run(
      `MATCH (d:Director {din: $din}), (c:Company {cin: $cin})
       MERGE (d)-[r:DIRECTED]->(c)
       SET r.designation = $designation,
           r.appointment_date = date($appointment_date)`,
      {
        din: director.din,
        cin: company.cin,
        designation: director.designation,
        appointment_date: director.appointment_date || null
      }
    );

    // 4. Handle other companies if they exist
    for (const otherCompany of otherCompanies) {
      await tx.run(
        `MERGE (oc:Company {cin: $cin})
         SET oc.name = $name`,
        {
          cin: otherCompany.cin,
          name: otherCompany.name
        }
      );

      await tx.run(
        `MATCH (d:Director {din: $din}), (oc:Company {cin: $cin})
         MERGE (d)-[r:DIRECTED]->(oc)
         SET r.designation = $designation,
             r.appointment_date = date($appointment_date)`,
        {
          din: director.din,
          cin: otherCompany.cin,
          designation: otherCompany.designation || director.designation,
          appointment_date: otherCompany.appointment_date || null
        }
      );
    }

    // Commit transaction
    await tx.commit();

    res.status(201).json({
      success: true,
      message: "Company and director information successfully added",
      data: {
        company,
        director,
        otherCompanies
      }
    });
  } catch (error) {
    console.error("Error in form submission:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add company and director information",
      error: error.message
    });
  } finally {
    await session.close();
  }
});

module.exports = router;