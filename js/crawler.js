/**
 * Group Crawler
 *
 * @param param  Includes page url, category etc.
 */
function GroupCrawler (param) {

  /**
   * Page url
   */
  this.url = param.category.url;

  /**
   * Category object
   */
  this.category = param.category;

  /**
   * Title html class
   */
  this.title_class = param.title_class;

  /**
   * Description html class
   */
  this.desc_class = param.desc_class;

  /**
   * List of groups
   */
  this.groups = new Array();

  /**
   * Regex to find the __doPostBack function on page
   */
  this.asp_pattern = new RegExp("__doPostBack", 'i');
  
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
  crawl: function (data) {
    var self = this;

    var more = false;

    var formData = null;

    if (!data) { // Init call
      more = true;
    } else { // handle __doPostBack

      var args = { target: null, argument: null };

      $(data).find('a').each( function () {
        var href = $(this).attr('href');
        if (self.asp_pattern.test(href)) {
          // We have found the navigation
          var img = $(this).find('img');
          if (img.attr('alt') == 'Next') {
            // We have found more pages
            more = true;
            // Parse __doPostBack args
            var result = href.match(self.dpb_regex);
            args.target = result[0];
            args.argument = result[1];
          }
        }
      });

      var theForm = $(data).find('form[name="aspnetForm"]');

      theForm.find('[name="__EVENTTARGET"]').val(args.target);
      theForm.find('[name="__EVENTARGUMENT"]').val(args.argument);

      formData = $(theForm).serialize(); 
    }

    if (more) { // More pages!
      $.ajax({
          type: "POST",
          url: this.url,
          data: formData,
          success: function (data) {
            $(data).find(self.title_class).each( function () {
              var a = $(this).find('a');
              var href = a.attr('href');
              var name = a.html();
              var next = $(this).parent().next('tr');
              var desc = '';
              if (next.find(self.desc_class).length) {
                var desc = next.find(self.desc_class).find('span').html();
              }
              group = { name: name,
                        url: href,
                        desc: desc,
                        cat: self.category.head_cat,
                        sub_cat: self.category.sub_cat,
                        cat_url: self.category.url,
                      };
              self.groups.push(group);
              console.log("count");
            });
          self.crawl(data);
        }
      });
    }
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
  this.url_pattern = new RegExp(param.pattern, 'i');

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
   */
  crawl: function () {
    var self = this;
    console.log("Crawling categories...");

    var categories = new Array();

    $.ajax({
      url: this.url,
      success: function (data) {
        $(data).find("a").each( function() {
          var href = $(this).attr('href');
          if (self.url_pattern.test(href)) {
            var title = $(this).html();
            var head_category = $(this).parent().parent().parent().find(".headertitle").html();
            var category = { sub_cat: title, 
                             url: href,
                             head_cat: head_category
                           };
            categories.push(category);

            // crawl groups
            var param = { category: category,
                          title_class: self.group_args.title_class,
                          desc_class: self.group_args.desc_class,
                        }
            var groupCrawler = new GroupCrawler(param);
            groupCrawler.crawl(null);
          }
        });
      }
    });
  }
}
