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
app.use('/api/v1', v1);

app.get('/', (req, res) => {
  success(res, { message: 'MEVN Tutorial API is running.' });
});

app.use((req, res) => {
  error(res, { statusCode: 404, message: 'Not found.' });
});

app.use(errorMiddleware);

module.exports = app;
