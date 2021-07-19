const tag = "<!-- summary -->"
const hasSummary = content => content.split(tag).length === 3;
const excerpt = (content) => content.split(tag)[1];
const delHtmlTag = str => str.replace(/<[^>]+>/g,"");
const contentInfo = content => {
    const htmlPart = excerpt(content.post)
    const startIndex = htmlPart.indexOf('<!--')
    const endIndex = htmlPart.indexOf('-->')
    return {
      htmlPart,
      startIndex,
      endIndex
    }
}

module.exports = function(eleventyConfig) {
    eleventyConfig.addFilter("excerpt", (content) =>
      excerpt(content.post)
    );

    eleventyConfig.addFilter("hasSummary", (content) =>
      hasSummary(content.post)
    );

    eleventyConfig.addFilter("delHtmlTag", (content) =>
      delHtmlTag(summary)
    );

    eleventyConfig.addShortcode("summary", function(content) {
    if (!hasSummary(content.post)) return ''
    const {htmlPart, startIndex, endIndex} = contentInfo(content)
    let summary = ''

    if( startIndex >= 0){
      summary = htmlPart.slice(startIndex+4, endIndex)
    } else {
      summary = delHtmlTag(htmlPart)
    }
    summary = summary.trim().replace(/(\r\n\t|\n|\r\t)/g,"")
    return `<div class="summary">${summary}</div>`
    });

    eleventyConfig.addShortcode("summaryLong", function(content) {
    if (!hasSummary(content.post)) return ''
    const {htmlPart, startIndex, endIndex} = contentInfo(content)
    let summaryLong = htmlPart

    if( startIndex >= 0){
      summaryLong = htmlPart.slice(startIndex+4, endIndex)
    } 
    return `<div class="summaryLong">${summaryLong}</div>`
    });
};