// scripts/process-locations.ts
const fs = require('fs');
const path = require('path');

interface StateData {
  [state: string]: string[];
}

interface FormattedLocation {
  state: string;
  districts: string[];
}

function processLocations(): void {
  try {
    // Read the input file
    const inputPath = path.join(__dirname, '../src/assets/json/location.json');
    const outputPath = path.join(__dirname, '../src/assets/json/processed-locations.json');

    const rawData = fs.readFileSync(inputPath, 'utf-8');
    const stateData: StateData = JSON.parse(rawData);

    // Transform the data
    const formattedData: FormattedLocation[] = Object.entries(stateData).map(([state, districts]) => ({
      state,
      districts
    }));

    // Write the output file
    fs.writeFileSync(outputPath, JSON.stringify(formattedData, null, 2));
    console.log('Successfully processed location data!');
    console.log(`Output written to: ${outputPath}`);
  } catch (error) {
    console.error('Error processing location data:', error);
    process.exit(1);
  }
}

processLocations();
