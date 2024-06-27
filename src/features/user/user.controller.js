import BooksRepository from "../books/book.repository.js";
import UserRepository from "./user.repository.js";
import UserModel from "./user.model.js";
import jwt from "jsonwebtoken";

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
        // console.log(`result: ${JSON.stringify(result)}`);
        const token = jwt.sign(
          { userID: result._id, email: result.email, userName: result.name },
          "xyz",
          { expiresIn: "1h" }
        );

        // 2. send token
        res
          .status(200)
          .cookie("jwtToken", token, { maxAge: 360000, httpOnly: false });

        req.session.userEmail = result.email;
        const booksRepository = new BooksRepository();
        const books = await booksRepository.getAllBooks();
        if (books) {
          //   console.log(books);
          res.status(200).render("books", {
            errMessage: null,
            books,
            userEmail: req.session.userEmail,
          });
        } else
          res.status(200).render("books", {
            errMessage: "No books available",
            books: [],
            userEmail: req.session.userEmail,
          });
      }
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
