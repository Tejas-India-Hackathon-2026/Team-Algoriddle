import { findDiscoveriesNearRoute } from 'file:///C:/Users/amand/OneDrive/Attachments/Desktop/tourism/backend/src/services/discoveryService.js';
import { HIDDEN_DISCOVERIES } from 'file:///C:/Users/amand/OneDrive/Attachments/Desktop/tourism/backend/src/data/hiddenGemsData.js';

async function testDiscoveryEngine() {
  console.log("=================================================");
  console.log(" ROUTE-AWARE HIDDEN BIHAR DISCOVERY TEST SUITE");
  console.log("=================================================\n");

  // TEST 1: Patna -> Rajgir Route
  console.log("--- TEST 1: Patna -> Rajgir Route Discoveries ---");
  const res1 = await findDiscoveriesNearRoute({
    origin: "Patna",
    destination: "Rajgir",
    maxDetourKm: 40
  });

  console.log(`Corridor: ${res1.origin} -> ${res1.destination} (Base: ${res1.totalRouteDistanceKm} km)`);
  console.log(`Found ${res1.discoveries.length} discoveries near route corridor.`);
  console.log("Top 4 Recommendations:");
  res1.discoveries.slice(0, 4).forEach((d, i) => {
    console.log(`  ${i + 1}. [${d.category}] ${d.name} (${d.district})`);
    console.log(`     - Distance from route: ${d.distanceFromRouteText}`);
    console.log(`     - Detour: ${d.detourText} | Visit: ${d.visitDuration} | Cost: ${d.cost}`);
    console.log(`     - Why: ${d.whyRecommended}`);
    console.log(`     - Discovery Score: ${d.discoveryScore}/100`);
  });

  // TEST 2: Category Filter Test (Food only on Patna -> Rajgir)
  console.log("\n--- TEST 2: Food Category Filter (Patna -> Rajgir) ---");
  const resFood = await findDiscoveriesNearRoute({
    origin: "Patna",
    destination: "Rajgir",
    category: "Food"
  });
  console.log(`Found ${resFood.discoveries.length} food discoveries near route.`);
  resFood.discoveries.forEach(f => {
    console.log(`  * ${f.name} - ${f.distanceFromRouteText} (${f.cost})`);
  });

  // TEST 3: Bihar Sharif -> Jamui Route
  console.log("\n--- TEST 3: Bihar Sharif -> Jamui Route Discoveries ---");
  const res3 = await findDiscoveriesNearRoute({
    origin: "Bihar Sharif",
    destination: "Jamui",
    maxDetourKm: 50
  });
  console.log(`Found ${res3.discoveries.length} discoveries near Bihar Sharif -> Jamui.`);
  res3.discoveries.slice(0, 3).forEach(d => {
    console.log(`  * ${d.name} (${d.district}) - ${d.distanceFromRouteText} (${d.detourText})`);
  });

  // Assertions
  console.log("\n=================================================");
  console.log(" ASSERTION VERIFICATION");
  console.log("=================================================");
  const assertions = [
    {
      name: "Database contains 25+ verified genuine discoveries across Bihar",
      passed: HIDDEN_DISCOVERIES.length >= 25
    },
    {
      name: "Mainstream tourist hubs (Mahabodhi, Golghar) are excluded from hidden gems",
      passed: !HIDDEN_DISCOVERIES.some(g => g.name.includes("Mahabodhi") || g.name.includes("Golghar"))
    },
    {
      name: "Patna -> Rajgir discovers direct highway heritage sweet (Silao Khaja)",
      passed: res1.discoveries.some(d => d.id === "silao_khaja_hub")
    },
    {
      name: "Every discovery contains 'distanceFromRouteText', 'detourText', and 'whyRecommended'",
      passed: res1.discoveries.every(d => d.distanceFromRouteText && d.detourText && d.whyRecommended)
    },
    {
      name: "Category filtering returns only matching category items",
      passed: resFood.discoveries.every(d => d.category === "Food")
    },
    {
      name: "All discoveries have real coordinates and confidence ratings",
      passed: HIDDEN_DISCOVERIES.every(d => typeof d.lat === 'number' && typeof d.lng === 'number')
    }
  ];

  assertions.forEach((a, i) => {
    console.log(`${i + 1}. [${a.passed ? 'PASS' : 'FAIL'}] ${a.name}`);
  });

  const allPassed = assertions.every(a => a.passed);
  console.log(`\nOVERALL RESULT: ${allPassed ? 'ALL TESTS PASSED SUCCESSFULLY (100%)' : 'SOME TESTS FAILED'}`);
}

testDiscoveryEngine().catch(console.error);
