const express = require('express');
const cors = require('cors');
const errorMiddleware = require('./middlewares/error.middleware');
const { success, error } = require('./shared/utils/apiResponse');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const v1 = express.Router();
v1.use('/categories', require('./modules/categories/category.routes'));
v1.use('/products', require('./modules/products/product.routes'));
v1.use('/customers', require('./modules/customers/customer.routes'));
v1.use('/orders', require('./modules/orders/order.routes'));
app.use('/api/v1', v1);
// server.js mounts the GraphQL middleware on this router (v1.use('/graphql', ...))
// after Apollo Server finishes its async start(). Routers are mutable middleware
// stacks evaluated per-request, so a route added here after app.use('/api/v1', v1)
// still gets matched before the catch-all 404 below - only routes added directly
// on `app` after this point would be shadowed by it.
app.v1 = v1;

app.get('/', (req, res) => {
  success(res, { message: 'MEVN Tutorial API is running.' });
});

app.use((req, res) => {
  error(res, { statusCode: 404, message: 'Not found.' });
});

app.use(errorMiddleware);

module.exports = app;
