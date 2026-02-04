const express = require("express");
const router = express.Router();
const db = require("./db");

// GET: Ingredientes
router.get("/ingredientes", async (req, res) => {
    try {
        const [bordas] = await db.query("SELECT * FROM bordas");
        const [massas] = await db.query("SELECT * FROM massas");
        const [sabores] = await db.query("SELECT * FROM sabores");
        res.json({ bordas, massas, sabores });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// GET: Status
router.get("/status", async (req, res) => {
    const [status] = await db.query("SELECT * FROM status");
    res.json(status);
});

// POST: Criar Pedido
router.post("/pedidos", async (req, res) => {
    const { borda, massa, sabores } = req.body;
    try {
        const [resPizza] = await db.query("INSERT INTO pizzas (borda_id, massa_id) VALUES (?, ?)", [borda, massa]);
        const pizzaId = resPizza.insertId;

        const saborQueries = sabores.map(saborId => 
            db.query("INSERT INTO pizza_sabor (pizza_id, sabor_id) VALUES (?, ?)", [pizzaId, saborId])
        );
        await Promise.all(saborQueries);

        await db.query("INSERT INTO pedidos (pizza_id, status_id) VALUES (?, 1)", [pizzaId]);
        res.json({ msg: "Pedido realizado com sucesso!" });
    } catch (error) { res.status(500).json({ error: "Erro ao processar pedido" }); }
});

// GET: Listar Pedidos
router.get("/pedidos", async (req, res) => {
    const query = `
        SELECT p.id, s.tipo as status, b.tipo as borda, m.tipo as massa,
        GROUP_CONCAT(sab.nome SEPARATOR ', ') as sabores
        FROM pedidos p
        JOIN status s ON p.status_id = s.id
        JOIN pizzas pi ON p.pizza_id = pi.id
        JOIN bordas b ON pi.borda_id = b.id
        JOIN massas m ON pi.massa_id = m.id
        JOIN pizza_sabor ps ON pi.id = ps.pizza_id
        JOIN sabores sab ON ps.sabor_id = sab.id
        GROUP BY p.id
    `;
    const [pedidos] = await db.query(query);
    const result = pedidos.map(p => ({ ...p, sabores: p.sabores ? p.sabores.split(', ') : [] }));
    res.json(result);
});

// PUT: Atualizar Status
router.put("/pedidos/:id", async (req, res) => {
    const { status } = req.body;
    await db.query("UPDATE pedidos SET status_id = ? WHERE id = ?", [status, req.params.id]);
    res.json({ msg: "Status atualizado!" });
});

// DELETE: Remover Pedido
router.delete("/pedidos/:id", async (req, res) => {
    await db.query("DELETE FROM pedidos WHERE id = ?", [req.params.id]);
    res.json({ msg: "Pedido removido!" });
});

module.exports = router;
