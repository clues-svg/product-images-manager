const { User } = require('../src/models');
const bcrypt = require('bcryptjs');
const { sequelize } = require('../src/database/database');

async function testLogin() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('Database connection successful.');

    const email = 'admin@example.com';
    const password = 'admin123'; // Or whatever password you want to test

    console.log(`Attempting to find user with email: ${email}`);
    const user = await User.findOne({ where: { email } });

    if (!user) {
      console.log('User not found.');
      return;
    }

    console.log('User found:', user.toJSON());
    console.log('Stored password hash:', user.password);

    console.log('Comparing passwords...');
    const isMatch = await bcrypt.compare(password, user.password);
    
    console.log(`Password match result: ${isMatch}`);

  } catch (error) {
    console.error('Error during login test:', error);
  } finally {
    await sequelize.close();
  }
}

testLogin();