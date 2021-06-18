// Write your tests here
require('dotenv').config();
const db = require('../data/dbConfig');
const server = require('../api/server');
const request = require('supertest');
const data = require('../api/jokes/jokes-data');

test('sanity', () => {
  expect(true).not.toBe(false);
});

test('process.env.NODE_ENV = testing', () => {
  expect(process.env.NODE_ENV).toBe('testing');
});

test('process.env.PORT = 5000', () => {
  expect(process.env.PORT).toBe('5000');
});

test('process.env.JWT_SECRET = shh', () => {
  expect(process.env.JWT_SECRET).toBe('shh');
});

beforeAll(async () => {
  await db.migrate.rollback();
  await db.migrate.latest();
});

// beforeEach(async () => {
//   await db.seed.run();
// });

afterAll(async () => {
  await db.destroy();
});

describe('POST / (Register)', () => {
  it('Valid Registration (201)', () => {
    return request(server).post('/api/auth/register')
      .send({ username: 'Test', password: '1234' })
      .expect(201)
      .expect('Content-Type', /json/)
      .expect('Content-Length', '100')
      .then(({ body }) => {
        expect(body.id).toBe(1);
        expect(body.username).toBe('Test');
        expect(body.password.length).toBe(60);
      });
  });
  it('Invalid Registration - Empty Body (400)', () => {
    return request(server).post('/api/auth/register')
      .send({})
      .expect(400)
      .expect('Content-Type', /json/)
      .expect('Content-Length', '44')
      .then(({ body }) => {
        expect(body).toHaveProperty('message', 'username and password required');
      });
  });
  it('Invalid Registration - Empty Username (400)', () => {
    return request(server).post('/api/auth/register')
      .send({ password: '1234' })
      .expect(400)
      .expect('Content-Type', /json/)
      .expect('Content-Length', '44')
      .then(({ body }) => {
        expect(body).toHaveProperty('message', 'username and password required');
      });
  });
  it('Invalid Registration - Empty Password (400)', () => {
    return request(server).post('/api/auth/register')
      .send({ username: 'Test' })
      .expect(400)
      .expect('Content-Type', /json/)
      .expect('Content-Length', '44')
      .then(({ body }) => {
        expect(body).toHaveProperty('message', 'username and password required');
      });
  });
  it('Invalid Registration - Taken Username (422)', async () => {
    await request(server).post('/api/auth/register')
      .send({ username: 'Test', password: '1234' });
    return request(server).post('/api/auth/register')
      .send({ username: 'Test', password: '1234' })
      .expect(422)
      .expect('Content-Type', /json/)
      .expect('Content-Length', '28')
      .then(({ body }) => {
        expect(body).toHaveProperty('message', 'username taken');
      });
  });
});

describe('POST / (Login)', () => {
  it('Valid Login (200)', async () => {
    return request(server).post('/api/auth/login')
      .send({ username: 'Test', password: '1234' })
      .expect(200)
      .expect('Content-Type', /json/)
      .expect('Content-Length', '206')
      .then(({ body }) => {
        expect(body.message).toBe('welcome, Test');
        expect(body.token.length).toBe(168);
      });
  });
  it('Invalid Login - Empty Body (400)', () => {
    return request(server).post('/api/auth/login')
      .send({})
      .expect(400)
      .expect('Content-Type', /json/)
      .expect('Content-Length', '44')
      .then(({ body }) => {
        expect(body).toHaveProperty('message', 'username and password required');
      });
  });
  it('Invalid Login - Empty Username (400)', () => {
    return request(server).post('/api/auth/login')
      .send({ password: '1234' })
      .expect(400)
      .expect('Content-Type', /json/)
      .expect('Content-Length', '44')
      .then(({ body }) => {
        expect(body).toHaveProperty('message', 'username and password required');
      });
  });
  it('Invalid Login - Empty Password (400)', () => {
    return request(server).post('/api/auth/login')
      .send({ username: 'Test' })
      .expect(400)
      .expect('Content-Type', /json/)
      .expect('Content-Length', '44')
      .then(({ body }) => {
        expect(body).toHaveProperty('message', 'username and password required');
      });
  });
  it('Invalid Login - Wrong Username (401)', () => {
    return request(server).post('/api/auth/login')
      .send({ username: 'Tests', password: '1234' })
      .expect(401)
      .expect('Content-Type', /json/)
      .expect('Content-Length', '33')
      .then(({ body }) => {
        expect(body).toHaveProperty('message', 'invalid credentials');
      });
  });
  it('Invalid Login - Wrong Password (401)', () => {
    return request(server).post('/api/auth/login')
      .send({ username: 'Test', password: '12345' })
      .expect(401)
      .expect('Content-Type', /json/)
      .expect('Content-Length', '33')
      .then(({ body }) => {
        expect(body).toHaveProperty('message', 'invalid credentials');
      });
  });
});

describe('GET / (Restricted)', () => {
  it('Authorization - User Jokes (200)', async () => {
    const token = (await request(server).post('/api/auth/login').send({ username: 'Test', password: '1234' })).body.token;
    return request(server).get('/api/jokes')
      .set('Authorization', token)
      .expect(200)
      .expect('Content-Type', /json/)
      .expect('Content-Length', '349')
      .then(({ body }) => {
        expect(body).toMatchObject(data);
      });
  });
  it('Authorization - Token Required (401)', () => {
    return request(server).get('/api/jokes')
      .set('Authorization', '')
      .expect(401)
      .expect('Content-Type', /json/)
      .expect('Content-Length', '28')
      .then(({ body }) => {
        expect(body).toHaveProperty('message', 'token required');
      });
  });
  it('Authorization - Token Invalid (401)', () => {
    return request(server).get('/api/jokes')
      .set('Authorization', 'fake')
      .expect(401)
      .expect('Content-Type', /json/)
      .expect('Content-Length', '27')
      .then(({ body }) => {
        expect(body).toHaveProperty('message', 'token invalid');
      });
  });
});
