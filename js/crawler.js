/**
 * Category Crawler
 *
 * @param object param with url and url pattern.
 */
function CategoryCrawler(param) {
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
            success: function(data) {
                $(data).find("a").each(function() {
                    var href = $(this).attr('href');
                    if (self.url_pattern.test(href)) {
                        var title = $(this).html();
                        var head_category = $(this).parent().parent().parent().find(".headertitle").html();
                        var category = { sub_cat: title, 
                                         url: href,
                                         head_cat: head_category
                                       };
                        categories.push(category);
                        console.log("Added", category);
                    }
                });
            }
        });
    }
}
