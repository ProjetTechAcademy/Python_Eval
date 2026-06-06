import fetch from 'node-fetch';
import * as fs from 'fs';

async function fetchCsv() {
  try {
    const response = await fetch("https://docs.google.com/spreadsheets/d/e/2PACX-1vTjlDoIpwgfINt90cgwSBP0VC9CgwrHsYkli7XCp9U29wmVpMEymiZquaa5JQttyXIjokhDwn82so29/pub?gid=0&single=true&output=csv");
    const text = await response.text();
    fs.writeFileSync('./zone_e_data.csv', text);
    console.log("Successfully fetched and saved CSV. First 1000 characters:");
    console.log(text.slice(0, 1000));
  } catch (err) {
    console.error("Error fetching CSV:", err);
  }
}

fetchCsv();
