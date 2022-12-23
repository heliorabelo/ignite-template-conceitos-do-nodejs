const express = require('express');
const cors = require('cors');

const { v4: uuidv4 } = require('uuid');

const app = express();

app.use(cors());
app.use(express.json());

const users = [];

function checksExistsUserAccount(request, response, next) {

  const { username } = request.headers;

  if (typeof username === 'undefined') {
    return response.status(404).json({
      error: "Username not submitted"
    })
  }

  const user = users.find(user => user.username === username);

  if (!user) {
    return response.status(404).json({
      error: "User not found"
    })
  }

  request.user = user;

  return next();

}

function checkExistsTodo(request, response, next) {
  const { user } = request;

  const { id } = request.params;

  const todo = user.todos.some(todo => todo.id === id);

  if (!todo) {
    return response.status(404).json({
      error: "Todo not exists"
    })
  }

  return next();
}

app.post('/users', (request, response) => {
  const { name, username } = request.body;

  const userAlreadyExists = users.some(user => user.username === username);

  if (userAlreadyExists) {
    return response.status(400).json({
      error: "Username already exists"
    })
  }

  const user = {
    id: uuidv4(),
    name,
    username,
    todos: []
  }

  users.push(user)

  return response.status(201).json(user);
});

app.get('/todos', checksExistsUserAccount, (request, response) => {
  const { user } = request;

  return response.json(user.todos);
});

app.post('/todos', checksExistsUserAccount, (request, response) => {
  const { title, deadline } = request.body;

  const { user } = request;

  const todo = {
    id: uuidv4(),
    title,
    done: false,
    deadline: new Date(deadline),
    created_at: new Date()
  }

  user.todos.push(todo);

  return response.status(201).json(todo);
});

app.put('/todos/:id', checksExistsUserAccount, checkExistsTodo, (request, response) => {
  const { user } = request;

  const { id } = request.params;

  const { title, deadline } = request.body;

  const todoIndex = user.todos.findIndex(todo => todo.id === id);

  /*
  user.todos[todoIndex] = {
    ...user.todos[todoIndex],
    ... {
      title,
      deadline
    }
  }
*/

  user.todos[todoIndex].title = title;
  user.todos[todoIndex].deadline = deadline;

  return response.status(201).json(user.todos[todoIndex]);
});

app.patch('/todos/:id/done', checksExistsUserAccount, checkExistsTodo, (request, response) => {
  const { user } = request;

  const { id } = request.params;

  const todoIndex = user.todos.findIndex(todo => todo.id === id);

  user.todos[todoIndex].done = true;

  return response.status(201).json(user.todos[todoIndex]);
});

app.delete('/todos/:id', checksExistsUserAccount, checkExistsTodo, (request, response) => {
  const { user } = request;
  const { id } = request.params;

  const todo = user.todos.filter(todo => todo.id !== id);

  if (!todo) {
    return response.status(404).json({
      error: "Todo not found"
    })
  }

  user.todos = todo;

  return response.status(204).send();
});

module.exports = app;