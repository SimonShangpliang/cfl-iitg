 import dotenv from "dotenv";
 dotenv.config();
// import { MongoClient } from "mongodb";
// import nodemailer from "nodemailer";
// import cron from "node-cron";
// import BooksRepository from "../features/books/book.repository.js";
// const defaultURL = process.env.MONGO_URL;
// // "mongodb+srv://lalhriemsang:lal%40123%23777@cluster0.7ik7jus.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// // const url =
// //   process.env.MONGO_URL || "mongodb://localhost:27017/Christians-IITG-Books";
// let client;
// export const connectToMongoDB = () => {
//   MongoClient.connect(defaultURL)
//     .then((clientInstance) => {
//       client = clientInstance;
//       console.log("MongoDB is connected");
//     })
//     .catch((err) => console.log(err));
// };

// export const getDB = () => {
//   return client.db("Christians-IITG-Books"); // provide the db name if not present in url
// };

// async function checkDueDatesAndSendEmails() {
//   try {
//     console.log("Updating return days and checking Due dates for emails");
//     const bookRepository = new BooksRepository();

//     const books = await bookRepository.getBooksWithNonEmptyRequests();

//     books.forEach(async (book) => {
//       const currentDate = new Date();
//       if (book.requests) {
//         const mailReaders = [];
//         const removeIndexes = [];
//         book.requests.forEach((r, index) => {
//           r.daysLeft = Math.round(
//             (r.returnDate - currentDate) / (1000 * 60 * 60 * 24)
//           );

//           if (r.daysLeft == 1 && r.isAccepted && !r.mailed)
//             mailReaders.push({
//               email: r.email,
//               days: r.daysLeft,
//               requestIndex: index,
//             });
//           if (r.daysLeft <= 0) removeIndexes.push(index);
//         });

//         mailReaders.forEach(async (reader) => {
//           book.requests[reader.requestIndex].mailed = true;
//           await sendEmail(book.name, reader.email);
//         });

//         let r = 0;
//         removeIndexes.forEach((index) => {
//           book.requests.splice(index - r, 1);
//           r++;
//         });
//         book.quantity = Number(book.quantity) + r;
//       }
//       await bookRepository.updateBook(book);
//     });
//     console.log("checking done");
//   } catch (error) {
//     console.error("Error in checkDueDatesAndSendEmails:", error);
//   }
// }

// async function sendEmail(bookName, recipientMail) {
//   const transporter = nodemailer.createTransport({
//     service: "gmail",
//     auth: {
//       user: process.env.BOOK_MANAGER_EMAIL,
//       pass: process.env.BOOK_MANAGER_PASSWD,
//     },
//   });

//   const mailOptions = {
//     from: process.env.BOOK_MANAGER_EMAIL,
//     to: recipientMail,
//     subject: `Christian Fellowship Book Return Due`,
//     text: `Please return ${bookName} book by tommorow`,
//   };

//   try {
//     const info = await transporter.sendMail(mailOptions);
//     console.log("Email sent: " + info.response);
//   } catch (error) {
//     console.log(error);
//   }
// }
// // Schedule the task to run every day at midnight
// cron.schedule("0 3 * * *", async () => {
//   console.log("Running cron job to check due dates and send emails...");
//   try {
//     await checkDueDatesAndSendEmails();
//   } catch (error) {
//     console.log(error);
//   }
// });

import { MongoClient } from "mongodb";
import nodemailer from "nodemailer";
import cron from "node-cron";
import BooksRepository from "../features/books/book.repository.js";

const defaultURL = process.env.MONGO_URL;

let client;

export const connectToMongoDB = async () => {
  try {
    client = await MongoClient.connect(defaultURL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB is connected");
  } catch (err) {
    console.error("MongoDB connection error:", err);
  }
};

export const getDB = () => {
  if (!client) {
    throw new Error(
      "MongoDB client is not initialized. Call connectToMongoDB first."
    );
  }
  return client.db("Christians-IITG-Books");
};

async function checkDueDatesAndSendEmails() {
  try {
    console.log("Updating return days and checking due dates for emails");
    const bookRepository = new BooksRepository();

    const books = await bookRepository.getBooksWithNonEmptyRequests();

    for (const book of books) {
      const currentDate = new Date();
      if (book.requests) {
        const mailReaders = [];
        const removeIndexes = [];

        book.requests.forEach((r, index) => {
          r.daysLeft = Math.round(
            (r.returnDate - currentDate) / (1000 * 60 * 60 * 24)
          );

          if (r.daysLeft === 1 && r.isAccepted && !r.mailed) {
            mailReaders.push({
              email: r.email,
              days: r.daysLeft,
              requestIndex: index,
            });
          }
          if (r.daysLeft <= 0) removeIndexes.push(index);
        });

        for (const reader of mailReaders) {
          book.requests[reader.requestIndex].mailed = true;
          await sendEmail(book.name, reader.email);
        }

        let r = 0;
        removeIndexes.forEach((index) => {
          book.requests.splice(index - r, 1);
          r++;
        });
        book.quantity = Number(book.quantity) + r;
      }
      await bookRepository.updateBook(book);
    }
    console.log("Checking done");
  } catch (error) {
    console.error("Error in checkDueDatesAndSendEmails:", error);
  }
}

async function sendEmail(bookName, recipientMail) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.BOOK_MANAGER_EMAIL,
      pass: process.env.BOOK_MANAGER_PASSWD,
    },
  });

  const mailOptions = {
    from: process.env.BOOK_MANAGER_EMAIL,
    to: recipientMail,
    subject: `Christian Fellowship Book Return Due`,
    text: `Please return the ${bookName} book by tomorrow.`,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent: " + info.response);
  } catch (error) {
    console.error("Error sending email:", error);
  }
}

// Schedule the task to run every day at midnight
cron.schedule("0 3 * * *", async () => {
  console.log("Running cron job to check due dates and send emails...");
  try {
    await checkDueDatesAndSendEmails();
  } catch (error) {
    console.error("Error running cron job:", error);
  }
});

// Make sure to call connectToMongoDB somewhere in your application
connectToMongoDB();
