(function(){var require = function (file, cwd) {
    var resolved = require.resolve(file, cwd || '/');
    var mod = require.modules[resolved];
    if (!mod) throw new Error(
        'Failed to resolve module ' + file + ', tried ' + resolved
    );
    var cached = require.cache[resolved];
    var res = cached? cached.exports : mod();
    return res;
};

require.paths = [];
require.modules = {};
require.cache = {};
require.extensions = [".js",".coffee",".json"];

require._core = {
    'assert': true,
    'events': true,
    'fs': true,
    'path': true,
    'vm': true
};

require.resolve = (function () {
    return function (x, cwd) {
        if (!cwd) cwd = '/';
        
        if (require._core[x]) return x;
        var path = require.modules.path();
        cwd = path.resolve('/', cwd);
        var y = cwd || '/';
        
        if (x.match(/^(?:\.\.?\/|\/)/)) {
            var m = loadAsFileSync(path.resolve(y, x))
                || loadAsDirectorySync(path.resolve(y, x));
            if (m) return m;
        }
        
        var n = loadNodeModulesSync(x, y);
        if (n) return n;
        
        throw new Error("Cannot find module '" + x + "'");
        
        function loadAsFileSync (x) {
            x = path.normalize(x);
            if (require.modules[x]) {
                return x;
            }
            
            for (var i = 0; i < require.extensions.length; i++) {
                var ext = require.extensions[i];
                if (require.modules[x + ext]) return x + ext;
            }
        }
        
        function loadAsDirectorySync (x) {
            x = x.replace(/\/+$/, '');
            var pkgfile = path.normalize(x + '/package.json');
            if (require.modules[pkgfile]) {
                var pkg = require.modules[pkgfile]();
                var b = pkg.browserify;
                if (typeof b === 'object' && b.main) {
                    var m = loadAsFileSync(path.resolve(x, b.main));
                    if (m) return m;
                }
                else if (typeof b === 'string') {
                    var m = loadAsFileSync(path.resolve(x, b));
                    if (m) return m;
                }
                else if (pkg.main) {
                    var m = loadAsFileSync(path.resolve(x, pkg.main));
                    if (m) return m;
                }
            }
            
            return loadAsFileSync(x + '/index');
        }
        
        function loadNodeModulesSync (x, start) {
            var dirs = nodeModulesPathsSync(start);
            for (var i = 0; i < dirs.length; i++) {
                var dir = dirs[i];
                var m = loadAsFileSync(dir + '/' + x);
                if (m) return m;
                var n = loadAsDirectorySync(dir + '/' + x);
                if (n) return n;
            }
            
            var m = loadAsFileSync(x);
            if (m) return m;
        }
        
        function nodeModulesPathsSync (start) {
            var parts;
            if (start === '/') parts = [ '' ];
            else parts = path.normalize(start).split('/');
            
            var dirs = [];
            for (var i = parts.length - 1; i >= 0; i--) {
                if (parts[i] === 'node_modules') continue;
                var dir = parts.slice(0, i + 1).join('/') + '/node_modules';
                dirs.push(dir);
            }
            
            return dirs;
        }
    };
})();

require.alias = function (from, to) {
    var path = require.modules.path();
    var res = null;
    try {
        res = require.resolve(from + '/package.json', '/');
    }
    catch (err) {
        res = require.resolve(from, '/');
    }
    var basedir = path.dirname(res);
    
    var keys = (Object.keys || function (obj) {
        var res = [];
        for (var key in obj) res.push(key);
        return res;
    })(require.modules);
    
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        if (key.slice(0, basedir.length + 1) === basedir + '/') {
            var f = key.slice(basedir.length);
            require.modules[to + f] = require.modules[basedir + f];
        }
        else if (key === basedir) {
            require.modules[to] = require.modules[basedir];
        }
    }
};

(function () {
    var process = {};
    var global = typeof window !== 'undefined' ? window : {};
    var definedProcess = false;
    
    require.define = function (filename, fn) {
        if (!definedProcess && require.modules.__browserify_process) {
            process = require.modules.__browserify_process();
            definedProcess = true;
        }
        
        var dirname = require._core[filename]
            ? ''
            : require.modules.path().dirname(filename)
        ;
        
        var require_ = function (file) {
            var requiredModule = require(file, dirname);
            var cached = require.cache[require.resolve(file, dirname)];

            if (cached && cached.parent === null) {
                cached.parent = module_;
            }

            return requiredModule;
        };
        require_.resolve = function (name) {
            return require.resolve(name, dirname);
        };
        require_.modules = require.modules;
        require_.define = require.define;
        require_.cache = require.cache;
        var module_ = {
            id : filename,
            filename: filename,
            exports : {},
            loaded : false,
            parent: null
        };
        
        require.modules[filename] = function () {
            require.cache[filename] = module_;
            fn.call(
                module_.exports,
                require_,
                module_,
                module_.exports,
                dirname,
                filename,
                process,
                global
            );
            module_.loaded = true;
            return module_.exports;
        };
    };
})();


require.define("path",function(require,module,exports,__dirname,__filename,process,global){function filter (xs, fn) {
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (fn(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length; i >= 0; i--) {
    var last = parts[i];
    if (last == '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// Regex to split a filename into [*, dir, basename, ext]
// posix version
var splitPathRe = /^(.+\/(?!$)|\/)?((?:.+?)?(\.[^.]*)?)$/;

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
var resolvedPath = '',
    resolvedAbsolute = false;

for (var i = arguments.length; i >= -1 && !resolvedAbsolute; i--) {
  var path = (i >= 0)
      ? arguments[i]
      : process.cwd();

  // Skip empty and invalid entries
  if (typeof path !== 'string' || !path) {
    continue;
  }

  resolvedPath = path + '/' + resolvedPath;
  resolvedAbsolute = path.charAt(0) === '/';
}

// At this point the path should be resolved to a full absolute path, but
// handle relative paths to be safe (might happen when process.cwd() fails)

// Normalize the path
resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
var isAbsolute = path.charAt(0) === '/',
    trailingSlash = path.slice(-1) === '/';

// Normalize the path
path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }
  
  return (isAbsolute ? '/' : '') + path;
};


// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    return p && typeof p === 'string';
  }).join('/'));
};


exports.dirname = function(path) {
  var dir = splitPathRe.exec(path)[1] || '';
  var isWindows = false;
  if (!dir) {
    // No dirname
    return '.';
  } else if (dir.length === 1 ||
      (isWindows && dir.length <= 3 && dir.charAt(1) === ':')) {
    // It is just a slash or a drive letter with a slash
    return dir;
  } else {
    // It is a full dirname, strip trailing slash
    return dir.substring(0, dir.length - 1);
  }
};


exports.basename = function(path, ext) {
  var f = splitPathRe.exec(path)[2] || '';
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};


exports.extname = function(path) {
  return splitPathRe.exec(path)[3] || '';
};

});

