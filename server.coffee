express     = require "express"
path        = require "path"
http        = require "http"

sandwich    = require "./routes/sandwiches"

app = express();

app.configure () ->
  app.set 'port', process.env.PORT || 3000
  app.use express.logger('dev');
  app.use express.bodyParser();
  app.use express.static(path.join __dirname, 'app')


app.get '/sandwiches', sandwich.findAll
app.get '/sandwiches/:id', sandwich.findById
app.post '/sandwiches', sandwich.addSandwich
app.put '/sandwiches/:id', sandwich.updateSandwich
app.delete '/sandwiches/:id', sandwich.deleteSandwich

http.createServer(app).listen app.get('port'), ->
  console.log 'express listening on port ' + app.get("port")

