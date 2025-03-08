import express from "express";
import cookieParser from "cookie-parser";
import session from "express-session";
import MongoStore from "connect-mongo";

import expressEjsLayouts from "express-ejs-layouts";
import path from "path";
import jwtAuth from "./src/middlewares/jwtAuth.middleware.js";
import UserController from "./src/features/user/user.controller.js";
import BookController from "./src/features/books/book.controller.js";
import AuthorController from "./src/features/authors/author.controller.js";

import { connectToMongoDB } from "./src/config/mongodb.js";
import uploadFiles from "./src/middlewares/fileUpload.middleware.js";
 import dotenv from "dotenv";
 dotenv.config();
// dotenv.config();
const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(cookieParser());
app.set("view engine", "ejs");
app.set("views", path.join(path.resolve(), "src", "views"));
app.use(
  session({
    secret: "SecretKey",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: true },
    store: MongoStore.create({

      mongoUrl: process.env.MONGO_URL, // Use your MongoDB connection
      ttl: 24 * 60 * 60, // Session expires in 1 day
    }),
  })
);
app.use(express.json()); // Middleware to parse JSON request bodies

app.use(expressEjsLayouts);
app.use((req, res, next) => {
  res.locals.userEmail = req.session.userEmail || null;
  next();
});

const bookController = new BookController();
const userController = new UserController();
const authorController = new AuthorController();

app.get("/books", (req, res) => bookController.getAll(req, res));
app.get("/register", (req, res) => userController.getRegister(req, res));
app.post("/register", (req, res) => userController.signUp(req, res));
app.get("/login", (req, res) => userController.getLogin(req, res));
app.post("/login", (req, res) => userController.signIn(req, res));
app.get("/new", jwtAuth, (req, res) => bookController.getNewBookForm(req, res));
app.post("/new", jwtAuth, uploadFiles.array("imagesUrl", 10), (req, res) =>
  bookController.addBook(req, res)
);
app.post("/addAuthor", (req, res) => {
  authorController.addAuthor(req, res);
});
app.get("/getAuthor", (req, res) => authorController.getAllAuthors(req, res));
app.get("/", async (req, res) => {
  try {
    // Fetch all valid authors from the controller
    const authors = await authorController.getAllAuthors();

    // Render the authorsList.ejs template with the fetched authors
    res.render("authorsList", { authors });
  } catch (err) {
    console.error(err); // Log the error
    res.status(500).json({ error: err.message }); // Send error response
  }
});
app.get("/aboutUs", (req, res) => {
  res.render("aboutUs", {
    userEmail: req.session.userEmail,
  });
});
app.get("/bookDetails/:bookId", jwtAuth, (req, res) =>
  bookController.getBook(req, res)
);
app.get("/issueBook/:bookId", jwtAuth, (req, res) =>
  bookController.issueBook(req, res)
);
app.get("/update-request-status", jwtAuth, (req, res) =>
  bookController.updateRequestBook(req, res)
);
app.get("/get-all-authors", (req, res) =>
  bookController.getUniqueAuthors(req, res)
);
app.get("/updateBook/:bookId", (req, res) =>
  bookController.getUpdateBookForm(req, res)
);
app.post(
  "/updateBook/:bookId",
  jwtAuth,
  uploadFiles.array("imagesUrl", 10),
  (req, res) => bookController.updateBook(req, res)
);

app.get("/deleteBook/:bookId", (req, res) =>
  bookController.deleteBook(req, res)
);
// Assuming you're using Express.js
app.delete("/deleteBook/:bookId", async (req, res) => {
  bookController.deleteBook(req, res);
});

app.get("/books-with-unaccepted-requests", async (req, res) => {
  try {
    // Fetch books with unaccepted requests
    const books = await bookController.getBooksWithUnacceptedRequests(req, res);

    // Render the EJS page with the list of books
    if (books && books.length > 0) {
      res.status(200).render("booksWithUnacceptedRequests", {
        books,
        error: null,
        userEmail: req.session.userEmail,
      });
    } else {
      res.status(404).render("booksWithUnacceptedRequests", {
        books: [],
        error: "No books found with unaccepted requests",
        userEmail: req.session.userEmail,
      });
    }
  } catch (err) {
    console.error(err);
    if (!res.headersSent) {
      res.status(500).render("booksWithUnacceptedRequests", {
        books: [],
        error: err.message,
        userEmail: req.session.userEmail,
      });
    }
  }
});

app.get("/books-requests", async (req, res) => {
  try {
    // Fetch books with unaccepted requests
    const books = await bookController.getBooksNonEmptyRequests(req, res);

    // Render the EJS page with the list of books
    if (books && books.length > 0) {
      res.status(200).render("booksRequests", {
        books,
        error: null,
        userEmail: req.session.userEmail,
      });
    } else {
      res.status(404).render("booksRequests", {
        books: [],
        error: "No books found with requests",
        userEmail: req.session.userEmail,
      });
    }
  } catch (err) {
    console.error(err);
    if (!res.headersSent) {
      res.status(500).render("booksRequests", {
        books: [],
        error: err.message,
        userEmail: req.session.userEmail,
      });
    }
  }
});

app.get("/logout", jwtAuth, (req, res) => userController.logout(req, res));

const PORT = process.env.PORT || 3500;
// app.listen(PORT, () => {
//   console.log("Server is listening at port 3500");
//   connectToMongoDB();
// });
// app.use((err, req, res, next) => {
//   if (err) console.log(err);
// });

const startServer = async () => {
  try {
    await connectToMongoDB(); // Ensure this completes before starting the server
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    process.exit(1); // Exit the process if the connection fails
  }
};

// Call the function to start the server
startServer();
