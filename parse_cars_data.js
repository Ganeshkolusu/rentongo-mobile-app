const fs = require('fs');

// Read the file
const fileContent = fs.readFileSync('C:\\Users\\MANASA\\Downloads\\Dataon Cars\\Dataon Cars\\carsdata.js', 'utf8');

// Remove comments and parse the JSON arrays
// The file contains multiple JSON arrays separated by comments
const jsonArrayPattern = /\[[\s\S]*?\]/g;
const jsonArrays = fileContent.match(jsonArrayPattern);

let allCars = [];

// Parse each array
jsonArrays.forEach(arrayStr => {
  try {
    const parsed = JSON.parse(arrayStr);
    if (Array.isArray(parsed)) {
      allCars = allCars.concat(parsed);
    }
  } catch (e) {
    // Skip invalid JSON
  }
});


// Extract unique values
const carNames = new Set();
const fuelTypes = new Set();
const transmissionTypes = new Set();
const seaters = new Set();
const variants = new Set();

allCars.forEach(car => {
  // Car names
  if (car.CarName) {
    carNames.add(car.CarName);
  }

  // Fuel types - split by "/" and trim
  if (car.fuelType) {
    car.fuelType.split('/').forEach(fuel => {
      const trimmed = fuel.trim();
      if (trimmed) {
        fuelTypes.add(trimmed);
      }
    });
  }

  // Transmission types - split by "/" and trim
  if (car.transmissionType) {
    car.transmissionType.split('/').forEach(trans => {
      const trimmed = trans.trim();
      if (trimmed) {
        transmissionTypes.add(trimmed);
      }
    });
  }

  // Seaters
  if (car.seater) {
    seaters.add(car.seater);
  }

  // Variants
  if (car.variants && Array.isArray(car.variants)) {
    car.variants.forEach(variant => {
      if (variant) {
        variants.add(variant);
      }
    });
  }
});

// Create the arrays in the required format

// 1. Car Name Options
const carNameOptions = Array.from(carNames).sort().map(name => ({
  label: name,
  value: name
}));

// 2. Fuel Options - lowercase value
const fuelOptions = Array.from(fuelTypes).sort().map(fuel => ({
  label: fuel,
  value: fuel.toLowerCase()
}));

// 3. Transmission Options - lowercase value
const transmissionOptions = Array.from(transmissionTypes).sort().map(trans => ({
  label: trans,
  value: trans.toLowerCase()
}));

// 4. Seater Options
const seaterOptions = Array.from(seaters).sort((a, b) => a - b).map(seater => ({
  label: String(seater),
  value: String(seater)
}));

// 5. Model/Variant Options
const modelOptions = Array.from(variants).sort().map(variant => ({
  label: variant,
  value: variant
}));

// Save to file
const output = `// ========== CAR NAME OPTIONS ==========
// Total unique car names: ${carNameOptions.length}
const carNameOptions = ${JSON.stringify(carNameOptions, null, 2)};

// ========== FUEL OPTIONS ==========
// Total unique fuel types: ${fuelOptions.length}
const fuelOptions = ${JSON.stringify(fuelOptions, null, 2)};

// ========== TRANSMISSION OPTIONS ==========
// Total unique transmission types: ${transmissionOptions.length}
const transmissionOptions = ${JSON.stringify(transmissionOptions, null, 2)};

// ========== SEATER OPTIONS ==========
// Total unique seater values: ${seaterOptions.length}
const seaterOptions = ${JSON.stringify(seaterOptions, null, 2)};

// ========== MODEL/VARIANT OPTIONS ==========
// Total unique variants: ${modelOptions.length}
const modelOptions = ${JSON.stringify(modelOptions, null, 2)};

export { carNameOptions, fuelOptions, transmissionOptions, seaterOptions, modelOptions };
`;

fs.writeFileSync('c:\\rentongovehicle\\car_options_output.js', output);
