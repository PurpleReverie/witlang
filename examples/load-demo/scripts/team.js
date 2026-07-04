// A `json` source returning an array → a collection of records, ready for
// `(each @team as person) … @person.name … (end)`.
console.log(
  JSON.stringify([
    { name: 'TauraJ', commits: 42 },
    { name: 'Ada Lovelace', commits: 17 },
  ]),
);
