import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import BookModel from "./book.model.js";
import BooksRepository from "./book.repository.js";

const bucketName = process.env.BUCKET_NAME;
const bucketRegion = process.env.BUCKET_REGION;
const accessKey = process.env.ACCESS_KEY;
const secretAccessKey = process.env.SECRET_ACCESS_KEY;

const s3 = new S3Client({
  credentials: {
    accessKeyId: accessKey,
    secretAccessKey: secretAccessKey,
  },
  region: bucketRegion,
});

export default class BookController {
  constructor() {
    this.bookRepository = new BooksRepository();
  }

  async getAll(req, res) {
    try {
      const books = await this.bookRepository.getAllBooks();
      // console.log(books);
      if (!books)
        return res.status(400).render("books", {
          errMessage: "No books available",
          books: [],
          userEmail: req.session.userEmail,
        });

      return res.status(200).render("books", {
        errMessage: null,
        books,
        userEmail: req.session.userEmail,
      });
    } catch (err) {
      return res.status(400).render("books", {
        errMessage: err,
        books: [],
        userEmail: req.session.userEmail,
      });
    }
  }

  async getBook(req, res) {
    const bookId = req.params.bookId;
    try {
      const book = await this.bookRepository.findBook(bookId);
      if (book) {
        const currentDate = new Date();
        if (book.requests) {
          const removeIndexes = [];
          book.requests.forEach((r, index) => {
            r.daysLeft = Math.round(
              (r.returnDate - currentDate) / (1000 * 60 * 60 * 24)
            );
            if (r.daysLeft <= 0) removeIndexes.push(index);
          });
          // removeIndexes.sort((a, b) => b - a);
          let r = 0;
          removeIndexes.forEach((index) => {
            book.requests.splice(index - r, 1);
            r++;
          });
          book.quantity = Number(book.quantity) + r;
        }
        await this.bookRepository.updateBook(book);
        const requested = book.requests.some(
          (request) => request.name === req.session.userName
        );

        res.status(200).render("bookDetails", {
          errMessage: null,
          book,
          userEmail: req.session.userEmail,
          requested,
        });
      } else
        res.status(400).render("books", {
          errMessage: "Book not availale",
          books: [],
          userEmail: req.session.userEmail,
        });
    } catch (err) {
      res.status(400).render("books", {
        errMessage: err,
        books: [],
        userEmail: req.session.userEmail,
      });
    }
  }

  getNewBookForm(req, res) {
    res.status(200).render("newBook", {
      userEmail: req.session.userEmail,
    });
  }

  async addBook(req, res) {
    const { name, author, contributor, desc, quantity } = req.body;
    const bookId = author + "-" + name;
    const uniqueKeys = req.files.map((file) => {
      return file.originalname;
    });
    const imagesUrl = uniqueKeys.map((uniqueKey) => {
      return `https://${bucketName}.s3.${bucketRegion}.amazonaws.com/${uniqueKey}`;
    });

    const bookFound = await this.bookRepository.findBook(bookId);
    if (!bookFound) {
      try {
        const book = new BookModel(
          name,
          author,
          contributor,
          desc,
          Number(quantity),
          imagesUrl,
          uniqueKeys
        );

        req.files.map(async (file, index) => {
          const params = {
            Bucket: bucketName,
            Key: uniqueKeys[index],
            Body: file.buffer,
            ContentType: file.mimetype,
          };

          const command = new PutObjectCommand(params);

          await s3.send(command);
        });
        console.log(imagesUrl);
        await this.bookRepository.addBook(book);
      } catch (err) {
        return res.status(400).render("books", {
          errMessage: err,
          books: [],
          userEmail: req.session.userEmail,
        });
      }
    }

    return await this.getAll(req, res);
  }

  async getUpdateBookForm(req, res) {
    const bookId = req.params.bookId;
    const book = await this.bookRepository.findBook(bookId);

    if (!book)
      return res.render("bookDetails", {
        errMessage: "Book not found",
        book: null,
        userEmail: req.session.userEmail,
        requested: false,
      });
    res
      .status(200)
      .render("updateBook", { book, userEmail: req.session.userEmail });
  }

