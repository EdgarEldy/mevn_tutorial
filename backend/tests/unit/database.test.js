'use strict';

function loadDatabase(nodeEnv) {
  jest.resetModules();
  jest.doMock('../../src/config/env', () => ({
    nodeEnv,
    db: {
      name: 'mevn_db',
      nameTest: 'mevn_db_test',
      username: 'root',
      password: '',
      host: '127.0.0.1',
      port: 3306,
      dialect: 'mysql',
    },
  }));
  // eslint-disable-next-line global-require
  return require('../../src/config/database');
}

describe('config/database', () => {
  afterEach(() => {
    jest.resetModules();
    jest.dontMock('../../src/config/env');
  });

  it('connects to db.name outside of the test environment', () => {
    const sequelize = loadDatabase('development');
    expect(sequelize.getDatabaseName()).toBe('mevn_db');
  });

  it('connects to db.nameTest when NODE_ENV is test', () => {
    const sequelize = loadDatabase('test');
    expect(sequelize.getDatabaseName()).toBe('mevn_db_test');
  });
});
