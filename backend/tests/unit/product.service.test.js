'use strict';

const productService = require('../../src/modules/products/product.service');
const productRepository = require('../../src/database/repositories/product.repository');
const categoryRepository = require('../../src/database/repositories/category.repository');

jest.mock('../../src/database/repositories/product.repository');
jest.mock('../../src/database/repositories/category.repository');

describe('productService', () => {
  afterEach(() => jest.clearAllMocks());

  describe('getAllProducts', () => {
    it('returns all products', async () => {
      const rows = [{ id: 1, product_name: 'Laptop', category: { id: 1, category_name: 'Electronics' } }];
      productRepository.findAll.mockResolvedValue(rows);

      const result = await productService.getAllProducts();

      expect(productRepository.findAll).toHaveBeenCalledTimes(1);
      expect(result).toEqual(rows);
    });
  });

  describe('getProductById', () => {
    it('returns the product when found', async () => {
      const row = { id: 1, product_name: 'Laptop' };
      productRepository.findById.mockResolvedValue(row);

      const result = await productService.getProductById(1);

      expect(result).toEqual(row);
    });

    it('throws 404 when not found', async () => {
      productRepository.findById.mockResolvedValue(null);

      await expect(productService.getProductById(99)).rejects.toMatchObject({
        message: 'Product not found.',
        statusCode: 404,
      });
    });
  });

  describe('createProduct', () => {
    it('creates the product when the category exists', async () => {
      const payload = { product_name: 'Laptop', unit_price: 999.99, category_id: 1 };
      const created = { id: 1, ...payload };
      categoryRepository.findById.mockResolvedValue({ id: 1, category_name: 'Electronics' });
      productRepository.create.mockResolvedValue(created);

      const result = await productService.createProduct(payload);

      expect(categoryRepository.findById).toHaveBeenCalledWith(1);
      expect(productRepository.create).toHaveBeenCalledWith(payload);
      expect(result).toEqual(created);
    });

    it('throws 404 when category_id does not exist, without creating the product', async () => {
      const payload = { product_name: 'Laptop', unit_price: 999.99, category_id: 999 };
      categoryRepository.findById.mockResolvedValue(null);

      await expect(productService.createProduct(payload)).rejects.toMatchObject({
        message: 'Category not found.',
        statusCode: 404,
      });
      expect(productRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('updateProduct', () => {
    it('updates and returns the refreshed row', async () => {
      const before = { id: 1, product_name: 'Old' };
      const after = { id: 1, product_name: 'New' };
      productRepository.findById.mockResolvedValueOnce(before).mockResolvedValueOnce(after);
      productRepository.update.mockResolvedValue([1]);

      const result = await productService.updateProduct(1, { product_name: 'New' });

      expect(categoryRepository.findById).not.toHaveBeenCalled();
      expect(result).toEqual(after);
    });

    it('throws 404 when the product is not found', async () => {
      productRepository.findById.mockResolvedValue(null);

      await expect(productService.updateProduct(99, {})).rejects.toMatchObject({ statusCode: 404 });
      expect(productRepository.update).not.toHaveBeenCalled();
    });

    it('validates category_id when provided, throwing 404 if the category does not exist', async () => {
      productRepository.findById.mockResolvedValue({ id: 1 });
      categoryRepository.findById.mockResolvedValue(null);

      await expect(productService.updateProduct(1, { category_id: 999 })).rejects.toMatchObject({
        message: 'Category not found.',
        statusCode: 404,
      });
      expect(productRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('deleteProduct', () => {
    it('calls destroy when found', async () => {
      productRepository.findById.mockResolvedValue({ id: 1 });
      productRepository.destroy.mockResolvedValue(1);

      await productService.deleteProduct(1);

      expect(productRepository.destroy).toHaveBeenCalledWith(1);
    });

    it('throws 404 when not found', async () => {
      productRepository.findById.mockResolvedValue(null);

      await expect(productService.deleteProduct(99)).rejects.toMatchObject({ statusCode: 404 });
      expect(productRepository.destroy).not.toHaveBeenCalled();
    });
  });
});
