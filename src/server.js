const express = require("express")
const cors = require("cors")
const listEndpoints = require("express-list-endpoints")
const booksRoutes = require("./services/books")

const {
  notFoundHandler,
  badRequestHandler,
  genericErrorHandler,
} = require("./errorHandlers")

const server = express()

const port = process.env.PORT || 3007

server.use(express.json())

// const whiteList = //creating an array, if we are in this mode, then do this
//   process.env.NODE_ENV === "production" //this is a cloud provider code for production
//     ? [process.env.FE_URL_PROD] //this is not from .env but rather the keys in heroku
//     : [process.env.FE_URL_DEV]
 

const whiteList =[
    process.env.FE_URL_PROD, process.env.FE_URL_DEV
]

const corsOptions = {
  origin: function (origin, callback) {
    if (whiteList.indexOf(origin) !== -1) {
      // allowed
      callback(null, true)
    } else {
      // Not allowed
      callback(new Error("NOT ALLOWED - CORS ISSUES"))
    }
  },
}
 server.use(cors(corsOptions)) // needed for frontend testing

//ROUTES

server.use("/books", booksRoutes)

// ERROR HANDLERS
server.use(badRequestHandler)
server.use(notFoundHandler)
server.use(genericErrorHandler)

console.log(listEndpoints(server))

server.listen(port, () => {
  if (process.env.NODE_ENV === "production") {
    console.log("Running on cloud on port", port)
  } else {
    console.log("Running locally on port", port)
  }
})