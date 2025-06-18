require('dotenv').config({ path: '../.env' });
const fs = require('fs');
const neo4j = require('neo4j-driver');

const uri = process.env.NEO4J_URI;
const user = process.env.NEO4J_USERNAME;
const password = process.env.NEO4J_PASSWORD;

const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
const session = driver.session();

async function importAll() {
  console.log("🚀 Starting full data import...");

  try {
    // STEP 1: Master Companies
    console.log("📊 Importing master companies...");
    const allCompanies = JSON.parse(fs.readFileSync('../data/all_companies_data.json'));
    let companyCount = 0;
    
    for (const [state, companies] of Object.entries(allCompanies)) {
      for (const c of companies) {
        await session.run(
          `
          MERGE (comp:Company:MasterCompany {cin: $cin})
          SET comp.name = $name,
              comp.state = $state,
              comp.auth_capital = $auth_capital,
              comp.paid_capital = $paid_capital,
              comp.activity = $activity,
              comp.sub_category = $sub_category,
              comp.category = $category,
              comp.inc_date = $inc_date,
              comp.address = $address,
              comp.primary_info = CASE 
                WHEN comp.primary_info IS NULL THEN {} 
                ELSE comp.primary_info 
              END
          `,
          {
            cin: c.cin,
            name: c.company_name,
            state: c.state,
            auth_capital: c.authorized_capital,
            paid_capital: c.paid_up_capital,
            activity: c.activity_description,
            sub_category: c.company_sub_category,
            category: c.company_category,
            inc_date: c.date_of_incorporation,
            address: c.registered_office_address || null
          }
        );
        companyCount++;
      }
    }
    console.log(`✅ Processed ${companyCount} master companies`);

    // STEP 2: Company → Director relationships
    console.log("👥 Importing company-director relationships...");
    const companyDirectors = JSON.parse(fs.readFileSync('../data/finalSignatoryInfo.json'));
    let directorRelCount = 0;
    
    for (const entry of companyDirectors) {
      // First ensure company exists
      await session.run(
        `
        MERGE (comp:Company {name: $company_name})
        SET comp.primary_info = CASE 
          WHEN comp.primary_info IS NULL THEN {} 
          ELSE comp.primary_info 
        END
        `,
        { company_name: entry.company_name }
      );

      for (const d of entry.directors) {
        await session.run(
          `
          MERGE (dir:Director {din: $din})
          SET dir.name = $name

          MERGE (comp:Company {name: $company_name})
          MERGE (dir)-[r:DIRECTED]->(comp)
          SET r.designation = $designation
          `,
          {
            din: d.din_pan,
            name: d.name,
            company_name: entry.company_name,
            designation: d.designation
          }
        );
        directorRelCount++;
      }
    }
    console.log(`✅ Processed ${directorRelCount} director relationships`);

    // STEP 3: Director → Multiple Company Positions
    console.log("🔗 Importing director positions...");
    const directorCompanies = JSON.parse(fs.readFileSync('../data/directors_data.json'));
    let positionCount = 0;
    
    for (const d of directorCompanies) {
      await session.run(
        `MERGE (dir:Director {din: $din}) SET dir.name = $name`,
        { din: d.din, name: d.name }
      );

      for (const p of d.positions) {
        await session.run(
          `
          MERGE (comp:Company {cin: $cin})
          SET comp.name = $name,
              comp.primary_info = CASE 
                WHEN comp.primary_info IS NULL THEN {} 
                ELSE comp.primary_info 
              END

          MERGE (dir:Director {din: $din})
          MERGE (dir)-[r:DIRECTED]->(comp)
          SET r.designation = $designation
          `,
          {
            cin: p.cin,
            name: p.company_name,
            din: d.din,
            designation: p.designation
          }
        );
        positionCount++;
      }
    }
    console.log(`✅ Processed ${positionCount} director positions`);

    // STEP 4: Extra companies from director-based discovery
    console.log("🆕 Importing extra companies...");
    const extraCompanies = JSON.parse(fs.readFileSync('../data/data.json'));
    let extraCount = 0;
    
    for (const c of extraCompanies) {
      await session.run(
        `
        MERGE (comp:Company {cin: $cin})
        SET comp.name = $name,
            comp.state = $state,
            comp.paid_capital = $paid_capital,
            comp.sub_category = $sub_category,
            comp.inc_date = $inc_date,
            comp.primary_info = CASE 
              WHEN comp.primary_info IS NULL THEN {} 
              ELSE comp.primary_info 
            END

        MERGE (dir:Director {din: $din})
        SET dir.name = $director_name

        MERGE (dir)-[r:DIRECTED]->(comp)
        SET r.designation = $designation
        `,
        {
          cin: c.cin,
          name: c.company_name,
          state: c.state,
          paid_capital: c.paid_up_capital,
          sub_category: c.company_sub_category,
          inc_date: c.date_of_incorporation,
          din: c.added_from_directors_data.din,
          director_name: c.added_from_directors_data.director_name,
          designation: c.added_from_directors_data.designation
        }
      );
      extraCount++;
    }
    console.log(`✅ Processed ${extraCount} extra companies`);

    console.log("✅ Full import completed successfully!");
    
    // Optional: Show summary statistics
    const summary = await session.run(`
      MATCH (c:Company) 
      OPTIONAL MATCH (d:Director)-[:DIRECTED]->(c)
      RETURN 
        count(DISTINCT c) as total_companies,
        count(DISTINCT d) as total_directors,
        count(*) as total_relationships
    `);
    
    const stats = summary.records[0];
    console.log(`📈 Summary: ${stats.get('total_companies')} companies, ${stats.get('total_directors')} directors, ${stats.get('total_relationships')} relationships`);

  } catch (error) {
    console.error("❌ Import failed:", error);
    throw error;
  } finally {
    await session.close();
    await driver.close();
  }
}

importAll().catch(console.error);