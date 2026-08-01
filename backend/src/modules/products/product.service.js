'use strict';

const productRepository = require('../../database/repositories/product.repository');
const categoryRepository = require('../../database/repositories/category.repository');

const getAllProducts = () => productRepository.findAll();

const getProductById = async (id) => {
  const product = await productRepository.findById(id);
  if (!product) {
    const err = new Error('Product not found.');
    err.statusCode = 404;
    throw err;
  }
  return product;
};

const assertCategoryExists = async (categoryId) => {
  const category = await categoryRepository.findById(categoryId);
  if (!category) {
    const err = new Error('Category not found.');
    err.statusCode = 404;
    throw err;
  }
};

const createProduct = async (data) => {
  await assertCategoryExists(data.category_id);
  return productRepository.create(data);
};

const updateProduct = async (id, data) => {
  await getProductById(id);
  if (data.category_id !== undefined) {
    await assertCategoryExists(data.category_id);
  }
  await productRepository.update(id, data);
  return productRepository.findById(id);
};

const deleteProduct = async (id) => {
  await getProductById(id);
  return productRepository.destroy(id);
};

module.exports = { getAllProducts, getProductById, createProduct, updateProduct, deleteProduct };
