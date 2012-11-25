class HomeView extends Backbone.View

  template_html: 
    """
      <div class="daily_sandwich">
        <h3><%= description %></h5>
        <h4>$<%= price %></h5>
      </div>
    """

  initialize: ->
    this.render()

  render: ->
    $(this.el).html _.template(this.template_html, this.model.toJSON())
    return this

module.exports = HomeView