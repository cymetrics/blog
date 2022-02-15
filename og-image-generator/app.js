const puppeteer = require('puppeteer');
const express = require('express');
const fs = require('fs')
const path = require('path')
const frontMatter = require('front-matter')

const app = express()
const PORT = process.env.PORT || 3000

const getPath = name => path.join(__dirname, name)

// check argv
const author = process.argv[2]
const post = process.argv[3]
const lang = process.argv[4] || ""

// npm run og-image -- "huli" "how-i-hacked-glints-and-your-resume"

if (!author || !post) {
  console.error('Please input author and post, example: npm run og-image -- "huli" "xss-article"')
  process.exit(1)
}

// get post and author info
const postPath = path.join(__dirname, '../', lang, 'posts', author, post + '.md')
console.log(`Path: ${postPath}`)

let postMeta
try {
  const postContent = fs.readFileSync(postPath, 'utf8')
  postMeta = frontMatter(postContent)
} catch(err) {
  console.error('Read post file failed:', err)
  process.exit(2)
}

const metadata = JSON.parse(fs.readFileSync(path.join(__dirname, "../", "_data", "metadata.json"), 'utf8'))
const authorData = metadata.authors[author]

const template = fs.readFileSync(getPath('resources/template.html'), 'utf8')
  .replace(/{{authorName}}/g, authorData.name)
  .replace(/{{title}}/g, postMeta.attributes.title)
  .replace(/{{publishedDate}}/g, postMeta.attributes.date.toISOString().substr(0, 10))


function startServer() {
  return new Promise(resolve => {
    app.listen(PORT, () => {
      console.log(`Starting generate image...`)
      resolve()
    })

    app.get('/author.png', (req, res) => {
      res.send(fs.readFileSync(path.join(__dirname, "../", authorData.avatarUrl)))
    })

    app.get('/', (req, res) => {
      res.send(template)
    })
    // authorLogoPath
    // title
    // authorName
    // publishedDate

    app.use(express.static(path.join(__dirname ,'resources')));

  })
}

function escape(str) {
  if (!str) return ""
  return str.replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

async function main(){
  await startServer()
  const browser = await puppeteer.launch({
    args: ['--no-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({
    width: 1200,
    height: 630,
    deviceScaleFactor: 2,
  });

  await takeScreenshot(page, path.join(__dirname, "output"))

  await browser.close();
  console.log("Done, you can find image at: og-image-generator/output.png")
  process.exit(0)
}

async function takeScreenshot(page, name) {
  await page.goto(`http://localhost:${PORT}`);
  const element = await page.$('.window')
  await element.screenshot({ path: `${name}.png` });
}

main()
