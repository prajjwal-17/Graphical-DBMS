require('dotenv').config();
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
const allCompanies = JSON.parse(fs.readFileSync('./data/all_companies_data.json'));
for (const [state, companies] of Object.entries(allCompanies)) {
  for (const c of companies) {
    await session.run(
      `
      MERGE (comp:Company:MasterCompany {cin: $cin})  // <- ADD THIS LABEL
      SET comp.name = $name,
          comp.state = $state,
          comp.auth_capital = $auth_capital,
          comp.paid_capital = $paid_capital,
          comp.activity = $activity,
          comp.sub_category = $sub_category,
          comp.category = $category,
          comp.inc_date = $inc_date,
          comp.address = $address
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
  }
}


    // STEP 2: Company → Director relationships
    const companyDirectors = JSON.parse(fs.readFileSync('./data/finalSignatoryInfo.json'));
    for (const entry of companyDirectors) {
      for (const d of entry.directors) {
        await session.run(
          `
          MERGE (dir:Director {din: $din})
          SET dir.name = $name

          MERGE (comp:Company {name: $company_name})
          MERGE (dir)-[:DIRECTED {designation: $designation}]->(comp)
          `,
          {
            din: d.din_pan,
            name: d.name,
            company_name: entry.company_name,
            designation: d.designation
          }
        );
      }
    }

    // STEP 3: Director → Multiple Company Positions
    const directorCompanies = JSON.parse(fs.readFileSync('./data/directors_data.json'));
    for (const d of directorCompanies) {
      await session.run(
        `MERGE (dir:Director {din: $din}) SET dir.name = $name`,
        { din: d.din, name: d.name }
      );

      for (const p of d.positions) {
        await session.run(
          `
          MERGE (comp:Company {cin: $cin})
          SET comp.name = $name

          MERGE (dir:Director {din: $din})
          MERGE (dir)-[:DIRECTED {designation: $designation}]->(comp)
          `,
          {
            cin: p.cin,
            name: p.company_name,
            din: d.din,
            designation: p.designation
          }
        );
      }
    }

    // STEP 4: Extra companies added from director-based discovery
    const extraCompanies = JSON.parse(fs.readFileSync('./data/data.json'));
    for (const c of extraCompanies) {
      await session.run(
        `
        MERGE (comp:Company {cin: $cin})
        SET comp.name = $name,
            comp.state = $state,
            comp.paid_capital = $paid_capital,
            comp.sub_category = $sub_category,
            comp.inc_date = $inc_date

        MERGE (dir:Director {din: $din})
        SET dir.name = $director_name

        MERGE (dir)-[:DIRECTED {designation: $designation}]->(comp)
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
    }

    console.log("✅ Full import completed.");
  } catch (error) {
    console.error("❌ Import failed:", error);
  } finally {
    await session.close();
    await driver.close();
  }
}

importAll();
