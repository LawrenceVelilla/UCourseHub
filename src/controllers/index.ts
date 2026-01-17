import express from "express";
import router from "./rmproutes";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/rmp", router);

app.get("/", (req, res) => {
    res.send("Server is running");
});

app.listen(3000, () => {
    console.log("Server started on port 3000");
});
