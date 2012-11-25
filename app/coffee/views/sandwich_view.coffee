Sandwich = require '../models/sandwich'

class SandwichView extends Backbone.View

  tagName: "li"
  className: "sandwich_item"

  events:
    "click .remove": "removeSandwich"

  template_html: 
    """
      <div class="body"><b><%= description %> - $<%= price %></b></div>
      <a class="btn btn-small remove" ><i class="icon-remove"></i></a>
    """

  initialize: ->
    this.model.on( 'destroy', this.remove, this );

  render: ->
    $(this.el).html _.template(this.template_html, this.model.toJSON())
    return this

  removeSandwich: ->
    this.model.destroy()

module.exports = SandwichView