  async updateBook(req, res) {
    const { name, author, contributor, desc, quantity } = req.body;
    const bookId = req.params.bookId;
    const bookFound = await this.bookRepository.findBook(bookId);
    if (!bookFound) {
      console.log("book not found");
      return res.render("bookDetails", {
        errMessage: "Book not found for updatetion",
        book: null,
        userEmail: req.session.userEmail,
        requested: false,
      });
    }
    if (name) bookFound.name = name;
    if (author) bookFound.author = author;
    if (contributor) bookFound.contributor = contributor;
    if (desc) bookFound.desc = desc;
    if (quantity) bookFound.quantity = quantity;

    await this.bookRepository.updateBook(bookFound);
    const requested = bookFound.requests.some(
      (request) => request.name === req.session.userName
    );

    res.render("bookDetails", {
      errMessage: null,
      book: bookFound,
      userEmail: req.session.userEmail,
      requested,
    });
  }

  async deleteBook(req, res) {
    const bookId = req.params.bookId;
    const book = await this.bookRepository.findBook(bookId);

    if (!book)
      return res.render("bookDetails", {
        errMessage: "Book not found",
        book,
        userEmail: req.session.userEmail,
        requested: false,
      });

    try {
      const uniqueKeys = book.uniqueKeys;

      uniqueKeys.map(async (uniqueKey) => {
        const params = {
          Bucket: bucketName,
          Key: uniqueKey,
        };

        const command = new DeleteObjectCommand(params);

        await s3.send(command);
      });
      await this.bookRepository.deleteBook(bookId);
      const books = await this.bookRepository.getAllBooks();
      res.render("books", {
        errMessage: null,
        books,
        userEmail: req.session.userEmail,
      });
    } catch (err) {
      const requested =
        book &&
        book.requests.some((request) => request.name === req.session.userName);

      res.render("bookDetails", {
        errMessage: err,
        book,
        userEmail: req.session.userEmail,
        requested,
      });
    }
  }
  async updateRequestBook(req, res) {


    const { bookId, requestName, isAccepted } = req.query;
    // Convert isAccepted to boolean if necessary
    const accepted = isAccepted === 'true';
  
    try {
      await this.bookRepository.updateRequestStatus(bookId, requestName, accepted);
      // Redirect back to the page the request came from
      const redirectUrl = req.headers.referer || '/'; // Default to home if referer is not available
      res.redirect(redirectUrl);
    } catch (err) {
      console.error('Error updating request status:', err);
      res.status(500).json({ message: 'Error updating request status', error: err.message });
    }



  }
  async issueBook(req, res) {
    const bookId = req.params.bookId;
    const book = await this.bookRepository.findBook(bookId);

    if (!book) return res.status(400).redirect(req.originalUrl);

    const name = req.userName;
    const issuedIndex = book.requests.findIndex((r) => r.name == name);
  
    if (issuedIndex >= 0) {
      book.requests.splice(issuedIndex, 1);
    //  book.quantity += 1;
      await this.bookRepository.updateBook(book);

      return res.render("bookDetails", {
        errMessage: null,
        book,
        userEmail: req.session.userEmail,
        requested: false,
      });
    }
    if(book.quantity===book.requests.length)
      {
        return res.render("bookDetails", {
          errMessage: "Sorry all the books have been issued",
          book,
          userEmail: req.session.userEmail,
          requested: false,
        });
      }
    if (book.quantity <= 0)
      return res.render("bookDetails", {
        errMessage: "Sorry all books are currenly issued",
        book,
        userEmail: req.session.userEmail,
        requested: false,
      });

   // book.quantity = parseInt(book.quantity) - 1;
    const daysLeft = 30;
    const currentDate = new Date();
    const returnDate = new Date(
      currentDate.getTime() + 30 * 24 * 60 * 60 * 1000
    );
    var isAccepted=false;
    book.requests.push({ name, daysLeft, returnDate,isAccepted });
    await this.bookRepository.updateBook(book);
    res.render("bookDetails", {
      errMessage: null,
      book,
      userEmail: req.session.userEmail,
      requested: true,
    });
  }
}
