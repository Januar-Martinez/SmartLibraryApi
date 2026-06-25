const { getPool, sql } = require('../config/database');

const createBook = async (req, res) => {
    const { title, author, stock } = req.body;

    if (!title || !author || stock == null) {
        return res.status(400).json({ error: 'Los campos título, autor y stock son obligatorios' });
    }

    if (!Number.isInteger(Number(stock)) || stock < 0) {
        return res.status(400).json({ error: 'El stock debe ser un número entero no negativo' });
    }

    try {
        const pool = await getPool();

        const result = await pool.request()
            .input('title', sql.NVarChar(100), title)
            .input('author', sql.NVarChar(150), author)
            .input('stock', sql.Int, stock)
            .query(`
                INSERT INTO Books (title, author, stock)
                OUTPUT INSERTED.*
                VALUES (@title, @author, @stock)
            `);

        return res.status(201).json(result.recordset[0]);

    } catch (error) {
        if (error.number === 2627 || error.number === 2601) {
            return res.status(409).json({ error: 'Ya existe un libro con ese título y autor' });
        }
        console.error('[createBook]', error);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
};

const getAllBooks = async (req, res) => {
    try {
        const pool = await getPool();

        const result = await pool.request()
            .query('SELECT id, title, author, stock FROM Books ORDER BY id');

        return res.json(result.recordset);

    } catch (error) {
        console.error('[getAllBooks]', error);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
};

const getBookById = async (req, res) => {
    const { id } = req.params;

    try {
        const pool = await getPool();

        const result = await pool.request()
            .input('id', sql.Int, id)
            .query('SELECT id, title, author, stock FROM Books WHERE id = @id');

        if (result.recordset.length === 0) {
            return res.status(404).json({ error: 'Libro no encontrado' });
        }

        return res.json(result.recordset[0]);

    } catch (error) {
        console.error('[getBookById]', error);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
};

const updateBook = async (req, res) => {
    const { id } = req.params;
    const { title, author, stock } = req.body;

    if (!title || !author || stock == null) {
        return res.status(400).json({ error: 'Los campos título, autor y stock son obligatorios' });
    }

    if (!Number.isInteger(Number(stock)) || stock < 0) {
        return res.status(400).json({ error: 'El stock debe ser un número entero no negativo' });
    }

    try {
        const pool = await getPool();

        const result = await pool.request()
            .input('id', sql.Int, id)
            .input('title', sql.NVarChar(100), title)
            .input('author', sql.NVarChar(150), author)
            .input('stock', sql.Int, stock)
            .query(`
                UPDATE Books
                SET title  = @title,
                    author = @author,
                    stock  = @stock
                OUTPUT INSERTED.*
                WHERE id = @id
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({ error: 'Libro no encontrado' });
        }

        return res.json(result.recordset[0]);

    } catch (error) {
        if (error.number === 2627 || error.number === 2601) {
            return res.status(409).json({ error: 'Ya existe un libro con ese título y autor' });
        }
        console.error('[updateBook]', error);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
};

module.exports = { createBook, getAllBooks, getBookById, updateBook };