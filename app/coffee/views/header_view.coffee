class HeaderView extends Backbone.View

  selectMenuItem: (menuItem) ->
    $('#header-nav li').removeClass('active')
    $('.' + menuItem).addClass('active') if menuItem

module.exports = HeaderView