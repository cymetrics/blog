const { JSDOM } = require("jsdom");
const BASE_URL = require("../_data/metadata.json").url;

const linkTarget = async (rawContent, outputPath) => {
  let content = rawContent;

  if (outputPath && outputPath.endsWith(".html")) {
    const dom = new JSDOM(content);
    const links = [...dom.window.document.querySelectorAll("a")];

    if (links.length > 0) {
      for(let link of links) {
        const { href } = link
        if (
          href === '' ||
          href.startsWith('/') ||
          href.startsWith('#') ||
          href.startsWith('about:blank') ||
          href.startsWith(BASE_URL)
        ) continue
        link.setAttribute('target', '_blank')
        link.setAttribute('rel', 'noopener noreferrer')
      }
      content = dom.serialize();
    }
  }

  return content;
};

module.exports = {
  initArguments: {},
  configFunction: async (eleventyConfig, pluginOptions = {}) => {
    eleventyConfig.addTransform("linkTarget", linkTarget);
  },
};
