const tag = "<!-- summary -->"
const hasSummary = content => content.split(tag).length === 3;
const excerpt = (content) => content.split(tag)[1];
const delHtmlTag = str => str.replace(/<[^>]+>/g,"");
const contentInfo = content => {
    const htmlPart = excerpt(content)
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
      excerpt(content)
    );

    eleventyConfig.addFilter("summary", function(content) {
      if (!content || !hasSummary(content)) return ''
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
};