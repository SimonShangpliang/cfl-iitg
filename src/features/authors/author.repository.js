import { getDB } from "../../config/mongodb.js";

export default class UserRepository {

    async addAuthor(newAuthor) {
        try {
          //1. get the database
          const db = getDB();
          //2. get the database
          const collection = db.collection("authors");
          //3. Insert the user
          await collection.insertOne(newAuthor);
          return newAuthor;
        } catch (err) {
          throw new Error(err);
        }
      }

      async getAllAuthors() {
        try {
            const db = getDB();
            const collection = db.collection("authors");
            const authors = await collection.find({}).toArray();
            return authors;
        } catch (err) {
            throw new Error(err);
        }
    }

    async removeInvalidAuthors() {
      try {
          const db = getDB();
          const collection = db.collection("authors");

          // Remove documents where author or pic is null, missing, or an empty string
          const result = await collection.deleteMany({
              $or: [
                  { author: { $in: [null, "", undefined] } },
                  { pic: { $in: [null, "", undefined] } }
              ]
          });

          return result.deletedCount; // Number of documents deleted
      } catch (err) {
          throw new Error(err);
      }
  }

}