const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const dbPath = path.join(__dirname, "todoApplication.db");

const app = express();

app.use(express.json());

let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const hasPriorityParam = (reqQuery) => {
  return reqQuery.priority !== undefined;
};
const hasStatusParam = (reqQuery) => {
  return reqQuery.status !== undefined;
};
const hasPriorityandStatus = (reqQuery) => {
  return reqQuery.priority !== undefined && reqQuery.status !== undefined;
};
const hasSearch_qParam = (reqQuery) => {
  return reqQuery.search_q !== undefined;
};

//API3
app.post("/todos/", async (req, res) => {
  const todoDetails = req.body;
  const { id, todo, priority, status } = todoDetails;
  const insertTodo = `
    INSERT INTO todo (id, todo, priority, status)
    VALUES (
         ${id},
        '${todo}',
        '${priority}',
        '${status}'
    );`;
  const dbresponse = await database.run(insertTodo);
  res.send("Todo Successfully Added");
});

//API 1
app.get("/todos/", async (req, res) => {
  const { search_q = "", priority, status } = req.query;
  let getTodosQuery = "";
  switch (true) {
    case hasPriorityandStatus(req.query):
      getTodosQuery = `select * from todo where priority = '${priority}' and status = '${status}'; `;
      break;
    case hasPriorityParam(req.query):
      getTodosQuery = `select * from todo where priority = '${priority}';`;
      break;
    case hasStatusParam(req.query):
      getTodosQuery = `select * from todo where status = '${status}'; `;
      break;
    default:
      getTodosQuery = `select * from todo where todo LIKE '%${search_q}%'; `;
      break;
  }
  const data = await database.all(getTodosQuery);
  res.send(data);
});

//API2
app.get("/todos/:todoId", async (req, res) => {
  const { todoId } = req.params;
  const getTodoIdQuery = `
    select * from todo where id = ${todoId};`;
  const todo = await database.get(getTodoIdQuery);
  res.send(todo);
});

//API4
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updateColumn = "";
  const requestBody = request.body;
  switch (true) {
    case requestBody.status !== undefined:
      updateColumn = "Status";
      break;
    case requestBody.priority !== undefined:
      updateColumn = "Priority";
      break;
    case requestBody.todo !== undefined:
      updateColumn = "Todo";
      break;
  }
  const previousTodoQuery = `
    SELECT
      *
    FROM
      todo
    WHERE 
      id = ${todoId};`;
  const previousTodo = await database.get(previousTodoQuery);

  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
  } = request.body;

  const updateTodoQuery = `
    UPDATE
      todo
    SET
      todo='${todo}',
      priority='${priority}',
      status='${status}'
    WHERE
      id = ${todoId};`;

  await database.run(updateTodoQuery);
  response.send(`${updateColumn} Updated`);
});

//API5
app.delete("/todos/:todoId", async (req, res) => {
  const { todoId } = req.params;
  const deleteTodoId = `DELETE FROM todo where id = ${todoId};`;
  await database.run(deleteTodoId);
  res.send("Todo Deleted");
});

module.exports = app;
