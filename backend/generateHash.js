const bcrypt = require('bcryptjs');

async function makeHash() {
  const hash = await bcrypt.hash("password123", 10);
  console.log(hash);
}

makeHash();
