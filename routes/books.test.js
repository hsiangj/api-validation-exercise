process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../app');
const db = require('../db');

let bookISBN;

beforeEach(async () =>{
  let result = await db.query(`
  INSERT INTO books (isbn, amazon_url,author,language,pages,publisher,title,year)
  VALUES(
      '123432122',
      'https://amazon.com/taco',
      'Elie',
      'English',
      100,
      'Nothing publishers',
      'my first book', 2008)
  RETURNING isbn`);

  bookISBN = result.rows[0].isbn;

});

describe('GET /books', () => {
  test('Get a list of one book', async () => {
    const res = await request(app).get('/books');
    const books = res.body.books;
    expect(res.statusCode).toBe(200);
    expect(books).toHaveLength(1);
    expect(books[0]).toHaveProperty('isbn');
  })
})

describe('/GET /books/:isbn', () => {
  test('Get a single book', async () => {
    const res = await request(app).get(`/books/${bookISBN}`);
    const book = res.body.book;
    expect(res.statusCode).toBe(200);
    expect(book['isbn']).toBe(bookISBN);
  })
  test('Respond with 404 if book not found', async () => {
    const res = await request(app).get(`/books/123456`);
    expect(res.statusCode).toBe(404);
  })
})

describe('/POST /books', () => {
  test('Create a new book', async () => {
    const res = await request(app).post('/books').send({
      isbn: "0395927218",
      amazon_url: "https://amazon.com/namesake",
      author: "Jhumpa Lahiri",
      language: "english",
      pages: 291,
      publisher: "Houghton Mifflin",
      title: "Namesake",
      year: 2003
    })
    expect(res.statusCode).toBe(201);
    expect(res.body.book['isbn']).toBe('0395927218');
  })
  test('Respond with 400 if data body empty', async () => {
    const res = await request(app).post('/books').send({});
    expect(res.statusCode).toBe(400);
  })
  test('Respond with 400 if data body missing required title and year', async () => {
    const res = await request(app).post('/books').send({
      "isbn": "0691161518",
      "amazon_url": "http://a.co/eobPtX2",
      "author": "Matthew Lane",
      "language": "english",
      "pages": 264,
      "publisher": "Princeton University Press"   
  });
    expect(res.statusCode).toBe(400);
  })
})

describe('/PUT /books/:isbn', () => {
  test('Update a single book', async () => {
    const res = await request(app).put(`/books/${bookISBN}`).send({
        author: "Updated author",
        language: "Updated language",
        pages: 500,
        publisher: "Updated publisher",
        title: "Updated book title",
        year: 2017
    })
    expect(res.statusCode).toBe(200);
    expect(res.body.book['title']).toBe('Updated book title');
  })
  test('Respond with 400 isbn in data body', async () => {
    const res = await request(app).put(`/books/${bookISBN}`).send({
      isbn: "0691161518",
      amazon_url: "http://a.co/eobPtX2",
      author: "Matthew Lane",
      language: "english",
      pages: 264,
      publisher: "Princeton University Press",
      year: 2017   
    });
    expect(res.statusCode).toBe(400);
  })
  test('Respond with 404 if book not found', async () => {
    const res = await request(app).put(`/books/123456`).send({
      author: "Fake author",
      language: "Fake language",
      pages: 500,
      publisher: "Fake publisher",
      title: "Fake book title",
      year: 2017
  });
    expect(res.statusCode).toBe(404);
  })
})

describe('/DELETE /books/:isbn', () => {
  test('Delete a single book', async () => {
    const res = await request(app).delete(`/books/${bookISBN}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Book deleted');
  })
  test('Respond with 404 if book not found', async () => {
    const res = await request(app).delete(`/books/123456`);
    expect(res.statusCode).toBe(404);
  })
})


afterEach(async () => {
  await db.query(`DELETE FROM books`);
});

afterAll(async () => {
  await db.end();
});