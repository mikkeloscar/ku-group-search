var args = { url: "https://groups.ku.dk/Sider/category.aspx",
             pattern: "https://groups.ku.dk(:443)?/Sider/categoryresults.aspx",
             group: { title_class: ".ms-sitedirresultstitle",
                      desc_class: ".ms-sitedirresultsdescription",
                    }
           };

/**
 * kuGroup namspace
 */
var kuGroup = new function () {
  
  var self = this;

  var counter = 0;

  var totalCount = 0;

  var db = null;

  var crawlOptions = null;

  self.init = function (options) {
    crawlOptions = options;
  }

  self.createForm = function (parent) {
    var html = $('<div id="ku-group-search">\
      <div class="ku-gs-wrap">\
        <div class="ku-gs-title">Search for group</div>\
        <div class="ku-gs-options">\
        <select id="ku-gs-cat-select">\
          <option value="all">Category (All)</option>\
        </select>\
        <select id="ku-gs-subcat-select">\
          <option value="all">Sub Category (All)</option>\
        </select>\
        <button type="button" id="ku-gs-btn-update">Update Index</button>\
      </div>\
        <input type="text" name="search" id="ku-gs-search"\
        placeholder="Search..">\
        <div id="ku-gs-results">\
        </div>\
      </div>\
    </div>');

    $(parent).prepend(html);
  };

  self.populateSelects = function () {
    var data = self.loadData();

    if (data) {
      var catSelect = $("#ku-gs-cat-select");
      var subcatSelect = $("#ku-gs-subcat-select");
      var catList = [];
      var subcatList = [];

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


  self.showResults = function (q) {
    var html = $('<a class="ku-gs-result" href="' + q.url + '">\
                  <span class="ku-gs-result-name">' + q.name + '</span>\
                  <span class="ku-gs-result-desc">' + q.desc + '</span>\
                  <span class="ku-gs-result-cat">\
                    <span class="ku-gs-cat">Category:</span> ' +
                    q.cat +' > ' + q.sub_cat + '</span></a>');
    $("#ku-gs-results").append(html);
  };

  self.initDB = function () {
    var data = self.loadData();

    if (data) {

      var table = TAFFY(data.groups);

      db = table;
    } else {
      db = null;
    }
  };

  self.readDB = function () {
    return db;
  };

  self.loadData = function () {
    var categories = JSON.parse(localStorage['categories']);
    var groups = JSON.parse(localStorage['groups']);
    var time = parseInt(localStorage['time']);

    var data = { categories: categories,
                 groups: groups,
                 time: time
    };

    if (typeof time === 'undefined') {
      data = null;
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
  };

  self.resetCounter = function () {
    counter = 0;
  };

  self.setTotalCount = function (num) {
    totalCount = num;
  };

  self.search = function () {
    var term = $("#ku-gs-search").val();

    if (term.length > 1) {
      console.log("searching..");
      //continue
      $("#ku-gs-results").html("");

      var db = self.readDB();
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
        records.each(function (r) {
          self.showResults(r);
        });
      } else {
        console.log("no DB");
      }
    } else if (term.length == 0) {
      var resultbox = $(this).next();
      resultbox.html("");
    }
  };

  self.crawl = function () {
    var MyCategoryCrawler = new CategoryCrawler(crawlOptions);

    MyCategoryCrawler.crawl(self.increasecount).done(function (cats, groups) {
      console.log("All done");

      console.log("Groups: " + groups.length);
      
      self.saveData(cats, groups);
      self.initDB();
    });
  };
};

// setup
kuGroup.init();
kuGroup.createForm("#ctl00_MSO_ContentDiv");
kuGroup.initDB();
kuGroup.populateSelects();

// bind events
$("#ku-gs-btn-update").on("click", kuGroup.crawl);
$("#ku-gs-search").on("keyup", kuGroup.search);
$("#ku-gs-cat-select").on("change", kuGroup.search);
$("#ku-gs-subcat-select").on("change", kuGroup.search);
