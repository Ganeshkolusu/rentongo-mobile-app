// ========== CAR NAME OPTIONS ==========
// Total unique car names: 163
const carNameOptions = [
  {
    "label": "Audi A6 Avant e-tron",
    "value": "Audi A6 Avant e-tron"
  },
  {
    "label": "Audi A6 e-tron",
    "value": "Audi A6 e-tron"
  },
  {
    "label": "Audi Activesphere Concept",
    "value": "Audi Activesphere Concept"
  },
  {
    "label": "Audi Grandsphere Concept",
    "value": "Audi Grandsphere Concept"
  },
  {
    "label": "Audi Skysphere Concept",
    "value": "Audi Skysphere Concept"
  },
  {
    "label": "Audi Urbansphere Concept",
    "value": "Audi Urbansphere Concept"
  },
  {
    "label": "CUPRA Ateca",
    "value": "CUPRA Ateca"
  },
  {
    "label": "CUPRA Born",
    "value": "CUPRA Born"
  },
  {
    "label": "CUPRA Formentor",
    "value": "CUPRA Formentor"
  },
  {
    "label": "CUPRA Leon",
    "value": "CUPRA Leon"
  },
  {
    "label": "CUPRA Tavascan",
    "value": "CUPRA Tavascan"
  },
  {
    "label": "CUPRA Terramar",
    "value": "CUPRA Terramar"
  },
  {
    "label": "Dacia Bigster",
    "value": "Dacia Bigster"
  },
  {
    "label": "Dacia Duster",
    "value": "Dacia Duster"
  },
  {
    "label": "Dacia Jogger",
    "value": "Dacia Jogger"
  },
  {
    "label": "Dacia Logan",
    "value": "Dacia Logan"
  },
  {
    "label": "Dacia Sandero",
    "value": "Dacia Sandero"
  },
  {
    "label": "Dacia Sandero Stepway",
    "value": "Dacia Sandero Stepway"
  },
  {
    "label": "Dacia Spring Electric",
    "value": "Dacia Spring Electric"
  },
  {
    "label": "Force Gurkha (3-Door)",
    "value": "Force Gurkha (3-Door)"
  },
  {
    "label": "Force Gurkha (5-Door)",
    "value": "Force Gurkha (5-Door)"
  },
  {
    "label": "Force Shaktiman Pickup",
    "value": "Force Shaktiman Pickup"
  },
  {
    "label": "Force Traveller",
    "value": "Force Traveller"
  },
  {
    "label": "Force Traveller Ambulance",
    "value": "Force Traveller Ambulance"
  },
  {
    "label": "Force Traveller Delivery Van",
    "value": "Force Traveller Delivery Van"
  },
  {
    "label": "Force Traveller Monobus",
    "value": "Force Traveller Monobus"
  },
  {
    "label": "Force Traveller School Bus",
    "value": "Force Traveller School Bus"
  },
  {
    "label": "Force Traveller Urbania",
    "value": "Force Traveller Urbania"
  },
  {
    "label": "Force Trax Ambulance",
    "value": "Force Trax Ambulance"
  },
  {
    "label": "Force Trax Cruiser",
    "value": "Force Trax Cruiser"
  },
  {
    "label": "Force Trax Toofan",
    "value": "Force Trax Toofan"
  },
  {
    "label": "GAZ Sadko NEXT",
    "value": "GAZ Sadko NEXT"
  },
  {
    "label": "GAZ Ural NEXT",
    "value": "GAZ Ural NEXT"
  },
  {
    "label": "GAZ Vepr NEXT",
    "value": "GAZ Vepr NEXT"
  },
  {
    "label": "GAZelle e-NN",
    "value": "GAZelle e-NN"
  },
  {
    "label": "GAZon NEXT",
    "value": "GAZon NEXT"
  },
  {
    "label": "GAZon NEXT City",
    "value": "GAZon NEXT City"
  },
  {
    "label": "GAZon e-NN",
    "value": "GAZon e-NN"
  },
  {
    "label": "Hindustan Ambassador",
    "value": "Hindustan Ambassador"
  },
  {
    "label": "Hindustan Ambassador EV",
    "value": "Hindustan Ambassador EV"
  },
  {
    "label": "Hindustan Contessa",
    "value": "Hindustan Contessa"
  },
  {
    "label": "Hindustan Porter",
    "value": "Hindustan Porter"
  },
  {
    "label": "Hindustan Pushpak",
    "value": "Hindustan Pushpak"
  },
  {
    "label": "Hindustan Trekker",
    "value": "Hindustan Trekker"
  },
  {
    "label": "Hindustan Veer",
    "value": "Hindustan Veer"
  },
  {
    "label": "Lada Granta",
    "value": "Lada Granta"
  },
  {
    "label": "Lada Kalina",
    "value": "Lada Kalina"
  },
  {
    "label": "Lada Largus",
    "value": "Lada Largus"
  },
  {
    "label": "Lada Largus Cross",
    "value": "Lada Largus Cross"
  },
  {
    "label": "Lada Niva Bronto",
    "value": "Lada Niva Bronto"
  },
  {
    "label": "Lada Niva Legend (4x4)",
    "value": "Lada Niva Legend (4x4)"
  },
  {
    "label": "Lada Niva Travel",
    "value": "Lada Niva Travel"
  },
  {
    "label": "Lada Priora",
    "value": "Lada Priora"
  },
  {
    "label": "Lada Vesta",
    "value": "Lada Vesta"
  },
  {
    "label": "Lada XRay",
    "value": "Lada XRay"
  },
  {
    "label": "Lada XRay Cross",
    "value": "Lada XRay Cross"
  },
  {
    "label": "Mahindra BE.05",
    "value": "Mahindra BE.05"
  },
  {
    "label": "Mahindra BE.07",
    "value": "Mahindra BE.07"
  },
  {
    "label": "Mahindra BE.09",
    "value": "Mahindra BE.09"
  },
  {
    "label": "Mahindra Bolero",
    "value": "Mahindra Bolero"
  },
  {
    "label": "Mahindra Bolero Neo",
    "value": "Mahindra Bolero Neo"
  },
  {
    "label": "Mahindra KUV100 NXT",
    "value": "Mahindra KUV100 NXT"
  },
  {
    "label": "Mahindra Marazzo",
    "value": "Mahindra Marazzo"
  },
  {
    "label": "Mahindra Scorpio Classic",
    "value": "Mahindra Scorpio Classic"
  },
  {
    "label": "Mahindra Scorpio-N",
    "value": "Mahindra Scorpio-N"
  },
  {
    "label": "Mahindra Thar",
    "value": "Mahindra Thar"
  },
  {
    "label": "Mahindra Thar 5-Door",
    "value": "Mahindra Thar 5-Door"
  },
  {
    "label": "Mahindra XUV.e8",
    "value": "Mahindra XUV.e8"
  },
  {
    "label": "Mahindra XUV.e9",
    "value": "Mahindra XUV.e9"
  },
  {
    "label": "Mahindra XUV300",
    "value": "Mahindra XUV300"
  },
  {
    "label": "Mahindra XUV400 EV",
    "value": "Mahindra XUV400 EV"
  },
  {
    "label": "Mahindra XUV500",
    "value": "Mahindra XUV500"
  },
  {
    "label": "Mahindra XUV700",
    "value": "Mahindra XUV700"
  },
  {
    "label": "Maruti Alto K10",
    "value": "Maruti Alto K10"
  },
  {
    "label": "Maruti Baleno",
    "value": "Maruti Baleno"
  },
  {
    "label": "Maruti Brezza",
    "value": "Maruti Brezza"
  },
  {
    "label": "Maruti Celerio",
    "value": "Maruti Celerio"
  },
  {
    "label": "Maruti Ciaz",
    "value": "Maruti Ciaz"
  },
  {
    "label": "Maruti Dzire",
    "value": "Maruti Dzire"
  },
  {
    "label": "Maruti Eeco",
    "value": "Maruti Eeco"
  },
  {
    "label": "Maruti Ertiga",
    "value": "Maruti Ertiga"
  },
  {
    "label": "Maruti Fronx",
    "value": "Maruti Fronx"
  },
  {
    "label": "Maruti Grand Vitara",
    "value": "Maruti Grand Vitara"
  },
  {
    "label": "Maruti Ignis",
    "value": "Maruti Ignis"
  },
  {
    "label": "Maruti Invicto",
    "value": "Maruti Invicto"
  },
  {
    "label": "Maruti Jimny",
    "value": "Maruti Jimny"
  },
  {
    "label": "Maruti S-Presso",
    "value": "Maruti S-Presso"
  },
  {
    "label": "Maruti Swift",
    "value": "Maruti Swift"
  },
  {
    "label": "Maruti Tour S",
    "value": "Maruti Tour S"
  },
  {
    "label": "Maruti Wagon R",
    "value": "Maruti Wagon R"
  },
  {
    "label": "Maruti XL6",
    "value": "Maruti XL6"
  },
  {
    "label": "Perodua Alza",
    "value": "Perodua Alza"
  },
  {
    "label": "Perodua Aruz",
    "value": "Perodua Aruz"
  },
  {
    "label": "Perodua Ativa",
    "value": "Perodua Ativa"
  },
  {
    "label": "Perodua Axia",
    "value": "Perodua Axia"
  },
  {
    "label": "Perodua Bezza",
    "value": "Perodua Bezza"
  },
  {
    "label": "Perodua EV Concept",
    "value": "Perodua EV Concept"
  },
  {
    "label": "Perodua Myvi",
    "value": "Perodua Myvi"
  },
  {
    "label": "Proton Iriz",
    "value": "Proton Iriz"
  },
  {
    "label": "Proton Persona",
    "value": "Proton Persona"
  },
  {
    "label": "Proton Prevé",
    "value": "Proton Prevé"
  },
  {
    "label": "Proton Saga",
    "value": "Proton Saga"
  },
  {
    "label": "Proton Suprima S",
    "value": "Proton Suprima S"
  },
  {
    "label": "Proton X30",
    "value": "Proton X30"
  },
  {
    "label": "Proton X50",
    "value": "Proton X50"
  },
  {
    "label": "Proton X70",
    "value": "Proton X70"
  },
  {
    "label": "Proton X90",
    "value": "Proton X90"
  },
  {
    "label": "Proton e.MAS",
    "value": "Proton e.MAS"
  },
  {
    "label": "SEAT Arona",
    "value": "SEAT Arona"
  },
  {
    "label": "SEAT Ateca",
    "value": "SEAT Ateca"
  },
  {
    "label": "SEAT Ibiza",
    "value": "SEAT Ibiza"
  },
  {
    "label": "SEAT Leon",
    "value": "SEAT Leon"
  },
  {
    "label": "SEAT Mii Electric",
    "value": "SEAT Mii Electric"
  },
  {
    "label": "SEAT Tarraco",
    "value": "SEAT Tarraco"
  },
  {
    "label": "SEAT Toledo",
    "value": "SEAT Toledo"
  },
  {
    "label": "Tata Altroz",
    "value": "Tata Altroz"
  },
  {
    "label": "Tata Curvv EV",
    "value": "Tata Curvv EV"
  },
  {
    "label": "Tata Harrier",
    "value": "Tata Harrier"
  },
  {
    "label": "Tata Harrier EV",
    "value": "Tata Harrier EV"
  },
  {
    "label": "Tata Nexon",
    "value": "Tata Nexon"
  },
  {
    "label": "Tata Nexon EV",
    "value": "Tata Nexon EV"
  },
  {
    "label": "Tata Punch",
    "value": "Tata Punch"
  },
  {
    "label": "Tata Punch EV",
    "value": "Tata Punch EV"
  },
  {
    "label": "Tata Safari",
    "value": "Tata Safari"
  },
  {
    "label": "Tata Sierra EV",
    "value": "Tata Sierra EV"
  },
  {
    "label": "Tata Tiago",
    "value": "Tata Tiago"
  },
  {
    "label": "Tata Tiago EV",
    "value": "Tata Tiago EV"
  },
  {
    "label": "Tata Tiago NRG",
    "value": "Tata Tiago NRG"
  },
  {
    "label": "Tata Tigor",
    "value": "Tata Tigor"
  },
  {
    "label": "Tata Tigor EV",
    "value": "Tata Tigor EV"
  },
  {
    "label": "UAZ Bars / Simba",
    "value": "UAZ Bars / Simba"
  },
  {
    "label": "UAZ Hunter",
    "value": "UAZ Hunter"
  },
  {
    "label": "UAZ Hunter Expedition",
    "value": "UAZ Hunter Expedition"
  },
  {
    "label": "UAZ Patriot",
    "value": "UAZ Patriot"
  },
  {
    "label": "UAZ Patriot Expedition",
    "value": "UAZ Patriot Expedition"
  },
  {
    "label": "UAZ Patriot Pickup",
    "value": "UAZ Patriot Pickup"
  },
  {
    "label": "UAZ Profi",
    "value": "UAZ Profi"
  },
  {
    "label": "Volvo EC40",
    "value": "Volvo EC40"
  },
  {
    "label": "Volvo EX30",
    "value": "Volvo EX30"
  },
  {
    "label": "Volvo EX40",
    "value": "Volvo EX40"
  },
  {
    "label": "Volvo EX90",
    "value": "Volvo EX90"
  },
  {
    "label": "Volvo S60",
    "value": "Volvo S60"
  },
  {
    "label": "Volvo S60 Recharge",
    "value": "Volvo S60 Recharge"
  },
  {
    "label": "Volvo S90",
    "value": "Volvo S90"
  },
  {
    "label": "Volvo S90 Recharge",
    "value": "Volvo S90 Recharge"
  },
  {
    "label": "Volvo V60",
    "value": "Volvo V60"
  },
  {
    "label": "Volvo V60 Cross Country",
    "value": "Volvo V60 Cross Country"
  },
  {
    "label": "Volvo V60 Recharge",
    "value": "Volvo V60 Recharge"
  },
  {
    "label": "Volvo V90",
    "value": "Volvo V90"
  },
  {
    "label": "Volvo V90 Cross Country",
    "value": "Volvo V90 Cross Country"
  },
  {
    "label": "Volvo V90 Recharge",
    "value": "Volvo V90 Recharge"
  },
  {
    "label": "Volvo XC40",
    "value": "Volvo XC40"
  },
  {
    "label": "Volvo XC40 Recharge",
    "value": "Volvo XC40 Recharge"
  },
  {
    "label": "Volvo XC60",
    "value": "Volvo XC60"
  },
  {
    "label": "Volvo XC60 Recharge",
    "value": "Volvo XC60 Recharge"
  },
  {
    "label": "Volvo XC90",
    "value": "Volvo XC90"
  },
  {
    "label": "Volvo XC90 Recharge",
    "value": "Volvo XC90 Recharge"
  },
  {
    "label": "Škoda Fabia",
    "value": "Škoda Fabia"
  },
  {
    "label": "Škoda Octavia",
    "value": "Škoda Octavia"
  },
  {
    "label": "Škoda Rapid",
    "value": "Škoda Rapid"
  },
  {
    "label": "Škoda Scala",
    "value": "Škoda Scala"
  },
  {
    "label": "Škoda Slavia",
    "value": "Škoda Slavia"
  },
  {
    "label": "Škoda Superb",
    "value": "Škoda Superb"
  }
];

