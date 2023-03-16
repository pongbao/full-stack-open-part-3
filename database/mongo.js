const mongoose = require("mongoose");
const appName = "phonebookApp";

const personSchema = new mongoose.Schema({
  name: String,
  number: String,
});

const Person = mongoose.model("Person", personSchema);

if (process.argv.length < 3) {
  console.log("give password as argument");
  process.exit(1);
}

const password = process.argv[2];
const name = process.argv[3];
const number = process.argv[4];

const url = `mongodb+srv://zt-phonebook:${password}@cluster0.ezgeaxv.mongodb.net/${appName}?retryWrites=true&w=majority`;

mongoose.set("strictQuery", false);
mongoose.connect(url);

if (process.argv.length < 4) {
  Person.find({}).then((persons) => {
    console.log("phonebook:");
    persons.forEach((person) => console.log(person.name, person.number));
    mongoose.connection.close();
  });
} else {
  const person = new Person({
    name: name,
    number: number,
  });

  person.save().then((result) => {
    console.log(`added ${result.name} number ${result.number} to phonebook`);
    mongoose.connection.close();
  });
}
