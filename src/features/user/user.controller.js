import BooksRepository from "../books/book.repository.js";
import UserRepository from "./user.repository.js";
import UserModel from "./user.model.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();
export default class UserController {
  constructor() {
    this.userRepository = new UserRepository();
  }
  getRegister(req, res) {
    res.status(200).render("register", { errMessage: null });
  }

  getLogin(req, res) {
    res.status(200).render("login", { errMessage: null });
  }

  async signUp(req, res) {
    // console.log(req.body);
    const { name, email, password } = req.body;
    console.log(req.body);
    try {
      const user = new UserModel(name, email, password);
      await this.userRepository.SignUp(user);
      res.status(201).render("login", { errMessage: null });
    } catch (err) {
      throw new Error(err);
    }
  }

  async signIn(req, res) {
    try {
      const result = await this.userRepository.SignIn(
        req.body.email,
        req.body.password
      );
      if (!result) {
        return res.render("login", { errMessage: "Incorrect credentials" });
      } else {
        // 1. Create token
        const token = jwt.sign(
          { userID: result._id, email: result.email, userName: result.name },
          "xyz",
          { expiresIn: "1h" }
        );

        // 2. send token
        res
          .status(200)
          .cookie("jwtToken", token, {
            maxAge: 3600000,
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
          });

        req.session.userEmail = result.email;
        req.session.userName = result.name;
        const booksRepository = new BooksRepository();
        const books = await booksRepository.getAllBooks();
        req.session.save((err) => {
          if (err) {
            console.error("Session save error:", err);
            return res.status(500).render("login", { errMessage: "Session error" });
          }
       
        if (books) {
          res.status(200).render("books", {
            errMessage: null,
            books,
            userEmail: result.email,
          });
        } else
          res.status(200).render("books", {
            errMessage: "No books available",
            books: [],
            userEmail: result.email,
          });
      })}
    } catch (err) {
      console.log(err);
      res.status(400).render("login", { errMessage: err });
    }
  }

  logout(req, res) {
    req.session.destroy((err) => {
      if (err) console.log(err);
    });
    res.locals.userEmail = null;
    res.clearCookie("jwtToken");
    res.status(200).render("login", { errMessage: null });
  }
}
