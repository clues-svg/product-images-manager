const { User } = require('../src/models');
const bcrypt = require('bcryptjs');
const { sequelize } = require('../src/database/database');

async function resetPassword() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    
    const email = 'admin@example.com';
    const newPassword = 'password123';
    
    console.log(`Resetting password for ${email} to ${newPassword}`);
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    const [updatedRows] = await User.update(
      { password: hashedPassword },
      { where: { email } }
    );
    
    if (updatedRows > 0) {
      console.log('Password updated successfully.');
    } else {
      console.log('User not found or password not updated.');
    }

  } catch (error) {
    console.error('Error resetting password:', error);
  } finally {
    await sequelize.close();
  }
}

resetPassword();