(function() {
  var BSON, Db, Server, db, mongo, populateDB, server;

  mongo = require('mongodb');

  Server = mongo.Server;

  Db = mongo.Db;

  BSON = mongo.BSONPure;

  server = new Server('localhost', 27017, {
    auto_reconnect: true
  });

  db = new Db('sandwichdb', server);

  db.open(function(err, db) {
    if (!err) {
      console.log("Connected to 'sandwichdb' database");
      return db.collection('sandwiches', {
        safe: true
      }, function(err, collection) {
        if (err) {
          console.log("The 'sandwiches' collection doesn't exist. Creating it with sample data...");
          return populateDB();
        }
      });
    }
  });

  exports.findById = function(req, res) {
    var id;
    id = req.params.id;
    console.log('Retrieving sandwich: ' + id);
    return db.collection('sandwiches', function(err, collection) {
      return collection.findOne({
        '_id': new BSON.ObjectID(id)
      }, function(err, item) {
        return res.send(item);
      });
    });
  };

  exports.findAll = function(req, res) {
    return db.collection('sandwiches', function(err, collection) {
      return collection.find().toArray(function(err, items) {
        return res.send(items);
      });
    });
  };

  exports.addSandwich = function(req, res) {
    var sandwich;
    sandwich = req.body;
    console.log('Adding sandwich: ' + JSON.stringify(sandwich));
    return db.collection('sandwiches', function(err, collection) {
      return collection.insert(sandwich, {
        safe: true
      }, function(err, result) {
        if (err) {
          return res.send({
            'error': 'An error has occurred'
          });
        } else {
          console.log('Success: ' + JSON.stringify(result[0]));
          return res.send(result[0]);
        }
      });
    });
  };

  exports.updateSandwich = function(req, res) {
    var id, sandwich;
    id = req.params.id;
    sandwich = req.body;
    console.log('Updating sandwich: ' + id);
    console.log(JSON.stringify(sandwich));
    return db.collection('sandwiches', function(err, collection) {
      return collection.update({
        '_id': new BSON.ObjectID(id)
      }, sandwich, {
        safe: true
      }, function(err, result) {
        if (err) {
          console.log('Error updating sandwich: ' + err);
          return res.send({
            'error': 'An error has occurred'
          });
        } else {
          console.log('' + result + ' document(s) updated');
          return res.send(sandwich);
        }
      });
    });
  };

  exports.deleteSandiwch = function(req, res) {
    var id;
    id = req.params.id;
    console.log('Deleting sandwich: ' + id);
    return db.collection('sandwiches', function(err, collection) {
      return collection.remove({
        '_id': new BSON.ObjectID(id)
      }, {
        safe: true
      }, function(err, result) {
        if (err) {
          return res.send({
            'error': 'An error has occurred - ' + err
          });
        } else {
          console.log('' + result + ' document(s) deleted');
          return res.send(req.body);
        }
      });
    });
  };

  populateDB = function() {
    var sandwiches;
    sandwiches = [
      {
        description: "Aleppo-pomegranate rstd chicken/Acme roll, avocado crema, cucumber, corn chips, tabasco mayo, greens",
        price: "9"
      }, {
        description: "Marin Sun roast beef/Firebrand challah roll, BBQ sauce, buttermilk blue cheese slaw, crispy shallots, wild arugula, rstd. shallot mayo",
        price: "9"
      }
    ];
    return db.collection('sandwiches', function(err, collection) {
      return collection.insert(sandwiches, {
        safe: true
      }, function(err, result) {
        return console.log(result.length + " sandwiches inserted");
      });
    });
  };

}).call(this);