require.define("__browserify_process",function(require,module,exports,__dirname,__filename,process,global){var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
        && window.setImmediate;
    var canPost = typeof window !== 'undefined'
        && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            if (ev.source === window && ev.data === 'browserify-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('browserify-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

process.binding = function (name) {
    if (name === 'evals') return (require)('vm')
    else throw new Error('No such module. (Possibly not yet loaded)')
};

(function () {
    var cwd = '/';
    var path;
    process.cwd = function () { return cwd };
    process.chdir = function (dir) {
        if (!path) path = require('path');
        cwd = path.resolve(dir, cwd);
    };
})();

});

require.define("/collections/sandwich_collection.coffee",function(require,module,exports,__dirname,__filename,process,global){(function() {
  var Sandwich, SandwichCollection,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Sandwich = require("../models/sandwich");

  SandwichCollection = (function(_super) {

    __extends(SandwichCollection, _super);

    function SandwichCollection() {
      return SandwichCollection.__super__.constructor.apply(this, arguments);
    }

    SandwichCollection.prototype.model = Sandwich;

    SandwichCollection.prototype.url = "/sandwiches";

    return SandwichCollection;

  })(Backbone.Collection);

  module.exports = SandwichCollection;

}).call(this);

});

require.define("/views/header_view.coffee",function(require,module,exports,__dirname,__filename,process,global){(function() {
  var HeaderView,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  HeaderView = (function(_super) {

    __extends(HeaderView, _super);

    function HeaderView() {
      return HeaderView.__super__.constructor.apply(this, arguments);
    }

    HeaderView.prototype.selectMenuItem = function(menuItem) {
      $('#header-nav li').removeClass('active');
      if (menuItem) {
        return $('.' + menuItem).addClass('active');
      }
    };

    return HeaderView;

  })(Backbone.View);

  module.exports = HeaderView;

}).call(this);

});

require.define("/models/sandwich.coffee",function(require,module,exports,__dirname,__filename,process,global){(function() {
  var Sandwich,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Sandwich = (function(_super) {

    __extends(Sandwich, _super);

    function Sandwich() {
      return Sandwich.__super__.constructor.apply(this, arguments);
    }

    Sandwich.prototype.urlRoot = "/sandwiches";

    Sandwich.prototype.idAttribute = "_id";

    Sandwich.prototype.initialize = function() {};

    Sandwich.prototype.validation = {
      description: {
        required: true,
        minLength: 10
      },
      price: {
        required: true,
        pattern: "number",
        min: 0
      }
    };

    Sandwich.prototype.defaults = {
      description: "Tasty something between two slices of bread",
      price: 9
    };

    return Sandwich;

  })(Backbone.Model);

  module.exports = Sandwich;

}).call(this);

});

require.define("/views/home_view.coffee",function(require,module,exports,__dirname,__filename,process,global){(function() {
  var HomeView,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  HomeView = (function(_super) {

    __extends(HomeView, _super);

    function HomeView() {
      return HomeView.__super__.constructor.apply(this, arguments);
    }

    HomeView.prototype.template_html = "<div class=\"daily_sandwich\">\n  <h3><%= description %></h5>\n  <h4>$<%= price %></h5>\n</div>";

    HomeView.prototype.initialize = function() {
      return this.render();
    };

    HomeView.prototype.render = function() {
      $(this.el).html(_.template(this.template_html, this.model.toJSON()));
      return this;
    };

    return HomeView;

  })(Backbone.View);

  module.exports = HomeView;

}).call(this);

});

require.define("/views/sandwich_list_view.coffee",function(require,module,exports,__dirname,__filename,process,global){(function() {
  var Sandwich, SandwichListView, SandwichView,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  SandwichView = require('./sandwich_view');

  Sandwich = require('../models/sandwich');

  SandwichListView = (function(_super) {

    __extends(SandwichListView, _super);

    function SandwichListView() {
      this.showInvalid = __bind(this.showInvalid, this);
      return SandwichListView.__super__.constructor.apply(this, arguments);
    }

    SandwichListView.prototype.events = {
      "click .create-sandwich": "createSandwich"
    };

    SandwichListView.prototype.template_html = " \n<div>\n  <form>\n    <fieldset>\n      <div class=\"description control-group\">\n        <label class=\"control-label\" for=\"new_sandwich_description\">Description</label>\n        <div class=\"controls\">\n          <textarea id=\"new_sandwich_description\" rows=\"3\" \n            placeholder=\"Today's crazy ass sandwich\" class=\"input-xlarge\"></textarea>\n          <span class=\"help-inline\"></span>\n        </div>\n      </div>\n      <div class=\"price control-group\">\n        <label class='control-label' for=\"new_sandwich_price\">Price</label>\n        <div class=\"controls\">\n          $ <input id=\"new_sandwich_price\" type=\"text\" value=\"9\" class=\"input-mini\"></text>\n          <span class=\"help-inline\"></span>\n        </div>\n      </div>\n      <div class=\"server_errors\">\n      </div>\n    </fieldset>\n    <a href=\"#sandwiches\" class=\"btn btn-primary create-sandwich\">Add today's sandwich</a>\n\n  </form>\n</div>\n<ul class=\"sandwiches unstyled\"></ul>";

    SandwichListView.prototype.initialize = function() {
      this.render();
      this.model.on('add', this.addOne, this);
      return this.model.on('error', this.showInvalid, this);
    };

    SandwichListView.prototype.render = function() {
      var sandwich, sandwiches, view, _i, _len, _ref;
      sandwiches = this.model.models;
      $(this.el).html(this.template_html);
      _ref = sandwiches.reverse();
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        sandwich = _ref[_i];
        view = new SandwichView({
          model: sandwich
        }).render().el;
        $('.sandwiches', this.el).append(view);
      }
      $("#new_sandwich_price", this.el).keyup(function() {
        return this.value = this.value.replace(/[^0-9\.]/g, '');
      });
      return this;
    };

    SandwichListView.prototype.createSandwich = function() {
      var description, price;
      description = $("#new_sandwich_description").val();
      price = $("#new_sandwich_price").val();
      if (this.model.create({
        description: description,
        price: price
      }, {
        error: this.showInvalid
      })) {
        $("#new_sandwich_description").val('');
        return this.clearErrors();
      }
    };

    SandwichListView.prototype.clearErrors = function() {
      $('.description').removeClass('error').find('.help-inline').text('');
      $('.price').removeClass('error').find('.help-inline').text('');
      return $('.server_errors').text('');
    };

    SandwichListView.prototype.addOne = function(sandwich) {
      var view;
      view = new SandwichView({
        model: sandwich
      });
      return $('.sandwiches').prepend(view.render().el);
    };

    SandwichListView.prototype.showInvalid = function(sandwich, error) {
      var alert;
      this.clearErrors();
      if (error.description) {
        $('.description').addClass('error').find('.help-inline').text(error.description);
      }
      if (error.price) {
        $('.price').addClass('error').find('.help-inline').text(error.price);
      }
      if (error.status != null) {
        this.model.getByCid(sandwich.cid).destroy();
        return alert = $("<div class='alert alert-error'></div>").text("Server Error: " + error.statusText).appendTo(".server_errors");
      }
    };

    return SandwichListView;

  })(Backbone.View);

  module.exports = SandwichListView;

}).call(this);

});

