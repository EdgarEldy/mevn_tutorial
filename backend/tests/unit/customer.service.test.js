'use strict';

const customerService = require('../../src/modules/customers/customer.service');
const customerRepository = require('../../src/database/repositories/customer.repository');

jest.mock('../../src/database/repositories/customer.repository');

describe('customerService', () => {
  afterEach(() => jest.clearAllMocks());

  describe('getAllCustomers', () => {
    it('returns all customers', async () => {
      const rows = [{ id: 1, first_name: 'Alice' }];
      customerRepository.findAll.mockResolvedValue(rows);

      const result = await customerService.getAllCustomers();

      expect(customerRepository.findAll).toHaveBeenCalledTimes(1);
      expect(result).toEqual(rows);
    });
  });

  describe('getCustomerById', () => {
    it('returns the customer when found', async () => {
      const row = { id: 1, first_name: 'Alice' };
      customerRepository.findById.mockResolvedValue(row);

      const result = await customerService.getCustomerById(1);

      expect(result).toEqual(row);
    });

    it('throws 404 when not found', async () => {
      customerRepository.findById.mockResolvedValue(null);

      await expect(customerService.getCustomerById(99)).rejects.toMatchObject({
        message: 'Customer not found.',
        statusCode: 404,
      });
    });
  });

  describe('createCustomer', () => {
    it('delegates to the repository, including with an empty payload', async () => {
      const created = { id: 2, first_name: null, last_name: null, telephone: null, email: null, address: null };
      customerRepository.create.mockResolvedValue(created);

      const result = await customerService.createCustomer({});

      expect(customerRepository.create).toHaveBeenCalledWith({});
      expect(result).toEqual(created);
    });
  });

  describe('updateCustomer', () => {
    it('updates and returns the refreshed row', async () => {
      const before = { id: 1, first_name: 'Old' };
      const after = { id: 1, first_name: 'New' };
      customerRepository.findById.mockResolvedValueOnce(before).mockResolvedValueOnce(after);
      customerRepository.update.mockResolvedValue([1]);

      const result = await customerService.updateCustomer(1, { first_name: 'New' });

      expect(result).toEqual(after);
    });

    it('throws 404 when not found', async () => {
      customerRepository.findById.mockResolvedValue(null);

      await expect(customerService.updateCustomer(99, {})).rejects.toMatchObject({ statusCode: 404 });
      expect(customerRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('deleteCustomer', () => {
    it('calls destroy when found', async () => {
      customerRepository.findById.mockResolvedValue({ id: 1 });
      customerRepository.destroy.mockResolvedValue(1);

      await customerService.deleteCustomer(1);

      expect(customerRepository.destroy).toHaveBeenCalledWith(1);
    });

    it('throws 404 when not found', async () => {
      customerRepository.findById.mockResolvedValue(null);

      await expect(customerService.deleteCustomer(99)).rejects.toMatchObject({ statusCode: 404 });
      expect(customerRepository.destroy).not.toHaveBeenCalled();
    });
  });
});
