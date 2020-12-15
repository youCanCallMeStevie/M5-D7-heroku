const express = require("express");
const path = require("path");
const uniqid = require("uniqid");
const router = express.Router();
const { readDB, writeDB, writeBooks, getBooks } = require("../../lib/utils");
const multer = require("multer");
const { writeFile } = require("fs-extra");
const upload = multer({});
const { check, validationResult } = require("express-validator");
const commentValidation = [
    check("UserName").exists().withMessage("Username is required"),
    check("Text").exists().withMessage("Text is required"),
  ];

  router.get("/:asin", async (req, res, next) => {
    try {
      const books = await getBooks();
      const bookFound = books.find(
        book => book.asin === req.params.asin
      );
      if (bookFound) {
        res.send(bookFound);
      } else {
        const err = new Error();
        err.httpStatusCode = 404;
        next(err);
      }
    } catch (error) {
      console.log(error);
      next(error);
    }
  });
  
  router.get("/", async (req, res, next) => {
    try {
      const books = await getBooks();
      if (req.query && req.query.category) {
        const filteredbooks = books.filter(
          book =>
            book.hasOwnProperty("category") &&
            book.category === req.query.category
        );
        res.send(filteredbooks);
      } else {
        res.send(books);
      }
    } catch (error) {
      console.log(error);
      next(error);
    }
  });
  
  router.post("/", async (req, res, next) => {
    try {
      const validationErrors = validationResult(req);
      const books = await getBooks();
  const bookFound = books.find(book => book.asin = req.body.asin)
      if (!validationErrors.isEmpty() && bookFound) {
        const err = new Error();
        err.httpStatusCode = 400;
        err.message = validationErrors;
        next(err);
      } else {
        const books = await getBooks();
        books.push({
          ...req.body,
          asin: uniqid(),
          createdAt: new Date(),
          updatedAt: new Date(),
          comments: [],
        });
        await writeBooks();
        res.status(201).send("ok");
      }
    } catch (error) {
      console.log(error);
      next(error);
    }
  });
  
  router.delete("/:asin", async (req, res, next) => {
    try {
      const books = await getBooks();
      const bookFound = books.find(
        book => book.asin === req.params.asin
      );
      if (bookFound) {
        const filteredbooks = books.filter(
          book => book.asin != bookFound
        );
        await writeBooks(filteredbooks);
        res.status(201).send("ok");
      }
    } catch (error) {
      console.log(error);
      next(error);
    }
  });
  
  router.put("/:asin", async (req, res, next) => {
    try {
  
      const validationErrors = validationResult(req);
  
      if (!validationErrors.isEmpty()) {
        const err = new Error();
        err.httpStatusCode = 400;
        err.message = validationErrors;
        next(err);
      } else {
        const books = await getBooks();
        const booksIndex = books.findIndex(
          book => book.asin === req.params.asin
        );
  
        if (booksIndex !== -1) {
          const updatedbooks = [
            ...books.slice(0, booksIndex),
            { ...books[booksIndex], ...req.body },
            ...books.slice(booksIndex + 1),
          ];
          await writeBooks(updatedbooks);
          res.send(updatedbooks);
        } else {
          const err = new Error();
          err.httpStatusCode = 404;
          next(error);
        }
      }
    } catch (error) {
      console.log(error);
      next(error);
    }
  });
  
  router.get("/:asin/comments", async (req, res, next) => {
    try {
      const books = await getBooks();
      const bookFound = books.find(
        book => book.asin === req.params.asin
      );
      if (bookFound) {
        res.send(bookFound.comments);
      } else {
        const error = new Error();
        error.httpStatusCode = 404;
        next(error);
      }
    } catch (error) {
      console.log(error);
      next(error);
    }
  });
  
  router.get("/:asin/comments/:commentId", async (req, res, next) => {
    try {
      const books = await getBooks();
      const bookFound = books.find(
        book => book.asin === req.params.asin
      );
      if (bookFound) {
        const commentFound = bookFound.comments.find(
          comment => comment.asin === comment.params.commentId
        );
        if (commentFound) {
          res.status(201).send(commentFound);
        } else {
          const error = new Error();
          error.httpStatusCode = 404;
          next(error);
        }
      } else {
        const err = new Error();
        err.httpStatusCode = 404;
        next(err);
      }
    } catch (error) {
      console.log(error);
      next(error);
    }
  });
  
  router.post("/:asin/comments/", commentValidation, async (req, res, next) => {
    try {
      const books = await getBooks();
  
      const bookIndex = books.findIndex(
        book => book.asin === req.params.asin
      );
      if (bookIndex !== -1) {
        // book found
        const id = uniqid()
        books[bookIndex].comments= books[bookIndex].comments ? [... books[bookIndex].comments, {
          ...req.body,
          CommentID: id,
          Date: new Date(),
        }] : [{
          ...req.body,
          CommentID: id,
          Date: new Date(),
        }];
        await writeBooks(books);
        res.status(201).send(id);
      } else {
        // book not found
        const error = new Error();
        error.httpStatusCode = 404;
        next(error);
      }
    } catch (error) {
      console.log(error);
      next(error);
    }
  });
  
  router.put(
    "/:asin/comments/:commentId",
    commentValidation,
    async (req, res, next) => {
      try {
        const books = await getBooks();
  
        const bookIndex = books.findIndex(
          book => book.asin === req.params.asin
        );
  
        if (bookIndex !== -1) {
          const commentIndex = books[bookIndex].comments.findIndex(
            comment => comment.asin === req.params.commentId
          );
  
          if (commentIndex !== -1) {
            const previouscomment = books[bookIndex].comments[commentIndex];
  
            const updatecomments = [
              ...books[bookIndex].comments.slice(0, commentIndex),
              { ...previouscomment, ...req.body, updatedAt: new Date() },
              ...books[bookIndex].comments.slice(commentIndex + 1),
            ];
            books[bookIndex].comments = updatecomments;
  
            await writeBooks(books);
            res.send(books);
          } else {
            console.log("comment not found");
          }
        } else {
          console.log("book not found");
        }
      } catch (error) {
        console.log(error);
        next(error);
      }
    }
  );
  
  router.delete("/:asin/comments/:commentId", async (req, res, next) => {
    try {
      const books = await getBooks();
      const bookIndex = books.findIndex(
        book => book.asin === req.params.asin
      );
      if (bookIndex !== -1) {
        books[bookIndex].comments = books[bookIndex].comments.filter(
          comment => comment.CommentID !== req.params.commentId
        );
        await writeBooks(books);
        res.send(books);
      } else {
      }
    } catch (error) {
      console.log(error);
      next(error);
    }
  });
  
  router.delete("/:asin", async (req, res, next) => {
    try {
      const books = await getBooks();
      const filteredBooks = books.filter(book => book.asin != req.params.asin);
      await writeBooks(filteredBooks);
      res.send("book has been deleted");
    } catch (error) {
      console.log(error);
      next(error);
    }
  });
  
  router
    .post("/:asin/upload", upload.single("image"), async (req, res, next) => {
      const [name, extention] = req.file.mimetype.split("/");
      try {
        await writeFile(
          path.join(
            __dirname,
            `../../../public/img/books/${req.params.id}.${extention}`
          ),
          req.file.buffer
        );
        const books = await getBooks();
        const updatedDb = books.map(book =>
          book.asin === req.params.asin
            ? {
                ...book,
                updatedAt: new Date(),
                imageUrl: `http://localhost:${process.env.PORT}/books/${req.params.id}.${extention}`,
              }
            : book
        );
        await writeBooks(updatedDb);
        // console.log(updatedDb)
        res.status(201).send("ok");
      } catch (error) {
        console.log(error);
        next(error);
      }
    });
  
  module.exports = router;