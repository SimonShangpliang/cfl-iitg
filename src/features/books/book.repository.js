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
      const authors = await collection
        .aggregate([
          {
            $group: {
              _id: "$author", // Group by the `author` field
            },
          },
          {
            $project: {
              _id: 0,
              author: "$_id", // Rename the `_id` field to `author`
            },
          },
        ])
        .toArray();

      // Map the result to get a list of author names
      const authorList = authors.map((author) => author.author);
      console.log(authorList);
      return authorList;
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

  async updateMailedStatus(bookId, requestName, mailed) {
    try {
      console.log(bookId, requestName, mailed);
      const db = getDB();
      const collection = db.collection("books");

      // Update the mailed Status in request
      await collection.updateOne(
        { _id: bookId, "requests.name": requestName },
        {
          $set: {
            "requests.$.mailed": mailed,
          },
        }
      );
    } catch (err) {
      return err;
    }
  }
  // book.repository.js

  async getBooksWithUnacceptedRequests() {
    try {
      const db = getDB();
      const collection = db.collection("books");

      // Find books where any request has isAccepted as false
      const books = await collection
        .find({
          "requests.isAccepted": false,
        })
        .toArray();

      return books;
    } catch (err) {
      return err;
    }
  }

  async getBooksWithNonEmptyRequests() {
    try {
      const db = getDB();
      const collection = db.collection("books");

      const books = await collection
        .find({
          requests: { $exists: true, $not: { $size: 0 } },
        })
        .toArray();

      return books;
    } catch (err) {
      return err;
    }
  }

  async updateRequestStatus(bookId, requestName, isAccepted) {
    try {
      console.log(bookId, requestName, isAccepted);
      const db = getDB();
      const collection = db.collection("books");

      // Update the `isAccepted` field of the specific request
      if (isAccepted) {
        // If accepted, update the request status
        await collection.updateOne(
          { _id: bookId, "requests.name": requestName },
          {
            $set: {
              "requests.$.isAccepted": isAccepted,
            },
          }
        );
      } else {
        // If rejected, remove the request
        await collection.updateOne(
          { _id: bookId },
          {
            $pull: {
              requests: { name: requestName },
            },
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

      // Build the update object
      const updateData = {
        name: book.name,
        author: book.author,
        contributor: book.contributor,
        desc: book.desc,
        quantity: book.quantity,
        categories: book.categories,
        typeOf: book.typeOf,
        ebookLink: book.ebookLink,
        numOfPages: book.numOfPages,
        year: book.year,
        requests: book.requests, // updates only reqs if deleted
        // Add eBook link if applicable
        // Handle images if necessary
        // You might need additional logic to process and store image URLs
        imagesUrl: book.imagesUrl,
        uniqueKeys: book.uniqueKeys,
      };
      // Update the books
      book.requests.forEach(async (req) => {
        await this.updateMailedStatus(book._id, req.name, req.mailed);
      });
      await collection.updateOne({ _id: book._id }, { $set: updateData });
    } catch (err) {
      console.error(err);
      throw err;
    }
  }

  async addNewRequestToBook(bookId, newRequest) {
    const db = getDB();
    const collection = db.collection("books");

    try {
      const updatedBook = await collection.findOneAndUpdate(
        { _id: bookId },
        { $push: { requests: newRequest } },
        { returnDocument: "after" }
      ); // 'after' returns the document after the update

      return updatedBook.value;
    } catch (error) {
      console.log(error);
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
