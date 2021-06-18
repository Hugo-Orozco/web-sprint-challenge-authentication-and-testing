const db = require('../../data/dbConfig');

function find() {
  return db('users');
}

function findBy(filter) {
  return db('users')
    .where(filter)
    .first();
}

function findById(id) {
  return db('users')
    .where({ id })
    .first();
}

function add(user) {
  return db('users')
    .insert(user)
    .then(ids => {
        return findById(ids[0]);
    });
}

module.exports = {
  add,
  find,
  findBy,
  findById,
};
