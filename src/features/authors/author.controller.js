import BooksRepository from "../books/book.repository.js";
import AuthorRepository from "./author.repository.js";
import AuthorModel from "./author.model.js";
import jwt from "jsonwebtoken";

export default class AuthorController {
  constructor() {
    this.authorRepository = new AuthorRepository();
  }

  async addAuthor(req, res) {
    // console.log(req.body);
    const { author, pic } = req.body; // Rename the destructured variable
    const authorRepo = this.authorRepository; // Use the class instance's repository


    try {
      // Create a new AuthorModel instance with the correct variable names
      const authorM = new AuthorModel(author, pic);
      await authorRepo.addAuthor(authorM); // Use the correct variable name
      res.status(200).json({ "success": authorM }); // Send JSON response
    } catch (err) {
      console.error(err); // Log the error to the console
      res.status(500).json({ error: err.message }); // Send error response
    }
  }
  async getAllAuthors(req, res) {
    const authorRepo = this.authorRepository; // Use the class instance's repository

    try {
      const authors = await authorRepo.getAllAuthors();
      return authors // Send JSON response with authors
    } catch (err) {
      console.error(err); // Log the error to the console
     return [];
    }
  }
}
