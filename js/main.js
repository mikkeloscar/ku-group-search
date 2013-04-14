
var args = { url: "https://groups.ku.dk/Sider/category.aspx",
             pattern: "https://groups.ku.dk(:443)?/Sider/categoryresults.aspx",
             group: { title_class: '.ms-sitedirresultstitle',
                      desc_class: '.ms-sitedirresultsdescription',
                    }
           }

var MyCategoryCrawler = new CategoryCrawler(args)


MyCategoryCrawler.crawl().done(function () {
  console.log("All done");
})

