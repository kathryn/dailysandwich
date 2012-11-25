SandwichListView = require './views/sandwich_list_view'
HomeView = require './views/home_view'
HeaderView = require './views/header_view'
SandwichCollection = require './collections/sandwich_collection'

# https://github.com/thedersen/backbone.validation
_.extend(Backbone.Model.prototype, Backbone.Validation.mixin);

AppRouter = Backbone.Router.extend
  routes :
    ""              : "home"
    "sandwiches"    : "list"

  initialize : ->
    this.headerView = new HeaderView();

  home : ->
    sandwichList = new SandwichCollection()
    sandwichList.fetch success: ->
      view = new HomeView model:sandwichList.last()
      $("#content").html(view.el)
    this.headerView.selectMenuItem 'sandwich-today'


  list : ->
    sandwichList = new SandwichCollection()
    sandwichList.fetch success: ->
      view = new SandwichListView model: sandwichList
      $("#content").html(view.el)
    this.headerView.selectMenuItem 'sandwich-list'



app = new AppRouter();
Backbone.history.start();
