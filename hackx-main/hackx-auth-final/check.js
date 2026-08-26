const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
let uri = '';
env.split('\n').forEach(line => {
  if (line.startsWith('MONGODB_URI=')) uri = line.split('=')[1].trim();
});
if (uri.startsWith('"') && uri.endsWith('"')) uri = uri.slice(1, -1);

const mongoose = require('mongoose');

async function check() {
  await mongoose.connect(uri);
  
  const Pharmacist = mongoose.models.Pharmacist || mongoose.model("Pharmacist", new mongoose.Schema({}, { strict: false }));
  const user = await Pharmacist.findOne({ phone: "8591292159" });
  console.log("Found Pharmacist:", user);

  const Patient = mongoose.models.Patient || mongoose.model("Patient", new mongoose.Schema({}, { strict: false }));
  const p = await Patient.findOne({ phone: "8591292159" });
  console.log("Found Patient:", p);

  process.exit();
}
check();
