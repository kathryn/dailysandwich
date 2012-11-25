Sandwich = require "../models/sandwich"

class SandwichCollection extends Backbone.Collection
  model: Sandwich,
  url: "/sandwiches"

module.exports = SandwichCollection