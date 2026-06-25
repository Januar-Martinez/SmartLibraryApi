const { getPool, sql } = require('../config/database');

const createLoan = async (req, res) => {
    const { memberId, bookId, dueDate } = req.body;

    if (!memberId || !bookId || !dueDate) {
        return res.status(400).json({ error: 'Los campos memberId, bookId y dueDate son obligatorios' });
    }

    if (isNaN(Date.parse(dueDate))) {
        return res.status(400).json({ error: 'El formato de dueDate no es válido' });
    }

    if (new Date(dueDate) <= new Date()) {
        return res.status(400).json({ error: 'La fecha de vencimiento debe ser posterior a hoy' });
    }

    try {
        const pool = await getPool();
        const transaction = pool.transaction();
        await transaction.begin();

        try {
            const bookResult = await transaction.request()
                .input('bookId', sql.Int, bookId)
                .query('SELECT stock FROM Books WHERE id = @bookId');

            if (bookResult.recordset.length === 0) {
                await transaction.rollback();
                return res.status(404).json({ error: 'Libro no encontrado' });
            }

            if (bookResult.recordset[0].stock <= 0) {
                await transaction.rollback();
                return res.status(409).json({ error: 'El libro no tiene stock disponible' });
            }

            const overlapResult = await transaction.request()
                .input('memberId', sql.Int, memberId)
                .input('bookId', sql.Int, bookId)
                .input('dueDate', sql.Date, dueDate)
                .query(`
                    SELECT id FROM Loans
                    WHERE memberId   = @memberId
                      AND bookId     = @bookId
                      AND returnDate IS NULL
                      AND loanDate   <= @dueDate
                      AND DueDate    >= GETDATE()
                `);

            if (overlapResult.recordset.length > 0) {
                await transaction.rollback();
                return res.status(409).json({ error: 'El miembro ya tiene un préstamo activo de este libro en esas fechas' });
            }

            const loanResult = await transaction.request()
                .input('memberId', sql.Int, memberId)
                .input('bookId', sql.Int, bookId)
                .input('dueDate', sql.Date, dueDate)
                .query(`
                    INSERT INTO Loans (memberId, bookId, dueDate)
                    OUTPUT INSERTED.*
                    VALUES (@memberId, @bookId, @dueDate)
                `);

            await transaction.request()
                .input('bookId', sql.Int, bookId)
                .query('UPDATE Books SET stock = stock - 1 WHERE id = @bookId');

            await transaction.commit();
            return res.status(201).json(loanResult.recordset[0]);

        } catch (innerError) {
            await transaction.rollback();
            throw innerError;
        }

    } catch (error) {
        console.error('[createLoan]', error);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
};

const getAllLoans = async (req, res) => {
    try {
        const pool = await getPool();

        const result = await pool.request()
            .query(`
                SELECT
                    l.id,
                    l.memberId,
                    m.name  AS memberName,
                    l.bookId,
                    b.title AS bookTitle,
                    l.loanDate,
                    l.DueDate,
                    l.returnDate,
                    CASE
                        WHEN l.returnDate IS NOT NULL        THEN 'Returned'
                        WHEN l.DueDate    <  CAST(GETDATE() AS DATE) THEN 'Overdue'
                        ELSE 'Active'
                    END AS status
                FROM Loans l
                INNER JOIN Members m ON l.memberId = m.id
                INNER JOIN Books   b ON l.bookId   = b.id
                ORDER BY l.id
            `);

        return res.json(result.recordset);

    } catch (error) {
        console.error('[getAllLoans]', error);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
};

const getLoanById = async (req, res) => {
    const { id } = req.params;

    try {
        const pool = await getPool();

        const result = await pool.request()
            .input('id', sql.Int, id)
            .query(`
                SELECT
                    l.id,
                    l.memberId,
                    m.name  AS memberName,
                    l.bookId,
                    b.title AS bookTitle,
                    l.loanDate,
                    l.DueDate,
                    l.returnDate,
                    CASE
                        WHEN l.returnDate IS NOT NULL        THEN 'Returned'
                        WHEN l.DueDate    <  CAST(GETDATE() AS DATE) THEN 'Overdue'
                        ELSE 'Active'
                    END AS status
                FROM Loans l
                INNER JOIN Members m ON l.memberId = m.id
                INNER JOIN Books   b ON l.bookId   = b.id
                WHERE l.id = @id
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({ error: 'Préstamo no encontrado' });
        }

        return res.json(result.recordset[0]);

    } catch (error) {
        console.error('[getLoanById]', error);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
};

const returnLoan = async (req, res) => {
    const { id } = req.params;

    try {
        const pool = await getPool();
        const transaction = pool.transaction();
        await transaction.begin();

        try {
            const loanResult = await transaction.request()
                .input('id', sql.Int, id)
                .query('SELECT id, bookId, returnDate FROM Loans WHERE id = @id');

            if (loanResult.recordset.length === 0) {
                await transaction.rollback();
                return res.status(404).json({ error: 'Préstamo no encontrado' });
            }

            if (loanResult.recordset[0].returnDate !== null) {
                await transaction.rollback();
                return res.status(409).json({ error: 'Este préstamo ya fue devuelto' });
            }

            const { bookId } = loanResult.recordset[0];

            const updated = await transaction.request()
                .input('id', sql.Int, id)
                .query(`
                    UPDATE Loans
                    SET returnDate = CAST(GETDATE() AS DATE)
                    OUTPUT INSERTED.*
                    WHERE id = @id
                `);

            await transaction.request()
                .input('bookId', sql.Int, bookId)
                .query('UPDATE Books SET stock = stock + 1 WHERE id = @bookId');

            await transaction.commit();
            return res.json(updated.recordset[0]);

        } catch (innerError) {
            await transaction.rollback();
            throw innerError;
        }

    } catch (error) {
        console.error('[returnLoan]', error);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
};

module.exports = { createLoan, getAllLoans, getLoanById, returnLoan };