SandwichView = require './sandwich_view'
Sandwich = require '../models/sandwich'

class SandwichListView extends Backbone.View

  events:
    "click .create-sandwich"     :  "createSandwich"

  template_html:
      """ 
      <div>
        <form>
          <fieldset>
            <div class="description control-group">
              <label class="control-label" for="new_sandwich_description">Description</label>
              <div class="controls">
                <textarea id="new_sandwich_description" rows="3" 
                  placeholder="Today's crazy ass sandwich" class="input-xlarge"></textarea>
                <span class="help-inline"></span>
              </div>
            </div>
            <div class="price control-group">
              <label class='control-label' for="new_sandwich_price">Price</label>
              <div class="controls">
                $ <input id="new_sandwich_price" type="text" value="9" class="input-mini"></text>
                <span class="help-inline"></span>
              </div>
            </div>
            <div class="server_errors">
            </div>
          </fieldset>
          <a href="#sandwiches" class="btn btn-primary create-sandwich">Add today's sandwich</a>

        </form>
      </div>
      <ul class="sandwiches unstyled"></ul>
      """


  initialize: ->
    this.render()
    this.model.on('add', this.addOne, this)
    this.model.on('error', this.showInvalid, this)

  render: ->
    sandwiches = this.model.models
    $(this.el).html(this.template_html)

    for sandwich in sandwiches.reverse()
      view = new SandwichView(model:sandwich).render().el
      $('.sandwiches', this.el).append(view)

    $("#new_sandwich_price", this.el).keyup () ->
      this.value = this.value.replace(/[^0-9\.]/g,'')

    return this


  createSandwich: ->
    description = $("#new_sandwich_description").val()
    price = $("#new_sandwich_price").val()

    if this.model.create({description:description,price:price}, {error: this.showInvalid})
      $("#new_sandwich_description").val('')
      this.clearErrors()


  clearErrors: ->
    $('.description').removeClass('error').find('.help-inline').text('')
    $('.price').removeClass('error').find('.help-inline').text('')
    $('.server_errors').text('')

  addOne: (sandwich) ->
    view = new SandwichView({ model: sandwich });
    $('.sandwiches').prepend( view.render().el );

  showInvalid: (sandwich, error) =>
    this.clearErrors()
    if error.description
      $('.description').addClass('error').find('.help-inline').text(error.description)
    if error.price
      $('.price').addClass('error').find('.help-inline').text(error.price)
    if error.status?
      this.model.getByCid(sandwich.cid).destroy()
      alert = $("<div class='alert alert-error'></div>").text("Server Error: "+error.statusText).appendTo(".server_errors")


module.exports = SandwichListView