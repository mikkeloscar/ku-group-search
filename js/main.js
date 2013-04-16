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

  self.createForm = function (parent) {
    var html = $('<div id="ku-group-search">\
      <div class="ku-gs-wrap">\
        <div class="ku-gs-title">Search for group</div>\
        <div class="ku-gs-options">\
        <select>\
          <option value="all">Category</option>\
        </select>\
        <select>\
          <option value="all">Sub Category</option>\
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
    localStorage['categories'] = JSON.stringify(categories);
    localStorage['groups'] = JSON.stringify(groups);
    localStorage['time'] = Date.now();
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
    var term = $(this).val();

    if (term.length > 1) {
      console.log("searching..");
      //continue
      var resultbox = $(this).next();
      resultbox.html("");

      var db = self.readDB();
      if (db) {
        var query = [ {name:{likenocase:term}}];
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
    } else {
      return;
    }
    return;
  };
};

kuGroup.createForm("#ctl00_MSO_ContentDiv");
kuGroup.initDB();

$("#ku-gs-btn-update").on("click", function () {
  var MyCategoryCrawler = new CategoryCrawler(args);

  MyCategoryCrawler.crawl(kuGroup.increasecount)
  .done(function (categories, groups) {
    console.log("All done");

    console.log("Groups: " + groups.length);
    
    kuGroup.saveData(categories, groups);
    kuGroup.initDB();
  });
});

$("#ku-gs-search").on("keyup", kuGroup.search);
