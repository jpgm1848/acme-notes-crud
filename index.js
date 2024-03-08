const pg = require("pg");
const client = new pg.Client(
  process.env.DATABSE_URL || "postgres://localhost/acme_notes_crud_db"
);
const express = require("express");
const app = express();
const morgan = require("morgan");

app.use(express.json());
app.use(morgan("dev"));

app.get("/api/notes", async (req, res, next) => {
  try {
    const SQL = `
    SELECT *
    FROM NOTES
    ORDER BY ranking DESC
    `;
    const response = await client.query(SQL);
    res.send(response.rows);
  } catch (ex) {
    next(ex);
  }
});

app.post("/api/notes", async (req, res, next) => {
  try {
    const SQL = `
    INSERT INTO notes(txt, ranking)
    VALUES ($1, $2)
    RETURNING * 
    `;
    const response = await client.query([req.body.txt, req.body.ranking]);
    res.send(response.rows[0]);
  } catch (ex) {
    next(ex);
  }
});

app.put("/api/notes/:id", async (req, res, next) => {
  try {
    const SQL = `
    UPDATE notes
    SET txt=$1, ranking=$2, updated_at=now()
    WHERE id = $3
    RETURNING *
    `;
    const response = await client.query([
      req.body.txt,
      req.body.ranking,
      req.params.id,
    ]);
    res.send(response.rows[0]);
  } catch (ex) {
    next(ex);
  }
});

app.get("/api/notes/:id", async (req, res, next) => {
  try {
    const SQL = `
    SELECT *
    FROM NOTES
    WHERE id = $1
    `;
    const response = await client.query(SQL, [req.params.id]);
    res.send(response.rows[0]);
  } catch (ex) {
    next(ex);
  }
});

app.delete("/api/notes/:id", async (req, res, next) => {
  try {
    const SQL = `
    DELETE
    FROM NOTES
    WHERE id = $1
    `;
    await client.query(SQL, [req.params.id]);
    res.sendStatus(204);
  } catch (ex) {
    next(ex);
  }
});


app.use((err, req, res, next) => {
  console.log(err);
  res.status(err.status || 500).send({ message: err.message || err });
});

const init = async () => {
  console.log("connecting to database");
  await client.connect();
  console.log("connected to database");
  let SQL = `
  DROP TABLE IF EXISTS notes;
  CREATE TABLE notes(
    id SERIAL PRIMARY KEY,
    txt VARCHAR(100) NOT NULL,
    ranking INTEGER NOT NULL DEFAULT 5,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
  );
  `;
  await client.query(SQL);
  console.log("tables created");

  SQL = `
    INSERT INTO notes(txt) VALUES('hello');
    INSERT INTO notes(txt, ranking) VALUES('world', 3);
    INSERT INTO notes(ranking, txt) VALUES (3, 'hello world again!');
  `;
  await client.query(SQL);
  console.log("data seeded");

  const port = process.env.PORT || 3001;
  app.listen(port, () => console.log(`listening on port ${port}`));
};

init();
