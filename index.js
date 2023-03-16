require("dotenv").config();
const express = require("express");
const morgan = require("morgan");
const app = express();
const cors = require("cors");
const Person = require("./models/person");

app.use(express.json());
app.use(cors());
app.use(express.static("build"));

const requestLogger = morgan("tiny", {
  skip: (request, response) => {
    return request.method === "POST";
  },
});

morgan.token("body", (request, response) => {
  return JSON.stringify(request.body);
});

const postLogger = morgan(
  ":method :url :status :res[content-length] - :response-time ms :body",
  {
    skip: (request, response) => {
      return request.method !== "POST";
    },
  }
);

const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: "unknown endpoint" });
};

const errorHandler = (error, request, response, next) => {
  console.error(error);

  if (error.name === "CastError") {
    response.status(400).send({ error: "malformatted id" });
  } else if (error.name === "ValidationError") {
    response.status(400).send({ error: error.message });
  } else if (error.name === "PersonExistenceError") {
    response.status(404).send({ error: error.message });
  }

  next(error);
};

app.use(requestLogger);
app.use(postLogger);

app.get("/info", (request, response) => {
  Person.find({}).then((persons) => {
    const personCount = persons.length;
    const date = new Date();
    const options = {
      weekday: "short",
      month: "short",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      hour12: false,
      minute: "2-digit",
      second: "2-digit",
      timeZone: "Europe/Bucharest",
      timeZoneName: "long",
    };
    const formattedDate = date
      .toLocaleString("en-US", options)
      .replace(",", "")
      .replace(",", "")
      .replace(",", "");

    const message = `
  <p>Phonebook has info for ${personCount} people</p>
  <p>${formattedDate}</p>`;

    response.send(message);
  });
});

app.get("/api/persons", (request, response) => {
  Person.find({}).then((persons) => response.json(persons));
});

app.get("/api/persons/:id", (request, response, next) => {
  Person.findById(request.params.id)
    .then((person) => {
      if (person) {
        response.json(person);
      } else {
        response.status(404).send({ error: "person not found" });
      }
    })
    .catch((error) => next(error));
});

const generateID = () => {
  return Math.floor(Math.random() * 100000);
};

app.post("/api/persons", (request, response, next) => {
  const body = request.body;
  // const inPhonebook = persons.find((person) => body.name === person.name);

  if (body.name === undefined) {
    return response.status(400).json({ error: "name missing" });
  } else if (body.number === undefined) {
    return response.status(400).json({ error: "number missing" });
  }
  // else if (inPhonebook) {
  //   return response.status(400).json({ error: "name must be unique" });
  // }

  const person = new Person({
    name: body.name,
    number: body.number,
  });

  person
    .save()
    .then((savedPerson) => {
      response.json(savedPerson);
    })
    .catch((error) => next(error));
});

app.put("/api/persons/:id", (request, response, next) => {
  const { name, number } = request.body;
  console.log(request.params.id);
  Person.findByIdAndUpdate(
    request.params.id,
    { name, number },
    {
      new: true,
      runValidators: true,
      context: "query",
    }
  )
    .then((updatedPerson) => {
      if (!updatedPerson) {
        const error = new Error("Person not found");
        error.status = 404;
        error.name = "PersonExistenceError";
        throw error;
      }
      response.json(updatedPerson);
    })
    .catch((error) => {
      next(error);
    });
});

app.delete("/api/persons/:id", (request, response) => {
  Person.findByIdAndDelete(request.params.id)
    .then((result) => {
      response.status(204).end();
    })
    .catch((error) => next(error));
});

app.use(unknownEndpoint);
app.use(errorHandler);

const PORT = process.env.PORT;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
