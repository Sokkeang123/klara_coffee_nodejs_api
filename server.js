const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const app = express();
app.use(express.json());
app.use(cors());

// Swagger options
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Klara Coffee API',
      version: '1.0.0',
      description: 'API documentation for Klara Coffee project',
    },
    servers: [
      {
        url: 'http://localhost:5000',
      },
    ],
  },
  apis: ['./routes/*.js'], // path to your route files
};

const specs = swaggerJsdoc(options);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// Import routes
const authRoutes = require('./routes/auth');
const menuRoutes = require('./routes/menu');
const orderRoutes = require('./routes/order');

app.use('/api/auth', authRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);

app.get('/', (req, res) => {
  res.send('Klara Coffee API with MySQL is running...');
});

app.listen(5000, () => console.log('Server running on port 5000'));
