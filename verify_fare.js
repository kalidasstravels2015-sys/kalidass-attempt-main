
const tariffConfig = {
  "vehicles": {
    "Swift Dzire": {
      "round_trip_rate": 14,
      "one_way_rate": 16,
      "min_km_per_day": 250,
      "driver_bata": 300,
      "min_drop_km": 130
    }
  }
};

function calculate(activeTab, vehicle, distance, days) {
  const vehicleData = tariffConfig.vehicles[vehicle];
  let totalCost = 0;
  const rate = activeTab === 'round' ? vehicleData.round_trip_rate : vehicleData.one_way_rate;
  const bata = vehicleData.driver_bata;

  if (activeTab === 'round') {
    const minKm = (days || 1) * vehicleData.min_km_per_day;
    const actualRoundTripKm = distance * 2;
    const chargeableKm = Math.max(minKm, actualRoundTripKm);
    totalCost = (chargeableKm * rate) + ((days || 1) * bata);
  } else {
    const minDropKm = vehicleData.min_drop_km || 130;
    const chargeableKm = Math.max(minDropKm, distance);
    totalCost = (chargeableKm * rate) + bata;
  }
  return Math.round(totalCost / 10) * 10;
}

console.log("ROUND_TRIP_SEDAN_500KM_2DAYS: Expected 7600, Result: " + calculate('round', 'Swift Dzire', 250, 2));
console.log("ONE_WAY_SEDAN_100KM: Expected 2380, Result: " + calculate('oneway', 'Swift Dzire', 100, 1));
