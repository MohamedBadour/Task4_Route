import express from "express";
import fs from "fs";
import { fileURLToPath } from "url";

const app = express();
const FILE = fileURLToPath(new URL("./users.json", import.meta.url));

app.use(express.json());

const readUsers = () => {
  const data = fs.readFileSync(FILE, "utf-8");
  return data.trim() ? JSON.parse(data) : [];
};

const writeUsers = (users) => {
  fs.writeFileSync(FILE, JSON.stringify(users, null, 2));
};

// add user
app.post("/user", (req, res) => {
  const { name, age, email } = req.body;
  if (!name || !email) {
    return res.status(400).json({ message: "name and email are required." });
  }
  const users = readUsers();
  if (users.some((u) => u.email === email)) {
    return res.status(409).json({ message: "Email already exists." });
  }
  const id = users.length ? Math.max(...users.map((u) => u.id)) + 1 : 1;
  users.push({ id, name, age, email });
  writeUsers(users);
  res.status(201).json({ message: "User added successfully." });
});

// get user by name
app.get("/user/getByName", (req, res) => {
  const name = String(req.query.name).toLowerCase();
  const user = readUsers().find((u) => u.name.toLowerCase() === name);
  if (!user) return res.status(404).json({ message: "User name not found." });
  res.json(user);
});

// filter by min age
app.get("/user/filter", (req, res) => {
  const minAge = Number(req.query.minAge);
  const result = readUsers().filter((u) => u.age >= minAge);
  if (!result.length) return res.status(404).json({ message: "no user found" });
  res.json(result);
});

// get all users
app.get("/user", (req, res) => {
  res.json(readUsers());
});

// get user by id
app.get("/user/:id", (req, res) => {
  const user = readUsers().find((u) => u.id === Number(req.params.id));
  if (!user) return res.status(404).json({ message: "User not found." });
  res.json(user);
});

// update user
app.patch("/user/:id", (req, res) => {
  const users = readUsers();
  const index = users.findIndex((u) => u.id === Number(req.params.id));
  if (index === -1) {
    return res.status(404).json({ message: "User ID not found." });
  }
  const updated = [];
  for (const field of ["name", "age", "email"]) {
    if (req.body[field] === undefined) continue;
    if (
      field === "email" &&
      users.some((u, i) => i !== index && u.email === req.body.email)
    ) {
      return res.status(409).json({ message: "Email already exists." });
    }
    users[index][field] = req.body[field];
    updated.push(field);
  }
  if (!updated.length) {
    return res.status(400).json({ message: "Nothing to update." });
  }
  writeUsers(users);
  res.json({ message: `User ${updated.join(", ")} updated successfully.` });
});

// delete user (id from params or body)
app.delete("/user{/:id}", (req, res) => {
  const id = Number(req.params.id ?? req.body?.id);
  const users = readUsers();
  const index = users.findIndex((u) => u.id === id);
  if (index === -1) {
    return res.status(404).json({ message: "User ID not found." });
  }
  users.splice(index, 1);
  writeUsers(users);
  res.json({ message: "User deleted successfully." });
});

app.listen(3000, () => console.log("Server running on port 3000"));
