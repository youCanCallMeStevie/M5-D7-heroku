const express = require("express");
const path = require("path");
const uniqid = require("uniqid");
const router = express.Router();
const { readDB, writeDB } = require("../../utils");
const { readJSON } = require("fs-extra");
const multer = require("multer");
const { writeFile } = require("fs-extra");
const upload = multer({});
const productsPath = path.join(__dirname, "products.json");

router.route("/").get(async (req, res, next) => {
  try {
    let products = await readDB(productsPath);
    console.log(req.query); // returning the queries that are present in the url
    for (key in req.query);
    if (key === "price" && typeof req.query[key] === "object") {
      const priceQuery = req.query[key];
      console.log(priceQuery);
      for (priceKey in priceQuery) {
        switch (priceKey) {
          case "gt":
            products = products.filter(
              product =>
                parseInt(product.price) > parseInt(priceQuery[priceKey])
            );
            break;
          case "lt":
            prodcuts = products.filter(
              product =>
                parseInt(product.price) < parseInt(priceQuery[priceKey])
            );
            break;
          default:
            products;
        }
      }
    } else {
      products = products.filter(product =>
        !product[key]
          ? product
          : product[key].toString() === req.query[key].toString()
      ); //checking that there is a key at all
    }

    res.send(products);
  } catch (error) {
    console.log(error);
    next(error);
  }
});

router.route("/category").get((req, res, next) => {
  //a static url, with something like an endpoint with a word,
  //has to come before a dynamic url param. if this came after,
  //it would think the word would be the dynamic id
  try {
  } catch (error) {
    console.log(error);
  }
});

router.route("/:id").get(async (req, res, next) => {
  try {
    const products = await readJSON(productsPath);
    const product = products.find(product => product._id === req.params.id);
    if (product) {
      res.send(product);
    } else {
      res.status(404).send("product not found");
    }
  } catch (error) {
    console.log(error);
  }
});

router.route("/").post(async (req, res, next) => {
  try {
    const products = await readDB(productsPath);
    const newProduct = {
      ...req.body,
      _id: uniqid(),
    };
    products.push(newProduct);
    await writeDB(productsPath, products);
    res.send(newProduct);
  } catch (error) {
    console.log(error);
  }
});

router.route("/:id").put(async (req, res, next) => {
  try {
    const products = await readDB(productsPath);
    const updatedDb = products.map(product =>
      product._id === req.params.id
        ? { ...product, ...req.body, _id: product._id }
        : product
    );
    await writeDB(productsPath, updatedDb);
    res.send(updatedDb);
  } catch (error) {
    console.log(error);
  }
});

router.route("/:id").delete(async (req, res, next) => {
  try {
    const products = await readDB(productsPath);
    const updatedDb = products.filter(product => product._id != req.params.id);
    await writeDB(productsPath, updatedDb);
    res.send("Product has been deleted");
  } catch (error) {
    console.log(error);
  }
});

router
  .route("/:id/upload")
  .post(upload.single("image"), async (req, res, next) => {
    const [name, extention] = req.file.mimetype.split("/");
    try {
      await writeFile(
        path.join(__dirname, 
            `../../../public/img/products/${req.params.id}.${extention}`), req.file.buffer
      );

      const products = await readDB(productsPath);
      const updatedDb = products.map(product =>
        product._id === req.params.id
          ? {...product, imageUrl:`http://localhost:${process.env.PORT}/products/${req.params.id}.${extention}`}
          : product
      );
      await writeDB(productsPath, updatedDb);
      res.send("ok")
    } catch (error) {
      console.log(error);
      next(error);
    }
  });
module.exports = router;
