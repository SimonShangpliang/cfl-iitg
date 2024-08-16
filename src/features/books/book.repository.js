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
  async getUniqueAuthors(req, res) {
    try {
      const db = getDB();
      const collection = db.collection("books");
  
      // Use aggregation to get unique author names
      const authors = await collection.aggregate([
        {
          $group: {
            _id: "$author" // Group by the `author` field
          }
        },
        {
          $project: {
            _id: 0,
            author: "$_id" // Rename the `_id` field to `author`
          }
        }
      ]).toArray();
  
      // Map the result to get a list of author names
      const authorList = authors.map(author => author.author);
  console.log(authorList)
    return authorList
    } catch (err) {
     return [];
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
  async updateRequestStatus(bookId, requestName, isAccepted) {
    try {
      console.log(bookId, requestName, isAccepted)
      const db = getDB();
      const collection = db.collection("books");

      // Update the `isAccepted` field of the specific request
      if (isAccepted) {
        // If accepted, update the request status
        await collection.updateOne(
          { _id: bookId, "requests.name": requestName },
          { 
            $set: { 
              "requests.$.isAccepted": isAccepted 
            }
          }
        );
      } else {
        // If rejected, remove the request
        await collection.updateOne(
          { _id: bookId },
          { 
            $pull: { 
              requests: { name: requestName } 
            }
          }
        );
      }
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