// ========== FUEL OPTIONS ==========
// Total unique fuel types: 23
const fuelOptions = [
  {
    "label": "AWD",
    "value": "awd"
  },
  {
    "label": "CNG",
    "value": "cng"
  },
  {
    "label": "Diesel",
    "value": "diesel"
  },
  {
    "label": "Diesel (Discontinued",
    "value": "diesel (discontinued"
  },
  {
    "label": "Electric",
    "value": "electric"
  },
  {
    "label": "Electric (Altroz EV upcoming)",
    "value": "electric (altroz ev upcoming)"
  },
  {
    "label": "Electric (Nexon EV)",
    "value": "electric (nexon ev)"
  },
  {
    "label": "Electric (Punch EV)",
    "value": "electric (punch ev)"
  },
  {
    "label": "Electric (Tigor EV)",
    "value": "electric (tigor ev)"
  },
  {
    "label": "Electric (Upcoming 2025)",
    "value": "electric (upcoming 2025)"
  },
  {
    "label": "Electric (Upcoming 2025–2026)",
    "value": "electric (upcoming 2025–2026)"
  },
  {
    "label": "Electric (Upcoming 2026)",
    "value": "electric (upcoming 2026)"
  },
  {
    "label": "Electric (Upcoming 2027)",
    "value": "electric (upcoming 2027)"
  },
  {
    "label": "Hybrid",
    "value": "hybrid"
  },
  {
    "label": "LPG",
    "value": "lpg"
  },
  {
    "label": "Mild Hybrid",
    "value": "mild hybrid"
  },
  {
    "label": "Mild Hybrid 48V",
    "value": "mild hybrid 48v"
  },
  {
    "label": "Petrol",
    "value": "petrol"
  },
  {
    "label": "Plug-in Hybrid",
    "value": "plug-in hybrid"
  },
  {
    "label": "Plug-in Hybrid (Petrol + Electric)",
    "value": "plug-in hybrid (petrol + electric)"
  },
  {
    "label": "Strong Hybrid",
    "value": "strong hybrid"
  },
  {
    "label": "Strong Hybrid Petrol",
    "value": "strong hybrid petrol"
  },
  {
    "label": "predecessor of XUV700)",
    "value": "predecessor of xuv700)"
  }
];

// ========== TRANSMISSION OPTIONS ==========
// Total unique transmission types: 2
const transmissionOptions = [
  {
    "label": "Automatic (Concept)",
    "value": "automatic (concept)"
  },
  {
    "label": "Automatic (Single Speed)",
    "value": "automatic (single speed)"
  }
];

// ========== SEATER OPTIONS ==========
// Total unique seater values: 4
const seaterOptions = [
  {
    "label": "2",
    "value": "2"
  },
  {
    "label": "4",
    "value": "4"
  },
  {
    "label": "5",
    "value": "5"
  },
  {
    "label": "6",
    "value": "6"
  }
];

// ========== MODEL/VARIANT OPTIONS ==========
// Total unique variants: 0
const modelOptions = [];

export { carNameOptions, fuelOptions, transmissionOptions, seaterOptions, modelOptions };
