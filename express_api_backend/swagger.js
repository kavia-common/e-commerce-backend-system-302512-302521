const swaggerJSDoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'E-Commerce Express API',
      version: '1.1.0',
      description: 'E-commerce API with JWT auth, RBAC, products and orders'
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  },
  apis: ['./src/routes/*.ts'] // Scan TS route files for swagger JSDoc
};

const swaggerSpec = swaggerJSDoc(options);
module.exports = swaggerSpec;
