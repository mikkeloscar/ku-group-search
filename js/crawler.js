/**
 * Group Crawler
 */
function GroupCrawler (param) {
    this.url = param.category.url;

    /**
     * Category object
     */
    this.category = param.category;

    this.title_class = param.title_class;
    this.desc_class = param.desc_class;

    this.groups = new Array();

    this.asp_pattern = new RegExp("__doPostBack", 'i');
    
    this.dpb_regex = /[^\(\']+(?=\'[,\)])/g;

}

GroupCrawler.prototype = {

    /**
     * Crawls through every page by handling ASP.NET __doPostBack crap
     *
     * The __doPostBack hack is ugly, but so is the page we are working with.
     *
     * @param data, data returned from previous ajax call. Give null, 
     * if this is the init call of this method.
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

            var theForm = document.forms['aspnetForm'];

            theForm.__EVENTTARGET.value = args.target;
            theForm.__EVENTARGUMENT.value = args.argument;

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
 * @param object param with url and url pattern.
 */
function CategoryCrawler (param) {
    this.url = param.url;
    this.url_pattern = new RegExp(param.pattern, 'i');
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
                                      title_class: '.ms-sitedirresultstitle',
                                      desc_class: '.ms-sitedirresultsdescription',
                        }
                        var groupCrawler = new GroupCrawler(param);
                        groupCrawler.crawl(null);
                    }
                });
            }
        });
    }
}
