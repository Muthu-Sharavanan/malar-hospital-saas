async function testRegistry() {
  const baseUrl = 'http://localhost:3001/api';
  
  console.log("--- Testing Patient Registration & Registry ---");

  // 1. Register a new patient
  const p1 = {
    name: 'Registry Test Patient',
    phone: '9988776655',
    age: '30',
    gender: 'Female',
    address: '123 Registry Lane',
    doctorId: 'clzt2j8v00000ux1g8v000000', // Need a valid ID, or let the API handle it if it picks a default
    tokenNumber: '201'
  };

  // First, let's find a valid doctor ID
  const usersRes = await fetch(`${baseUrl}/users?role=DOCTOR`);
  const usersData = await usersRes.json();
  if (!usersData.success || usersData.users.length === 0) {
    console.error("No doctors found for testing");
    return;
  }
  p1.doctorId = usersData.users[0].id;

  console.log("1. Registering new patient...");
  const reg1Res = await fetch(`${baseUrl}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(p1)
  });
  const reg1Data = await reg1Res.json();
  if (reg1Data.success) {
    console.log(`✅ Success! Patient: ${reg1Data.visit.patient.name}, UHID: ${reg1Data.visit.patient.uhid}, Visit ID: ${reg1Data.visit.id}`);
  } else {
    console.error("❌ Registration failed:", reg1Data.error);
    return;
  }

  // 2. Search for the patient
  console.log(`\n2. Searching for patient by phone: ${p1.phone}...`);
  const searchRes = await fetch(`${baseUrl}/patients?q=${p1.phone}`);
  const searchData = await searchRes.json();
  if (searchData.success && searchData.patients.length > 0) {
    const found = searchData.patients[0];
    console.log(`✅ Found! Name: ${found.name}, UHID: ${found.uhid}`);
  } else {
    console.error("❌ Search failed or patient not found");
    return;
  }

  // 3. Register the same patient again (different visit)
  console.log("\n3. Registering again (returning visit)...");
  const p2 = { ...p1, tokenNumber: '202' };
  const reg2Res = await fetch(`${baseUrl}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(p2)
  });
  const reg2Data = await reg2Res.json();
  if (reg2Data.success) {
    console.log(`✅ Success! Visit ID: ${reg2Data.visit.id}`);
    if (reg2Data.visit.patient.uhid === reg1Data.visit.patient.uhid) {
      console.log("✅ LIFELONG TRACKING VERIFIED: Same UHID matched.");
    } else {
      console.error("❌ LIFELONG TRACKING FAILED: Different UHID generated.");
    }
  } else {
    console.error("❌ Second registration failed:", reg2Data.error);
  }
}

testRegistry();
