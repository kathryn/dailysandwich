mongo = require 'mongodb'

Server = mongo.Server
Db = mongo.Db
BSON = mongo.BSONPure

server = new Server 'localhost', 27017, {auto_reconnect: true}
db = new Db 'sandwichdb', server

db.open (err, db) ->
  if !err
    console.log "Connected to 'sandwichdb' database"
    db.collection 'sandwiches', {safe:true}, (err, collection) ->
      if err
        console.log "The 'sandwiches' collection doesn't exist. Creating it with sample data..."
        populateDB()

exports.findById = (req, res) ->
  id = req.params.id
  console.log('Retrieving sandwich: ' + id)
  db.collection 'sandwiches', (err, collection) ->
    collection.findOne {'_id':new BSON.ObjectID(id)}, (err, item) ->
      res.send(item)

exports.findAll = (req, res) ->
  db.collection 'sandwiches', (err, collection) ->
    collection.find().toArray (err, items) ->
      res.send(items)
        

exports.addSandwich = (req, res) ->
  sandwich = req.body;
  console.log('Adding sandwich: ' + JSON.stringify(sandwich));
  db.collection 'sandwiches', (err, collection) ->
    collection.insert sandwich, {safe:true}, (err, result) ->
      if err
        res.send({'error':'An error has occurred'});
      else
        console.log('Success: ' + JSON.stringify(result[0]));
        res.send(result[0]);
          

exports.updateSandwich = (req, res) ->
  id = req.params.id
  sandwich = req.body
  console.log('Updating sandwich: ' + id)
  console.log(JSON.stringify(sandwich))
  db.collection 'sandwiches', (err, collection) ->
    collection.update {'_id':new BSON.ObjectID(id)}, sandwich, {safe:true}, (err, result) ->
      if err
        console.log('Error updating sandwich: ' + err);
        res.send({'error':'An error has occurred'});
      else
        console.log('' + result + ' document(s) updated');
        res.send(sandwich);
            

exports.deleteSandiwch = (req, res) ->
  id = req.params.id
  console.log('Deleting sandwich: ' + id)
  db.collection 'sandwiches', (err, collection) ->
    collection.remove {'_id':new BSON.ObjectID(id)}, {safe:true}, (err, result) ->
      if err
        res.send {'error':'An error has occurred - ' + err}
      else
        console.log '' + result + ' document(s) deleted'
        res.send req.body;
          


populateDB = () ->
  sandwiches = [
      description: "Aleppo-pomegranate rstd chicken/Acme roll, avocado crema, cucumber, corn chips, tabasco mayo, greens"
      price: "9"
    ,
      description: "Marin Sun roast beef/Firebrand challah roll, BBQ sauce, buttermilk blue cheese slaw, crispy shallots, wild arugula, rstd. shallot mayo"
      price: "9"
  ];

  db.collection 'sandwiches', (err, collection) ->
      collection.insert sandwiches, {safe:true}, (err, result) ->
        console.log(result.length + " sandwiches inserted")
     

