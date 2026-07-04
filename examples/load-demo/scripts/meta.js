// A `json` source: whatever it prints to stdout is parsed as JSON and
// bound to the def named by the alias (`meta`). Any program in any
// language works — it just has to emit JSON.
console.log(JSON.stringify({ version: '0.4.0', date: '2026-07-05' }));
