const express = require("express");
const router = express.Router();
const db = require("./db");

// GET: Ingredientes
router.get("/ingredientes", async (req, res) => {
    try {
        const bordas = await db.query("SELECT * FROM bordas");
        const massas = await db.query("SELECT * FROM massas");
        const sabores = await db.query("SELECT * FROM sabores");

        res.json({
            bordas: bordas.rows,
            massas: massas.rows,
            sabores: sabores.rows
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// GET: Status
router.get("/status", async (req, res) => {
    try {
        const status = await db.query("SELECT * FROM status");

        res.json(status.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// POST: Criar Pedido
router.post("/pedidos", async (req, res) => {
    const { borda, massa, sabores } = req.body;

    try {

        // Cria a pizza
        const pizza = await db.query(
            `
            INSERT INTO pizzas (borda_id, massa_id)
            VALUES ($1, $2)
            RETURNING id
            `,
            [borda, massa]
        );

        const pizzaId = pizza.rows[0].id;

        // Adiciona os sabores
        const saborQueries = sabores.map((saborId) =>
            db.query(
                `
                INSERT INTO pizza_sabor (pizza_id, sabor_id)
                VALUES ($1, $2)
                `,
                [pizzaId, saborId]
            )
        );

        await Promise.all(saborQueries);

        // Cria o pedido
        await db.query(
            `
            INSERT INTO pedidos (pizza_id, status_id)
            VALUES ($1, 1)
            `,
            [pizzaId]
        );

        res.json({
            msg: "Pedido realizado com sucesso!"
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: "Erro ao processar pedido."
        });
    }
});

// GET: Listar Pedidos
router.get("/pedidos", async (req, res) => {

    try {

        const query = `
            SELECT
                p.id,
                s.tipo AS status,
                b.tipo AS borda,
                m.tipo AS massa,
                STRING_AGG(sab.nome, ', ') AS sabores

            FROM pedidos p

            JOIN status s
                ON p.status_id = s.id

            JOIN pizzas pi
                ON p.pizza_id = pi.id

            JOIN bordas b
                ON pi.borda_id = b.id

            JOIN massas m
                ON pi.massa_id = m.id

            JOIN pizza_sabor ps
                ON pi.id = ps.pizza_id

            JOIN sabores sab
                ON ps.sabor_id = sab.id

            GROUP BY
                p.id,
                s.tipo,
                b.tipo,
                m.tipo

            ORDER BY p.id;
        `;

        const pedidos = await db.query(query);

        const result = pedidos.rows.map((pedido) => ({
            ...pedido,
            sabores: pedido.sabores
                ? pedido.sabores.split(", ")
                : []
        }));

        res.json(result);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: error.message
        });
    }
});

// PUT: Atualizar Status
router.put("/pedidos/:id", async (req, res) => {

    const { status } = req.body;

    try {

        await db.query(
            `
            UPDATE pedidos
            SET status_id = $1
            WHERE id = $2
            `,
            [status, req.params.id]
        );

        res.json({
            msg: "Status atualizado!"
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: error.message
        });
    }
});

// DELETE: Remover Pedido
router.delete("/pedidos/:id", async (req, res) => {

    try {

        await db.query(
            `
            DELETE FROM pedidos
            WHERE id = $1
            `,
            [req.params.id]
        );

        res.json({
            msg: "Pedido removido!"
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: error.message
        });
    }
});

module.exports = router;