require.define("/views/sandwich_view.coffee",function(require,module,exports,__dirname,__filename,process,global){(function() {
  var Sandwich, SandwichView,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Sandwich = require('../models/sandwich');

  SandwichView = (function(_super) {

    __extends(SandwichView, _super);

    function SandwichView() {
      return SandwichView.__super__.constructor.apply(this, arguments);
    }

    SandwichView.prototype.tagName = "li";

    SandwichView.prototype.className = "sandwich_item";

    SandwichView.prototype.events = {
      "click .remove": "removeSandwich"
    };

    SandwichView.prototype.template_html = "<div class=\"body\"><b><%= description %> - $<%= price %></b></div>\n<a class=\"btn btn-small remove\" ><i class=\"icon-remove\"></i></a>";

    SandwichView.prototype.initialize = function() {
      return this.model.on('destroy', this.remove, this);
    };

    SandwichView.prototype.render = function() {
      $(this.el).html(_.template(this.template_html, this.model.toJSON()));
      return this;
    };

    SandwichView.prototype.removeSandwich = function() {
      return this.model.destroy();
    };

    return SandwichView;

  })(Backbone.View);

  module.exports = SandwichView;

}).call(this);

});

require.define("/main.coffee",function(require,module,exports,__dirname,__filename,process,global){(function() {
  var AppRouter, HeaderView, HomeView, SandwichCollection, SandwichListView, app;

  SandwichListView = require('./views/sandwich_list_view');

  HomeView = require('./views/home_view');

  HeaderView = require('./views/header_view');

  SandwichCollection = require('./collections/sandwich_collection');

  _.extend(Backbone.Model.prototype, Backbone.Validation.mixin);

  AppRouter = Backbone.Router.extend({
    routes: {
      "": "home",
      "sandwiches": "list"
    },
    initialize: function() {
      return this.headerView = new HeaderView();
    },
    home: function() {
      var sandwichList;
      sandwichList = new SandwichCollection();
      sandwichList.fetch({
        success: function() {
          var view;
          view = new HomeView({
            model: sandwichList.last()
          });
          return $("#content").html(view.el);
        }
      });
      return this.headerView.selectMenuItem('sandwich-today');
    },
    list: function() {
      var sandwichList;
      sandwichList = new SandwichCollection();
      sandwichList.fetch({
        success: function() {
          var view;
          view = new SandwichListView({
            model: sandwichList
          });
          return $("#content").html(view.el);
        }
      });
      return this.headerView.selectMenuItem('sandwich-list');
    }
  });

  app = new AppRouter();

  Backbone.history.start();

}).call(this);

});
require("/main.coffee");
})();
