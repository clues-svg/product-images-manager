require('dotenv').config();

const config = {
  app: {
    env: process.env.NODE_ENV || 'development',
    name: process.env.APP_NAME || 'ProductImagesManager',
    version: process.env.APP_VERSION || '0.1.0',
    port: parseInt(process.env.PORT, 10) || 3000
  },
  db: {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    database: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'default_jwt_secret',
    expiresIn: process.env.JWT_EXPIRE || '24h'
  },
  upload: {
    limit: process.env.UPLOAD_LIMIT || '10MB',
    dir: process.env.UPLOAD_DIR || './uploads'
  },
  cos: {
    secretId: process.env.COS_SECRET_ID,
    secretKey: process.env.COS_SECRET_KEY,
    region: process.env.COS_REGION,
    bucket: process.env.COS_BUCKET
  }
};

module.exports = config;