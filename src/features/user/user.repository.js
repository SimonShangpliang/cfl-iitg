import { getDB } from "../../config/mongodb.js";

export default class UserRepository {
  async SignUp(newUser) {
    try {
      //1. get the database
      const db = getDB();
      //2. get the database
      const collection = db.collection("users");
      //3. Insert the user
      await collection.insertOne(newUser);
      return newUser;
    } catch (err) {
      throw new Error(err);
    }
  }
  async SignIn(email, password) {
    try {
      //1. get the database
      const db = getDB();
      //2. get the database
      const collection = db.collection("users");
      //3. Insert the user
      return await collection.findOne({ email, password });
    } catch (err) {
      throw new Error(err);
    }
  }
}
