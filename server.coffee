express = require "express"
sandwich = require "./routes/sandwiches"

app = express();

app.configure () ->
  app.use express.logger('dev');
  app.use express.bodyParser();


app.get '/sandwiches', sandwich.findAll
app.get '/sandwiches/:id', sandwich.findById
app.post '/sandwiches', sandwich.addSandwich
app.put '/sandwiches/:id', sandwich.updateSandwich
app.delete '/sandwiches/:id', sandwich.deleteSandwich

app.listen 3000
console.log 'Listening on port 3000...'