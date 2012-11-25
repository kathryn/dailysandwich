class Sandwich extends Backbone.Model

  urlRoot: "/sandwiches"
  idAttribute: "_id"

  initialize: ->

  validation:
    description:
      required: true
      minLength: 10
    price:
      required: true
      pattern: "number"
      min:0

  defaults:
    description: "Tasty something between two slices of bread"
    price: 9

module.exports = Sandwich