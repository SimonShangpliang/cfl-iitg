import express from "express";
import cookieParser from "cookie-parser";
import session from "express-session";
import expressEjsLayouts from "express-ejs-layouts";
import path from "path";
import jwtAuth from "./src/middlewares/jwtAuth.middleware.js";
import UserController from "./src/features/user/user.controller.js";
import BookController from "./src/features/books/book.controller.js";
import { connectToMongoDB } from "./src/config/mongodb.js";
import uploadFiles from "./src/middlewares/fileUpload.middleware.js";

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
    cookie: { secure: false },
  })
);
app.use(expressEjsLayouts);

const bookController = new BookController();
const userController = new UserController();

app.get("/", (req, res) => bookController.getAll(req, res));
app.get("/register", (req, res) => userController.getRegister(req, res));
app.post("/register", (req, res) => userController.signUp(req, res));
app.get("/login", (req, res) => userController.getLogin(req, res));
app.post("/login", (req, res) => userController.signIn(req, res));
app.get("/new", jwtAuth, (req, res) => bookController.getNewBookForm(req, res));
app.post("/new", jwtAuth, uploadFiles.array("imagesUrl", 10), (req, res) =>
  bookController.addBook(req, res)
);
app.get('/aboutUs', (req, res) => {
  res.render('aboutUs');
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
  
  bookController.getUniqueAuthors(req,res)
);
app.get("/updateBook/:bookId", (req, res) =>
  bookController.getUpdateBookForm(req, res)
);
app.post("/updateBook/:bookId", jwtAuth, uploadFiles.array("imagesUrl", 10),(req, res) =>
  bookController.updateBook(req, res)
);
app.get("/deleteBook/:bookId", (req, res) =>
  bookController.deleteBook(req, res)
);
// Assuming you're using Express.js
app.delete('/deleteBook/:bookId', async (req, res) => {
  bookController.deleteBook(req, res)
});

app.get("/books-with-unaccepted-requests", async (req, res) => {
  try {
    // Fetch books with unaccepted requests
    const books = await bookController.getBooksWithUnacceptedRequests(req, res);

    // Render the EJS page with the list of books
    if (books && books.length > 0) {
      res.status(200).render("booksWithUnacceptedRequests", { books, error: null });
    } else {
      res.status(404).render("booksWithUnacceptedRequests", { books: [], error: "No books found with unaccepted requests" });
    }
  } catch (err) {
    console.error(err);
    if (!res.headersSent) {
      res.status(500).render("booksWithUnacceptedRequests", { books: [], error: err.message });
    }
  }
});



app.get("/logout", jwtAuth, (req, res) => userController.logout(req, res));

const PORT = process.env.PORT || 3500;
app.listen(PORT, () => {
  console.log("Server is listening at port 3500");
  connectToMongoDB();
});
// app.use((err, req, res, next) => {
//   if (err) console.log(err);
// });
