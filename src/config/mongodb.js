// import dotenv from "dotenv";
// dotenv.config();
import { MongoClient } from "mongodb";
// const defaultURL = "mongodb://localhost:27017/Christians-IITG-Books";
//  "mongodb+srv://lalhriemsang:lal%40123%23777@cluster0.7ik7jus.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

const url =
  "mongodb+srv://lalhriemsang:lal%40123%23777@cluster0.7ik7jus.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
let client;
export const connectToMongoDB = () => {
  MongoClient.connect(url)
    .then((clientInstance) => {
      client = clientInstance;
      console.log("MongoDB is connected");
    })
    .catch((err) => console.log(err));
};

export const getDB = () => {
  return client.db("Christians-IITG-Books"); // provide the db name if not present in url
};
