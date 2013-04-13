
console.log("TEST");

var MyCategoryCrawler = new CategoryCrawler({
    url: "https://groups.ku.dk/Sider/category.aspx",
    pattern: "https://groups.ku.dk:443/Sider/categoryresults.aspx"
});

MyCategoryCrawler.crawl();
