'use strict';

// Sequelize's belongsToMany association expects createdAt/updatedAt columns on the
// through table by default. Omitting them breaks user.addRole(roleId) with
// "Unknown column 'createdAt' in 'field list'" on every single registration -
// get this right on the very first migration (see README's Implementation lessons).
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('role_user', {
      user_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      role_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: { model: 'roles', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('role_user');
  },
};
