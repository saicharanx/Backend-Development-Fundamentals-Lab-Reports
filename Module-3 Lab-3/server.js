const express = require('express')
const Database = require('better-sqlite3')

const app = express()
const db = new Database("books.db")

app.use(express.json())

// I am creating the books table if it doesn't exist

db.prepare(`
    CREATE TABLE IF NOT EXISTS books (
        book_id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        author TEXT,
        price REAL
    )
`).run()

// Task 1, 2 and 3
app.get("/books", (request, response) => {
    
    const {
        search_q = "",
        order_by = "book_id",
        order = "ASC",
        limit = "5",
        offset = "0",
        min_price = "0",
        max_price = "10000"
    } = request.query
    
    const allowedColumns = ["book_id", "title", "author", "price"]
    if (!allowedColumns.includes(order_by)){
        return response.status(400).json({
            message: "Invalid order_by"
        })
    }

    if (order !== "ASC" && order !== "DESC"){
        return response.status(400).json({
            message: "Order should be either ASC or DESC"
        })
    }
    
    const query = `
        SELECT * FROM books
        WHERE title LIKE ? AND price BETWEEN ? AND ?
        ORDER BY ${order_by} ${order}
        LIMIT ? OFFSET ?
    `

    const books = db.prepare(query).all(
        "%" + search_q + "%",
        Number(min_price),
        Number(max_price),
        Number(limit),
        Number(offset)
    )

    response.json(books)
})

// Task 1

app.get("/books/:id", (request, response) => {
    const book = db.prepare(
        "SELECT * FROM books WHERE book_id = ?"
    ).get(request.params.id)

    if (!book) {
        return response.status(404).json({
            message: "Book not found"
        })
    }

    response.json(book)
})

// Task 4, 5 and  6

app.post("/books", (request, response) => {

    const { title, author, price } = request.body

    if(!title) {
        return response.status(400).json({
            message: "Title is required"
        })
    }

    if(!author) {
        return response.status(400).json({
            message: "Author is required"
        })
    }

    if (price == undefined || price === "" || isNaN(Number(price))) {
        return response.status(400).json({
            message: "Price must be a number"
        })
    }
    
    db.prepare(`
        INSERT INTO books (title, author, price)
        VALUES (?, ?, ?)
    `).run(title, author, Number(price))

    response.status(201).json({
        message: "Book added Successfully!"
    })
})

// Task 5 and 6

app.put("/books/:id", (request, response) => {

    const {title, author, price} = request.body

    if(!title || !author || price === undefined || price === "" || isNaN(Number(price))) {
        return response.status(400).json({
            message: "Invalid Book Details"
        })
    }

    const result = db.prepare(`
        UPDATE books
        SET title = ?, author = ?, price = ?
        WHERE book_id = ?
    `).run(title, author, Number(price), request.params.id)

    if (result.changes === 0) {
        return response.status(404).json({
            message: "Book not found"
        })
    }

    response.status(200).json({
        message: "Book updated Successfully"
    })
})

app.delete("/books/:id", (request, response) => {
    const result = db.prepare(`
        DELETE FROM books WHERE book_id = ?
    `).run(request.params.id)

    if (result.changes === 0) {
        return response.status(404).json({
            message: "Book not Found"
        })
    }
    response.status(200).json({
        message: "Book deleted Successfully"
    })
})

app.listen(3000, () => {
    console.log("Server is Runnig on port 3000")
})