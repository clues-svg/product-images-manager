const { sequelize } = require('../src/database/database');

async function inspect() {
  try {
    const [results, metadata] = await sequelize.query("DESCRIBE tags");
    console.log(JSON.stringify(results, null, 2));
  } catch (error) {
    console.error(error);
  } finally {
    await sequelize.close();
  }
}

inspect();
