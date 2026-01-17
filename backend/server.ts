import app from "./app";

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/`);
    console.log(`RMP API: http://localhost:${PORT}/rmp`);
});
