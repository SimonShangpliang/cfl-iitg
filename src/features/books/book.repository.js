import { getDB } from "../../config/mongodb.js";

export default class BooksRepository {
  async addBook(book) {
    try {
      const db = getDB();
      const collection = db.collection("books");
      await collection.insertOne(book);
    } catch (err) {
      return err;
    }
  }

  async getAllBooks() {
    try {
      const db = getDB();
      const collection = db.collection("books");
      return await collection.find({}).toArray();
    } catch (err) {
      return err;
    }
  }

  async findBook(bookId) {
    try {
      const db = getDB();
      const collection = db.collection("books");
      return await collection.findOne({ _id: bookId });
    } catch (err) {
      return err;
    }
  }

  async updateBook(book) {
    try {
      const db = getDB();
      const collection = db.collection("books");
      collection.updateOne(
        { _id: book._id },
        {
          $set: {
            name: book.name,
            author: book.author,
            contributor: book.contributor,
            quantity: book.quantity,
            requests: book.requests,
          },
        }
      );
    } catch (err) {
      return err;
    }
  }

  async deleteBook(bookId) {
    try {
      const db = getDB();
      const collection = db.collection("books");
      await collection.deleteOne({ _id: bookId });
    } catch (err) {
      return err;
    }
  }
}
