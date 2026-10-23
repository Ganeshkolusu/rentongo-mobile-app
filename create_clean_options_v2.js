const fs = require('fs');

// Read the generated file
const fileContent = fs.readFileSync('c:\\rentongovehicle\\car_options_final.js', 'utf8');

// Parse the file to extract the arrays
const carNameMatch = fileContent.match(/const carNameOptions = (\[[\s\S]*?\]);/);
const fuelMatch = fileContent.match(/const fuelOptions = (\[[\s\S]*?\]);/);
const transmissionMatch = fileContent.match(/const transmissionOptions = (\[[\s\S]*?\]);/);
const seaterMatch = fileContent.match(/const seaterOptions = (\[[\s\S]*?\]);/);
const modelMatch = fileContent.match(/const modelOptions = (\[[\s\S]*?\]);/);

const carNameOptions = JSON.parse(carNameMatch[1]);
const fuelOptions = JSON.parse(fuelMatch[1]);
const transmissionOptions = JSON.parse(transmissionMatch[1]);
const seaterOptions = JSON.parse(seaterMatch[1]);
const modelOptions = JSON.parse(modelMatch[1]);

// Create cleaner fuel options - consolidate similar types
const cleanFuelTypes = new Set();
fuelOptions.forEach(option => {
  const label = option.label;

  // Simplify fuel types
  if (label.toLowerCase().includes('petrol') && !label.toLowerCase().includes('hybrid')) {
    cleanFuelTypes.add('Petrol');
  } else if (label.toLowerCase().includes('diesel') && !label.toLowerCase().includes('hybrid')) {
    cleanFuelTypes.add('Diesel');
  } else if (label.toLowerCase().includes('electric') && !label.toLowerCase().includes('hybrid') && !label.toLowerCase().includes('plug-in')) {
    cleanFuelTypes.add('Electric');
  } else if (label.toLowerCase().includes('cng')) {
    cleanFuelTypes.add('CNG');
  } else if (label.toLowerCase().includes('lpg')) {
    cleanFuelTypes.add('LPG');
  } else if (label.toLowerCase().includes('plug-in hybrid') || label.toLowerCase().includes('phev')) {
    cleanFuelTypes.add('Plug-in Hybrid');
  } else if (label.toLowerCase().includes('hybrid') && !label.toLowerCase().includes('plug-in')) {
    cleanFuelTypes.add('Hybrid');
  } else if (label.toLowerCase().includes('hydrogen')) {
    cleanFuelTypes.add('Hydrogen');
  } else if (label.toLowerCase().includes('flex-fuel') || label.toLowerCase().includes('biofuel')) {
    cleanFuelTypes.add('Flex-Fuel');
  }
});

// Create cleaner transmission options - consolidate similar types
const cleanTransTypes = new Set();
transmissionOptions.forEach(option => {
  const label = option.label;

  // Simplify transmission types
  if (label.toLowerCase().includes('manual') && !label.toLowerCase().includes('automated') && !label.toLowerCase().includes('sequential')) {
    cleanTransTypes.add('Manual');
  } else if (label.toLowerCase().includes('automatic') && !label.toLowerCase().includes('dual') && !label.toLowerCase().includes('single') && !label.toLowerCase().includes('speed')) {
    cleanTransTypes.add('Automatic');
  } else if (label.toLowerCase().includes('cvt') || label.toLowerCase().includes('e-cvt') || label.toLowerCase().includes('ecvt')) {
    cleanTransTypes.add('CVT');
  } else if (label.toLowerCase().includes('dct') || label.toLowerCase().includes('dual-clutch') || label.toLowerCase().includes('dsg')) {
    cleanTransTypes.add('DCT');
  } else if (label.toLowerCase().includes('amt')) {
    cleanTransTypes.add('AMT');
  } else if (label.toLowerCase().includes('single') || label.toLowerCase().includes('1-speed')) {
    cleanTransTypes.add('Single Speed');
  } else if (label.toLowerCase().includes('imt')) {
    cleanTransTypes.add('iMT');
  } else if (label.toLowerCase().includes('sequential')) {
    cleanTransTypes.add('Sequential');
  }
});

// Create the simplified arrays
const cleanFuelOptions = Array.from(cleanFuelTypes).sort().map(fuel => ({
  label: fuel,
  value: fuel.toLowerCase().replace(/-/g, '')
}));

const cleanTransmissionOptions = Array.from(cleanTransTypes).sort().map(trans => ({
  label: trans,
  value: trans.toLowerCase().replace(/ /g, '')
}));

cleanFuelOptions.forEach(f => console.log(`  - ${f.label} => ${f.value}`));

cleanTransmissionOptions.forEach(t => console.log(`  - ${t.label} => ${t.value}`));

// Create output with simplified versions
const output = `// ========== SIMPLIFIED CAR OPTIONS ==========
// These are the cleaned/consolidated options ready to use in your app

// ========== CAR NAME OPTIONS ==========
// Total unique car names: ${carNameOptions.length}
const carNameOptions = ${JSON.stringify(carNameOptions, null, 2)};

// ========== FUEL OPTIONS (SIMPLIFIED) ==========
// Total unique fuel types: ${cleanFuelOptions.length}
const fuelOptions = ${JSON.stringify(cleanFuelOptions, null, 2)};

// ========== TRANSMISSION OPTIONS (SIMPLIFIED) ==========
// Total unique transmission types: ${cleanTransmissionOptions.length}
const transmissionOptions = ${JSON.stringify(cleanTransmissionOptions, null, 2)};

// ========== SEATER OPTIONS ==========
// Total unique seater values: ${seaterOptions.length}
const seaterOptions = ${JSON.stringify(seaterOptions, null, 2)};

// ========== MODEL/VARIANT OPTIONS ==========
// Total unique variants: ${modelOptions.length}
const modelOptions = ${JSON.stringify(modelOptions, null, 2)};

export { carNameOptions, fuelOptions, transmissionOptions, seaterOptions, modelOptions };
`;

fs.writeFileSync('c:\\rentongovehicle\\car_options_ready.js', output);
