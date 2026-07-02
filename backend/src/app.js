const express = require("express");
const db = require("./config/db");

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
    res.send("🚆 Railway Route Backend is Running!");
});

app.get("/trains", async (req, res) => {
    try {
        const result = await db.query(
            "SELECT * FROM train_schedule LIMIT 10"
        );

        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({
            message: "Database Error"
        });
    }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
