/**
 * Group Crawler
 *
 * @param param  Includes page url, category etc.
 */
function GroupCrawler (options) {

  /**
   * Page url
   */
  this.url = options.category.url;

  /**
   * Category object
   */
  this.category = options.category;

  /**
   * Title html class
   */
  this.title_class = options.title_class;

  /**
   * Description html class
   */
  this.desc_class = options.desc_class;

  /**
   * List of groups
   */
  this.groups = [];

  /**
   * Regex to find the __doPostBack function on page
   */
  this.asp_pattern = new RegExp("__doPostBack", "i");
  
  /**
   * Regex to extract doPostBack function arguments
   */
  this.dpb_regex = /[^\(\']+(?=\'[,\)])/g;

}

GroupCrawler.prototype = {

  /**
   * Crawls through every page by handling ASP.NET __doPostBack crap
   *
   * The __doPostBack hack is ugly, but so is the page we are working with
   *
   * @param data  data returned from previous ajax call.
   *              Give null if this is the init call of this method.
   */
  crawl: function (data, callback) {
    var self = this;

    var requestCounter = 0;
    var dfd = $.Deferred();

    function request (formData) {
        requestCounter++;
        return $.ajax({
            type: "POST",
            url: self.url,
            data: formData
        }).always(function() {
          requestCounter--;
          // We might queue more requests in the done handler, so just in case
          // wait til the next event loop to dispatch the complete
          setTimeout(function() {
            if (!requestCounter) {
              dfd.resolve(self.groups);
            }
          }, 0);
        });
      }
    
    function innerCrawl (data) {
      var more = false;

      var formData = null;

      if (!data) { // Init call
        more = true;
      } else { // handle __doPostBack

        data = data.trim();

        var args = { target: null, argument: null };

        $(data).find("a").each(function () {
          var href = $(this).attr("href");
          if (self.asp_pattern.test(href)) {
            // We have found the navigation
            var img = $(this).find("img");
            if (img.attr("alt") == "Next") {
              // We have found more pages
              more = true;
              // Parse __doPostBack args
              var result = href.match(self.dpb_regex);
              args.target = result[0];
              args.argument = result[1];
            }
          }
        });

        var theForm = $(data).find("form[name='aspnetForm']");

        theForm.find("[name='__EVENTTARGET']").val(args.target);
        theForm.find("[name='__EVENTARGUMENT']").val(args.argument);

        formData = $(theForm).serialize();
      }

      if (more) { // More pages!
        request(formData).done(function (data) {
          $(data.trim()).find(self.title_class).each(function () {
            var a = $(this).find("a");
            var href = a.attr("href");
            var name = a.html();
            var next = $(this).parent().next("tr");
            var desc = "";
            if (next.find(self.desc_class).length) {
              var desc = next.find(self.desc_class).find("span").html();
            }
            group = { name: name,
                      url: href,
                      desc: desc,
                      cat: self.category.cat,
                      sub_cat: self.category.sub_cat,
                      cat_url: self.category.url,
                    };
            self.groups.push(group);
            callback();
          });
          innerCrawl(data);
        });
      }
    }
    // init crawl
    innerCrawl(data);
    return dfd.promise();
  }
}


/**
 * Category Crawler
 *
 * @param param  object param with url and url pattern
 */
function CategoryCrawler (param) {

  /**
   * Categories url
   */
  this.url = param.url;
  
  /**
   * regex url pattern
   */
  this.url_pattern = new RegExp(param.pattern, "i");

  /**
   * Param object to be passed to the GroupCrawler
   */
  this.group_args = param.group;

}

CategoryCrawler.prototype = {

  /**
   * Crawl method
   *
   * Open url and collect sub categories and links
   * Provides doneCallback with the arguments categories and groups
   */
  crawl: function (callback) {
    var self = this;
    console.log("Crawling categories...");

    var dfd = $.Deferred();

    var categories = [];

    var options = [];

    $.ajax({
      url: this.url
    }).done(function (data) {
      $(data.trim()).find("a").each(function () {
        var href = $(this).attr("href");
        if (self.url_pattern.test(href)) {
          var title = $(this).html();
          var head_category = $(this).parent().parent().parent()
                                     .find(".headertitle").html();
          var category = { sub_cat: title, 
                           url: href,
                           cat: head_category
                         };
          categories.push(category);

          // crawl groups
          var param = { category: category,
                        title_class: self.group_args.title_class,
                        desc_class: self.group_args.desc_class,
                      };
          options.push(param);
        }
      });

      var promises = [];

      for (var i = 0; i < options.length; i++) {
        var groupCrawler = new GroupCrawler(options[i]);
        promises.push(groupCrawler.crawl(null, callback));
      }

      // wait for ajax calls to be done
      $.when.apply($, promises).done(function () {
        var groups = self._mkGroupList(arguments);
        dfd.resolve(categories, groups);
      });
    });
    return dfd.promise();
  },

  /**
   * make groups list.
   */
  _mkGroupList: function (list) {
    var groups = [];

    for (var i = 0; i < list.length; i++) {
      groups = groups.concat(list[i]);
    }

    return groups;
  }
}
