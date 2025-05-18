// Direct definition of mock data
const NOW = Math.floor(Date.now() / 1000);
const DAY = 86400; // seconds in a day

export const environmentalAssets = [
  {
    asset_id: "0x5f0f0e0d0c0b0a09080706050403020100000005",
    asset_type: "CarbonCredit",
    standard: "Verra",
    vintage_year: 2023,
    project_id: "VCS-987654",
    project_name: "Amazon Rainforest Conservation Initiative",
    project_location: "Amazon, Brazil",
    country: "Brazil",
    verification_status: "Verified",
    verification_date: NOW - (DAY * 90),
    total_supply: "750000",
    available_supply: "650000",
    description: "The Amazon Rainforest Conservation Initiative focuses on protecting critical primary forest in the heart of the Brazilian Amazon.",
    price_per_unit: "24.75",
    change_24h: "+2.5%",
    image_url: "/images/assets/amazon-rainforest.jpg",
    impact_metrics: {
      carbon_offset_tons: 750000,
      land_area_protected_hectares: 45000,
      water_protected_liters: 7500000000,
      third_party_verifier: "Bureau Veritas",
      biodiversity_species_protected: 347,
      local_communities_supported: 12,
      jobs_created: 148,
      sdg_alignment: {
        "13": 0.95, // Climate Action
        "15": 0.90, // Life on Land
        "6": 0.70,  // Clean Water and Sanitation
        "8": 0.65,  // Decent Work and Economic Growth
        "1": 0.60   // No Poverty
      }
    },
    region: "Amazon Basin",
    coordinates: {
      latitude: -3.4653,
      longitude: -62.2159
    },
    registry_link: "https://registry.verra.org/app/projectDetail/VCS/987654",
    issuance_date: NOW - (DAY * 100),
    expiration_date: NOW + (DAY * 365 * 5), // 5 years from now
    project_developer: "Conservation International",
    methodology: "VM0015 - REDD+ Methodology",
    methodology_details: "VM0015 is a widely accepted methodology for quantifying GHG emission reductions from avoided unplanned deforestation. It employs rigorous baseline setting, monitoring, and verification processes to ensure carbon calculations are accurate and conservative.",
    co_benefits: [
      "Biodiversity conservation",
      "Indigenous community support",
      "Watershed protection",
      "Sustainable employment",
      "Education programs",
      "Healthcare access improvement",
      "Gender equality initiatives"
    ],
    risks: [
      {
        name: "Political instability",
        description: "Changes in Brazilian environmental policy could affect project protection status",
        severity: "Medium"
      },
      {
        name: "Climate change impacts",
        description: "Increasing drought conditions could elevate fire risk in protected areas",
        severity: "Medium"
      },
      {
        name: "Leakage",
        description: "Deforestation activities might be displaced to areas outside project boundaries",
        severity: "Low"
      }
    ],
    certification_documents: [
      { name: "Project Design Document", url: "#pdd", type: "PDF", size_kb: 4250 },
      { name: "Validation Report", url: "#validation", type: "PDF", size_kb: 2100 },
      { name: "Monitoring Report", url: "#monitoring", type: "PDF", size_kb: 3450 },
      { name: "Verification Statement", url: "#verification", type: "PDF", size_kb: 1850 },
      { name: "Registration Statement", url: "#registration", type: "PDF", size_kb: 950 }
    ],
    long_description: "The Amazon Rainforest Conservation Initiative is a comprehensive project designed to protect one of Earth's most critical ecosystems. This REDD+ (Reducing Emissions from Deforestation and Forest Degradation) project operates across 45,000 hectares of primary rainforest in the Brazilian Amazon, an area that faces significant threats from illegal logging, agricultural expansion, and mining activities.\n\nThe project implements a multi-faceted approach to forest conservation:\n\n1. Community Engagement: Working with 12 local and indigenous communities to develop sustainable forest management practices that support livelihoods while preserving the ecosystem.\n\n2. Enhanced Monitoring: Employing advanced satellite technology, drone surveillance, and on-the-ground ranger patrols to detect and prevent illegal deforestation activities.\n\n3. Sustainable Livelihoods: Creating 148 jobs in sustainable industries including non-timber forest product harvesting, ecotourism, and agroforestry.\n\n4. Biodiversity Protection: Safeguarding habitat for 347 documented species, including 29 that are endangered or critically endangered.\n\nEach carbon credit represents one metric ton of verified CO2 emissions reduction, validated under the Verra VCS standard using methodology VM0015.",
    project_updates: [
      {
        date: NOW - (DAY * 30),
        title: "Satellite Monitoring System Upgraded",
        content: "We have successfully implemented an enhanced satellite monitoring system that provides daily coverage of the entire project area with 3m resolution. This upgrade has already helped identify and prevent three attempted incursions in the southern sector.",
        author: "Dr. Maria Silva, Technical Director"
      },
      {
        date: NOW - (DAY * 90),
        title: "Community Forest Management Training Completed",
        content: "Over 120 community members from 8 villages completed our comprehensive sustainable forest management training program. Participants learned techniques for non-timber forest product harvesting, ecosystem service identification, and best practices for ecotourism.",
        author: "João Pereira, Community Liaison"
      }
    ],
    security_details: {
      token_standard: "ERC-1155",
      contract_address: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
      blockchain: "Ethereum",
      token_id: "5",
      marketplace_url: "/marketplace"
    }
  },
  {
    asset_id: "0x5f0f0e0d0c0b0a09080706050403020100000006",
    asset_type: "BiodiversityCredit",
    standard: "Gold Standard",
    vintage_year: 2023,
    project_id: "GS-123456",
    project_name: "Blue Carbon Mangrove Restoration",
    project_location: "Sundarban Delta, Bangladesh",
    country: "Bangladesh",
    verification_status: "Verified",
    verification_date: NOW - (DAY * 60),
    total_supply: "350000",
    available_supply: "290000",
    description: "The Blue Carbon Mangrove Restoration project focuses on rehabilitating degraded mangrove ecosystems in the Sundarban Delta. Mangroves sequester up to five times more carbon than terrestrial forests and protect coastal communities from storms and erosion.",
    price_per_unit: "18.50",
    change_24h: "+1.8%",
    image_url: "/images/assets/mangrove-restoration.jpg",
    impact_metrics: {
      carbon_offset_tons: 350000,
      land_area_protected_hectares: 12000,
      water_protected_liters: 15000000000,
      third_party_verifier: "SCS Global Services",
      biodiversity_species_protected: 234,
      local_communities_supported: 23,
      jobs_created: 270,
      sdg_alignment: {
        "13": 0.85, // Climate Action
        "14": 0.95, // Life Below Water
        "15": 0.80, // Life on Land
        "6": 0.75,  // Clean Water and Sanitation
        "1": 0.70,  // No Poverty
        "8": 0.65   // Decent Work and Economic Growth
      }
    },
    region: "Sundarban Delta",
    coordinates: {
      latitude: 22.0627,
      longitude: 89.0538
    },
    registry_link: "https://registry.goldstandard.org/projects/details/123456",
    issuance_date: NOW - (DAY * 70),
    expiration_date: NOW + (DAY * 365 * 7), // 7 years from now
    project_developer: "Blue Carbon Initiative",
    methodology: "VM0033 - Tidal Wetland and Seagrass Restoration",
    methodology_details: "VM0033 quantifies greenhouse gas emission removals and reductions from restoration of tidal wetlands. It accounts for carbon sequestration in biomass and soil, as well as emissions reductions from prevented land conversion.",
    co_benefits: [
      "Coastal erosion protection",
      "Storm surge mitigation",
      "Marine habitat restoration",
      "Local fishery enhancement",
      "Community-based restoration jobs",
      "Ecotourism development",
      "Water quality improvement"
    ],
    risks: [
      {
        name: "Extreme weather events",
        description: "Increasing cyclone frequency and intensity could damage newly restored areas",
        severity: "High"
      },
      {
        name: "Sea level rise",
        description: "Accelerated sea level rise might outpace natural adaptation capacity of mangroves",
        severity: "Medium"
      },
      {
        name: "Human encroachment",
        description: "Pressure for agricultural land conversion could threaten project boundaries",
        severity: "Medium"
      }
    ],
    certification_documents: [
      { name: "Project Design Document", url: "#pdd", type: "PDF", size_kb: 3850 },
      { name: "Methodology Application", url: "#methodology", type: "PDF", size_kb: 1650 },
      { name: "Validation Report", url: "#validation", type: "PDF", size_kb: 2250 },
      { name: "Monitoring Report", url: "#monitoring", type: "PDF", size_kb: 3100 },
      { name: "Verification Statement", url: "#verification", type: "PDF", size_kb: 1450 }
    ],
    long_description: "The Blue Carbon Mangrove Restoration project represents a pioneering approach to climate change mitigation and adaptation through the rehabilitation of critical coastal ecosystems. Located in the Sundarban Delta of Bangladesh, the world's largest mangrove forest and a UNESCO World Heritage site, this project aims to restore and protect 12,000 hectares of mangrove forest that have been degraded by human activities and extreme weather events.\n\nMangrove forests are among the most carbon-rich ecosystems on Earth, sequestering up to five times more carbon per hectare than tropical rainforests. As \"blue carbon\" sinks, they play a crucial role in mitigating climate change while simultaneously providing vital ecosystem services to coastal communities.\n\nKey project components include:\n\n1. Ecosystem Restoration: Replanting native mangrove species in degraded areas using community-based nurseries and scientifically-validated planting techniques.\n\n2. Coastal Protection: Establishing living barriers that shield communities from increasingly severe cyclones, storm surges, and sea-level rise.\n\n3. Community Development: Creating sustainable livelihoods through mangrove-friendly aquaculture, eco-tourism, and sustainable harvesting of mangrove products.\n\n4. Biodiversity Conservation: Protecting critical habitat for 234 documented species, including the Bengal tiger and numerous endangered aquatic species.\n\nEach biodiversity credit represents both carbon sequestration and biodiversity protection metrics, validated under the Gold Standard.",
    project_updates: [
      {
        date: NOW - (DAY * 15),
        title: "Milestone: One Million Mangrove Seedlings Planted",
        content: "We are thrilled to announce that our community-based planting program has successfully planted over one million mangrove seedlings this season. Initial survival rates are exceeding 85%, significantly above our targets. This achievement represents a major step toward our restoration goals.",
        author: "Dr. Amina Rahman, Project Director"
      },
      {
        date: NOW - (DAY * 45),
        title: "New Aquaculture Training Program Launched",
        content: "In partnership with local universities, we have launched a comprehensive training program for sustainable aquaculture practices that complement mangrove ecosystems. 150 community members are participating in the initial cohort, with focus on techniques that improve yield while maintaining ecosystem integrity.",
        author: "Farhan Ahmed, Community Development Manager"
      }
    ],
    security_details: {
      token_standard: "ERC-1155",
      contract_address: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
      blockchain: "Ethereum",
      token_id: "6",
      marketplace_url: "/marketplace"
    }
  },
  {
    asset_id: "0x5f0f0e0d0c0b0a09080706050403020100000007",
    asset_type: "WaterCredit",
    standard: "Gold Standard",
    vintage_year: 2023,
    project_id: "GS-234567",
    project_name: "Highland Watershed Protection Initiative",
    project_location: "Quito, Ecuador",
    country: "Ecuador",
    verification_status: "Verified",
    verification_date: NOW - (DAY * 45),
    total_supply: "180000",
    available_supply: "160000",
    description: "The Highland Watershed Protection Initiative safeguards critical water sources that supply drinking water to over 2 million people in Quito, Ecuador. The project protects high-altitude páramo ecosystems and cloud forests that capture, filter, and regulate water flow.",
    price_per_unit: "22.80",
    change_24h: "+3.2%",
    image_url: "/images/assets/highland-watershed.jpg",
    impact_metrics: {
      carbon_offset_tons: 180000,
      land_area_protected_hectares: 24000,
      water_protected_liters: 32000000000,
      third_party_verifier: "DNV GL",
      biodiversity_species_protected: 189,
      local_communities_supported: 15,
      jobs_created: 125,
      sdg_alignment: {
        "6": 0.95,  // Clean Water and Sanitation
        "13": 0.80, // Climate Action
        "15": 0.85, // Life on Land
        "1": 0.65,  // No Poverty
        "3": 0.75   // Good Health and Well-being
      }
    },
    region: "Andes Mountains",
    coordinates: {
      latitude: -0.1807,
      longitude: -78.4678
    },
    registry_link: "https://registry.goldstandard.org/projects/details/234567",
    issuance_date: NOW - (DAY * 55),
    expiration_date: NOW + (DAY * 365 * 6), // 6 years from now
    project_developer: "FONAG (Quito Water Fund)",
    methodology: "GS Water Benefit Standard v2.0",
    methodology_details: "The Gold Standard Water Benefit methodology quantifies improvements in water quality, quantity, and access. It incorporates rigorous baseline assessment, monitoring protocols, and verification standards to ensure real water security outcomes.",
    co_benefits: [
      "Clean drinking water access",
      "Flood risk reduction",
      "Biodiversity conservation",
      "Climate change adaptation",
      "Indigenous community support",
      "Sustainable agriculture development",
      "Environmental education"
    ],
    risks: [
      {
        name: "Climate change impacts",
        description: "Changing precipitation patterns could affect páramo ecosystem function",
        severity: "Medium"
      },
      {
        name: "Agricultural pressure",
        description: "Expanding high-altitude agriculture threatens conservation agreements",
        severity: "Medium"
      },
      {
        name: "Policy changes",
        description: "Changes to Ecuador's water governance framework could impact project structure",
        severity: "Low"
      }
    ],
    certification_documents: [
      { name: "Project Design Document", url: "#pdd", type: "PDF", size_kb: 4120 },
      { name: "Water Benefit Calculation", url: "#water-benefits", type: "PDF", size_kb: 1850 },
      { name: "Validation Report", url: "#validation", type: "PDF", size_kb: 2350 },
      { name: "Monitoring Protocol", url: "#monitoring", type: "PDF", size_kb: 2750 },
      { name: "Stakeholder Consultation", url: "#stakeholders", type: "PDF", size_kb: 1650 }
    ],
    long_description: "The Highland Watershed Protection Initiative is a pioneering water security and conservation project focused on the high-altitude ecosystems surrounding Quito, Ecuador. The project protects and restores 24,000 hectares of páramo grasslands and cloud forests that serve as natural water infrastructure for the capital city and surrounding communities.\n\nThese unique high-altitude ecosystems function as natural water towers - capturing moisture from clouds and fog, gradually releasing it into streams and rivers, and filtering it to exceptional purity. However, they face significant threats from agricultural expansion, burning for livestock grazing, and climate change.\n\nKey project elements include:\n\n1. Ecosystem Protection: Establishing conservation agreements with private landowners and communities to protect intact páramo and cloud forest habitats.\n\n2. Restoration Activities: Implementing reforestation and ecological restoration in degraded areas, focusing on native species that enhance water regulation functions.\n\n3. Sustainable Livelihoods: Developing alternative income sources for local communities that align with ecosystem conservation, including sustainable agriculture, ecotourism, and handicrafts.\n\n4. Water Fund Management: Operating a dedicated water fund that collects payments from downstream water users to finance upstream conservation activities.\n\nEach water credit represents the protection of 200,000 liters of clean water supply annually, along with associated carbon sequestration and biodiversity benefits. The project is validated under the Gold Standard with specialized water benefit metrics.",
    project_updates: [
      {
        date: NOW - (DAY * 10),
        title: "Water Quality Monitoring Network Expansion",
        content: "We have completed the installation of 25 additional automated water quality and flow monitoring stations throughout the project area. This expanded network provides real-time data on water quality parameters and enables faster response to potential threats.",
        author: "Dr. Carlos Mendez, Technical Director"
      },
      {
        date: NOW - (DAY * 60),
        title: "Community Conservation Agreement Milestone",
        content: "We are pleased to announce the signing of conservation agreements with five additional communities, bringing the total protected area to 24,000 hectares. These agreements include innovative benefit-sharing mechanisms that ensure communities receive direct economic benefits from watershed protection.",
        author: "Lucia Torres, Community Relations Manager"
      }
    ],
    security_details: {
      token_standard: "ERC-1155",
      contract_address: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
      blockchain: "Ethereum",
      token_id: "7",
      marketplace_url: "/marketplace"
    }
  },
  {
    asset_id: "0x5f0f0e0d0c0b0a09080706050403020100000008",
    asset_type: "RenewableEnergyCertificate",
    standard: "I-REC",
    vintage_year: 2023,
    project_id: "I-REC-345678",
    project_name: "Moroccan Solar Thermal Power Generation",
    project_location: "Ouarzazate, Morocco",
    country: "Morocco",
    verification_status: "Verified",
    verification_date: NOW - (DAY * 30),
    total_supply: "650000",
    available_supply: "580000",
    description: "The Moroccan Solar Thermal Power Generation project is one of the world's largest concentrated solar power (CSP) complexes. Located in Morocco's Sahara Desert, this innovative facility combines solar thermal technology with molten salt energy storage to provide clean, reliable power even after sunset.",
    price_per_unit: "16.75",
    change_24h: "+1.2%",
    image_url: "/images/assets/morocco-solar.jpg",
    impact_metrics: {
      carbon_offset_tons: 580000,
      land_area_protected_hectares: 3000,
      renewable_energy_mwh: 650000,
      water_protected_liters: 150000000,
      third_party_verifier: "TÜV Rheinland",
      jobs_created: 450,
      sdg_alignment: {
        "7": 0.98,  // Affordable and Clean Energy
        "13": 0.90, // Climate Action
        "8": 0.85,  // Decent Work and Economic Growth
        "9": 0.80,  // Industry, Innovation and Infrastructure
        "6": 0.65   // Clean Water and Sanitation
      }
    },
    region: "Drâa-Tafilalet",
    coordinates: {
      latitude: 30.9298,
      longitude: -6.8914
    },
    registry_link: "https://registry.irecstandard.org/projects/I-REC-345678",
    issuance_date: NOW - (DAY * 40),
    expiration_date: NOW + (DAY * 365 * 2), // 2 years from now
    project_developer: "MASEN (Moroccan Agency for Sustainable Energy)",
    methodology: "I-REC Standard for Renewable Energy",
    methodology_details: "The I-REC Standard provides a robust framework for tracking renewable energy generation from production to consumption or retirement. It ensures each certificate represents 1 MWh of verified renewable energy and prevents double-counting through a central registry system.",
    co_benefits: [
      "Energy independence",
      "Technology transfer",
      "Job creation",
      "Local economic development",
      "Grid stability improvement",
      "Water conservation technology",
      "Desert ecosystem protection"
    ],
    risks: [
      {
        name: "Technology performance",
        description: "Innovative CSP technology may have operational challenges in harsh desert environment",
        severity: "Low"
      },
      {
        name: "Water availability",
        description: "While designed for minimal water use, the system still requires water for operation in an arid region",
        severity: "Medium"
      },
      {
        name: "Political stability",
        description: "Long-term energy policy changes could affect project economics",
        severity: "Low"
      }
    ],
    certification_documents: [
      { name: "Technical Specification", url: "#specifications", type: "PDF", size_kb: 3750 },
      { name: "Grid Connection Agreement", url: "#grid", type: "PDF", size_kb: 1450 },
      { name: "Verification Report", url: "#verification", type: "PDF", size_kb: 2250 },
      { name: "Environmental Impact Assessment", url: "#eia", type: "PDF", size_kb: 4850 },
      { name: "Community Benefit Plan", url: "#community", type: "PDF", size_kb: 1950 }
    ],
    long_description: "The Moroccan Solar Thermal Power Generation project represents a landmark achievement in renewable energy infrastructure. Located in Ouarzazate, on the edge of the Sahara Desert, this massive concentrated solar power (CSP) complex harnesses Morocco's abundant sunshine to generate clean electricity while contributing to the country's energy independence and climate goals.\n\nUnlike conventional photovoltaic solar panels, this facility uses thousands of mirrors (heliostats) to concentrate sunlight onto receivers containing a heat transfer fluid. This generates temperatures exceeding 500°C, producing steam that drives turbines to generate electricity. Critically, the system incorporates molten salt thermal energy storage, allowing it to continue generating power for up to 7.5 hours after sunset—addressing one of renewable energy's key challenges.\n\nKey project elements include:\n\n1. Clean Energy Generation: Producing 650,000 MWh of renewable electricity annually, enough to power approximately 600,000 homes.\n\n2. Advanced Storage Technology: Pioneering thermal energy storage systems that enable dispatchable renewable energy to match peak demand periods.\n\n3. Carbon Displacement: Reducing CO2 emissions by 580,000 tons annually by replacing fossil fuel electricity generation.\n\n4. Local Economic Development: Creating 450 permanent jobs and over 2,500 jobs during construction, with specialized training programs for local communities.\n\nEach renewable energy certificate (REC) represents 1 MWh of clean electricity generation, validated under the I-REC Standard with full chain-of-custody tracking.",
    project_updates: [
      {
        date: NOW - (DAY * 5),
        title: "Phase III Expansion Begins Construction",
        content: "Construction has officially begun on the 200MW Phase III expansion of the solar complex. This addition will incorporate next-generation heliostat technology with improved efficiency and reduced water consumption. The expansion is expected to be operational within 24 months.",
        author: "Mohamed Bennani, Project Director"
      },
      {
        date: NOW - (DAY * 50),
        title: "Energy Storage Capacity Upgrade Completed",
        content: "We have successfully completed the upgrade of our thermal energy storage system, increasing storage capacity from 5 hours to 7.5 hours of full-load generation. This enhancement significantly improves our ability to deliver renewable energy during evening peak demand periods.",
        author: "Dr. Fatima El Mansouri, Technical Operations Manager"
      }
    ],
    security_details: {
      token_standard: "ERC-1155",
      contract_address: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
      blockchain: "Ethereum",
      token_id: "8",
      marketplace_url: "/marketplace"
    }
  }
]; 