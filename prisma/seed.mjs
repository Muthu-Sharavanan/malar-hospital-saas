import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const users = [
    { name: 'Dr. Ramaswamy', email: 'ramaswamy@malar.com', password: 'password123', role: 'DOCTOR' },
    { name: 'Dr. Aravind', email: 'aravind@malar.com', password: 'password123', role: 'DOCTOR' },
    { name: 'Nurse Anitha', email: 'nurse@malar.com', password: 'password123', role: 'NURSE' },
    { name: 'Receptionist Susi', email: 'reception@malar.com', password: 'password123', role: 'RECEPTIONIST' },
    { name: 'Pharmacist Ravi', email: 'pharmacy@malar.com', password: 'password123', role: 'PHARMACIST' },
    { name: 'Lab Tech Kumar', email: 'lab@malar.com', password: 'password123', role: 'LAB_TECH' },
    { name: 'Admin Admin', email: 'admin@malar.com', password: 'password123', role: 'ADMIN' },
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: user,
    });
  }

  // Create Professional Demo Patients
  const patients = [
    { uhid: 'MH-10001', name: 'S. MEENAKSHI', age: 45, gender: 'Female', phone: '9840123456', address: '12th Cross, Anna Nagar, Thoothukudi' },
    { uhid: 'MH-10002', name: 'K. RAJESH KUMAR', age: 38, gender: 'Male', phone: '9443210987', address: 'Pearl City Beach Road, Thoothukudi' },
    { uhid: 'MH-10003', name: 'M. ABDUL RAHMAN', age: 29, gender: 'Male', phone: '9786543210', address: 'New Colony, Srivaikuntam' },
    { uhid: 'MH-10004', name: 'J. PRIYA DHARSHINI', age: 32, gender: 'Female', phone: '9123456789', address: 'EB Colony, Thoothukudi' },
    { uhid: 'MH-10005', name: 'P. BALASUBRAMANIAN', age: 62, gender: 'Male', phone: '9442001122', address: 'Tiruchendur Road, Thoothukudi' },
  ];

  console.log('Creating demo patients...');
  for (const p of patients) {
    await prisma.patient.upsert({
      where: { uhid: p.uhid },
      update: p,
      create: p,
    });
  }

  const ramaswamy = await prisma.user.findUnique({ where: { email: 'ramaswamy@malar.com' } });
  const meenakshi = await prisma.patient.findUnique({ where: { uhid: 'MH-10001' } });

  if (ramaswamy && meenakshi) {
    console.log('Creating historical visits...');
    // Create a historical visit to show history feature
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 15);

    const histVisit = await prisma.visit.create({
      data: {
        patientId: meenakshi.id,
        doctorId: ramaswamy.id,
        tokenNumber: 5,
        visitDate: oldDate,
        status: 'COMPLETED',
        chiefComplaints: 'Follow up for hypertension. Occasional dizziness.',
        diagnosis: 'Grade 1 Essential Hypertension',
        examination: 'BP 150/95. Lung clear. S1 S2 normal.',
        bloodPressure: '150/95',
        pulse: 82,
        weight: 68.5,
        assignedDoctorName: 'Dr. Ramaswamy'
      }
    });

    await prisma.prescription.create({
      data: {
        visitId: histVisit.id,
        drugName: 'Amlodipine 5mg',
        dosage: '0-0-1',
        duration: '30 days',
        instructions: 'Night after food',
        status: 'DISPENSED'
      }
    });
  }

  console.log('Seed successful: Professional demo data ready');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
