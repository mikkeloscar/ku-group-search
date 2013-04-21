// Returns a function, that, as long as it continues to be invoked, will not
// be triggered. The function will be called after it stops being called for
// N milliseconds. If `immediate` is passed, trigger the function on the
// leading edge, instead of the trailing.
//
// From: http://stackoverflow.com/questions/12538344/asynchronous-keyup-events
// -how-to-short-circuit-sequential-keyup-events-for-speed 
var debounce = function(func, wait, immediate) {
    var timeout;
    return function() {
        var context = this, args = arguments;
        var later = function() {
            timeout = null;
            if (!immediate) {
                func.apply(context, args);
            }
        };
        if (immediate && !timeout) {
            func.apply(context, args);
        }

        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};


/**
 * ui namespace
 */
var ui = new function () {
  
  var self = this;

  var counter = 0;
  var totalCount = 0;
  var db = null;
  var crawlOptions = null;


  self.init = function (options, total, parentId) {
    crawlOptions = options;
    totalCount = total;

    self.createForm(parentId);
    self.initDB();
    self.initSelects();

    // bind events
    // update index
    $("#ku-gs-btn-update").on("click", self.crawl);

    // search on keyUp
    $("#ku-gs-search").on("keyup", debounce(self.search, 300));

    // prevent submit on enter
    $("#ku-gs-search").closest("form").submit(function (e) {
      e.preventDefault();
    });

    // search on category change
    $("#ku-gs-cat-select").on("change", self.search);

    // search on sub category change
    $("#ku-gs-subcat-select").on("change", self.search);
  }


  self.createForm = function (parent) {
    var html = $('<div id="ku-group-search">\
      <div class="ku-gs-wrap">\
        <h6 class="ku-gs-title">Search for group</h6>\
        <div class="ku-gs-options">\
          <div id="ku-gs-progress-wrap">\
            <span id="ku-gs-data">Updating index..</span>\
            <div id="ku-gs-progress" class="progress progress-striped active">\
              <div id="ku-gs-bar" class="bar"></div>\
            </div>\
          </div>\
        <select id="ku-gs-cat-select">\
          <option value="all">Category (All)</option>\
        </select>\
        <select id="ku-gs-subcat-select">\
          <option value="all">Sub Category (All)</option>\
        </select>\
          <button type="button" id="ku-gs-btn-update" class="btn">\
          Update Index</button>\
        <span id="ku-gs-btn-desc"></span>\
      </div>\
        <input type="text" name="search" id="ku-gs-search"\
        placeholder="Search..">\
        <div id="ku-gs-results">\
        </div>\
      </div>\
    </div>');

    $(parent).prepend(html);
  };


  self.initSelects = function () {
    var data = self.loadData();

    if (data) {
      var catSelect = $("#ku-gs-cat-select");
      var subcatSelect = $("#ku-gs-subcat-select");
      var catList = [];
      var subcatList = [];

      // clear selects
      catSelect.html('<option value="all">Category (All)</option>');
      subcatSelect.html('<option value="all">Sub Category (All)</option>');

      $(data.categories).each(function (i, cat) {
        if (jQuery.inArray(cat.cat, catList) == -1) {
          catList.push(cat.cat);
          catSelect.append('<option value="'+cat.cat+'">'+cat.cat+'</option>');
        }

        if (jQuery.inArray(cat.sub_cat, subcatList) == -1) {
          subcatList.push(cat.sub_cat);
          subcatSelect.append('<option value="'+cat.sub_cat+'">'+
                              cat.sub_cat+'</option>');
        }
      });
    }
  };


  self.showResults = function (query) {
    var html = $('<a class="ku-gs-result" href="' + query.url + '">\
                  <span class="ku-gs-result-name">' + query.name + '</span>\
                  <span class="ku-gs-result-desc">' + query.desc + '</span>\
                  <span class="ku-gs-result-cat">\
                    <span class="ku-gs-cat">Category:</span> ' +
                    query.cat +' > ' + query.sub_cat + '</span></a>');
    $("#ku-gs-results").append(html);
  };


  self.initDB = function () {
    var data = self.loadData();

    if (data && data.groups) {
      // setup taffyDB
      var table = TAFFY(data.groups);

      // update totalcount
      totalCount = data.groups.length;

      db = table;
      self.updateBtn("ok");
    } else {
      db = null;
      self.updateBtn("none");
    }
  };


  self.loadData = function () {
    if (typeof localStorage["categories"] === "undefined" ||
        typeof localStorage["groups"] === "undefined" ||
        typeof localStorage["time"] === "undefined") {
      data = null;
    } else {
      var categories = JSON.parse(localStorage["categories"]);
      var groups = JSON.parse(localStorage["groups"]);
      var time = parseInt(localStorage["time"]);

      var data = { categories: categories,
                   groups: groups,
                   time: time
      };
      
      if (typeof time === "undefined") {
        data = null;
      }
    }

    return data;
  };


  self.saveData = function (categories, groups) {
    localStorage["categories"] = JSON.stringify(categories);
    localStorage["groups"] = JSON.stringify(groups);
    localStorage["time"] = Date.now();
  };


  self.increaseCount = function () {
    counter++;
    self.updateProgress();
  };


  self.updateProgress = function () {
    var progress = 0;

    if (counter > totalCount) {
      progress = 100;
    } else if (counter > 0) {
      progress = counter/totalCount * 100;
    }

    if (progress > 100) {
      progress = 100;
    }
    $("#ku-gs-bar").css("width", "" + progress + "%");
  };


  self.resetCounter = function () {
    counter = 0;
  };


  self.setTotalCount = function (num) {
    totalCount = num;
  };


  self.search = function () {
      self.query().done(function (msg) {
        return;
      })
      .fail(function (err) {
        console.log(err);
      });
  };


  self.query = function () {
    var term = $("#ku-gs-search").val();

    // Make the query operation async
    var dfd = $.Deferred();

    if (term.length > 1) {
      //continue
      $("#ku-gs-results").empty();

      if (db) {
        // build query
        var query = [{name:{likenocase:term}}];

        // Check for category select
        var cat = $("#ku-gs-cat-select").val();
        var subcat = $("#ku-gs-subcat-select").val();

        if (cat !== "all" && subcat !== "all") {
          query = [{name:{likenocase:term},cat:{is:cat},sub_cat:{is:subcat}}];
        } else if (cat !== "all") {
          query = [{name:{likenocase:term},cat:{is:cat}}];
        } else if (subcat !== "all") {
          query = [{name:{likenocase:term},sub_cat:{is:subcat}}];
        }

        var records = db(query);
        records.each(function (record) {
          self.showResults(record);
        });
        dfd.resolve("complete!");
      } else {
        console.log("no DB");
        self.updateBtn("none");
        dfd.fail("No DB");

      }

    } else if (term.length == 0) {
      $("#ku-gs-results").empty();
      dfd.fail("Searchterm empty");
    }
    return dfd.promise();
  };


  self.crawl = function () {
    self.resetCounter();
    $("#ku-gs-progress-wrap").show();
    var MyCategoryCrawler = new CategoryCrawler(crawlOptions);

    MyCategoryCrawler.crawl(self.increaseCount).done(function (cats, groups) {
      self.saveData(cats, groups);
      self.initDB();
      self.initSelects();
      self.updateBtn("ok", groups);
    });
  };


  self.updateBtn = function (status) {
    $("#ku-gs-btn-desc").empty();

    if (status === "none") {
      var bClass = "danger";
      // disable search field
      $("#ku-gs-search").attr('disabled', true);
      $("#ku-gs-btn-desc").html("Index needs to be updated.");
    } else if (status === "old") {
      var bClass = "warning";
    } else if (status === "ok") {
      var bClass = "success";
      if (typeof arguments[1] !== "undefined") {
        $("#ku-gs-btn-desc").html(""+arguments[1].length+" groups indexed.");
      }
      // enable search field
      $("#ku-gs-search").attr('disabled', false);
    }

    var btnClass = "btn btn-" + bClass;
    var descClass = "ku-gs-btn-desc-" + bClass;

    $("#ku-gs-progress-wrap").fadeOut("fast");
    $("#ku-gs-bar").css('width', '0');
    $("#ku-gs-btn-update").removeClass(function (i, curr) {
      return curr;
    }).addClass(btnClass);

    $("#ku-gs-btn-desc").removeClass(function (i, curr) {
      return curr;
    }).addClass(descClass);
    $("#ku-gs-btn-desc").fadeIn("slow");
  };
};
