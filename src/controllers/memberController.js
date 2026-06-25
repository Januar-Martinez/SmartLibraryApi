const { getPool, sql } = require('../config/database');

const createMember = async (req, res) => {
    const { name, email } = req.body;

    if (!name || !email) {
        return res.status(400).json({ error: 'Los campos nombre y email son obligatorios' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'El formato del email no es válido' });
    }

    try {
        const pool = await getPool();

        const result = await pool.request()
            .input('name', sql.NVarChar(100), name)
            .input('email', sql.NVarChar(150), email)
            .query(`
                INSERT INTO Members (name, email)
                OUTPUT INSERTED.*
                VALUES (@name, @email)
            `);

        return res.status(201).json(result.recordset[0]);

    } catch (error) {
        if (error.number === 2627 || error.number === 2601) {
            return res.status(409).json({ error: 'Ya existe un miembro con ese email' });
        }
        console.error('[createMember]', error);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
};

const getAllMembers = async (req, res) => {
    try {
        const pool = await getPool();

        const result = await pool.request()
            .query('SELECT id, name, email, isActive FROM Members ORDER BY id');

        return res.json(result.recordset);

    } catch (error) {
        console.error('[getAllMembers]', error);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
};

const getMemberById = async (req, res) => {
    const { id } = req.params;

    try {
        const pool = await getPool();

        const result = await pool.request()
            .input('id', sql.Int, id)
            .query('SELECT id, name, email, isActive FROM Members WHERE id = @id');

        if (result.recordset.length === 0) {
            return res.status(404).json({ error: 'Miembro no encontrado' });
        }

        return res.json(result.recordset[0]);

    } catch (error) {
        console.error('[getMemberById]', error);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
};

const updateMember = async (req, res) => {
    const { id } = req.params;
    const { name, email, isActive } = req.body;

    if (!name || !email || isActive == null) {
        return res.status(400).json({ error: 'Los campos nombre, email y estado son obligatorios' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'El formato del email no es válido' });
    }

    try {
        const pool = await getPool();

        const result = await pool.request()
            .input('id', sql.Int, id)
            .input('name', sql.NVarChar(100), name)
            .input('email', sql.NVarChar(150), email)
            .input('isActive', sql.Bit, isActive)
            .query(`
                UPDATE Members
                SET name     = @name,
                    email    = @email,
                    isActive = @isActive
                OUTPUT INSERTED.*
                WHERE id = @id
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({ error: 'Miembro no encontrado' });
        }

        return res.json(result.recordset[0]);

    } catch (error) {
        if (error.number === 2627 || error.number === 2601) {
            return res.status(409).json({ error: 'El email ya está en uso por otro miembro' });
        }
        console.error('[updateMember]', error);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
};

module.exports = { createMember, getAllMembers, getMemberById, updateMember };