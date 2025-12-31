import puppeteer from 'puppeteer';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Article from '../models/Article';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || '';

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI is missing in .env file");
  process.exit(1);
}

const scrape = async () => {
  console.log("🚀 Starting Scraper...");

  await mongoose.connect(MONGODB_URI);
  console.log("✅ Connected to MongoDB");

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  try {
    const blogUrl = 'https://beyondchats.com/blogs/';
    console.log(`🌍 Navigating to ${blogUrl}...`);
    await page.goto(blogUrl, { waitUntil: 'domcontentloaded' });

    const lastPageNum = await page.evaluate(() => {
      const pageLinks = document.querySelectorAll('.page-numbers'); 
      const pageNumbers = Array.from(pageLinks)
        .map(el => parseInt((el as HTMLElement).innerText))
        .filter(num => !isNaN(num));
      return pageNumbers.length > 0 ? Math.max(...pageNumbers)-1 : 1;
    });

    const lastPageUrl = `https://beyondchats.com/blogs/page/${lastPageNum}/`;
    console.log(`➡️  Going to oldest page: ${lastPageUrl}`);
    await page.goto(lastPageUrl, { waitUntil: 'domcontentloaded' });

    const articleLinks = await page.evaluate(() => {
      const cards = document.querySelectorAll('article.entry-card'); 

      return Array.from(cards).map(card => {
        const titleLinkEl = card.querySelector('.entry-title a') as HTMLAnchorElement;
        const dateEl = card.querySelector('.meta-date time') as HTMLTimeElement;

        return {
          title: titleLinkEl ? titleLinkEl.innerText.trim() : 'No Title',
          url: titleLinkEl ? titleLinkEl.href : '',
          date: dateEl ? (dateEl.getAttribute('datetime') || dateEl.innerText) : ''
        };
      });
    });

    const targetArticles = articleLinks.filter(a => a.url).slice(-5);
    console.log(`🔍 Found ${targetArticles.length} articles to scrape.`);

    for (const article of targetArticles) {
      console.log(`\n📥 Scraping content from: ${article.title}`);
      
      try {
        await page.goto(article.url, { waitUntil: 'domcontentloaded' });

        const content = await page.evaluate(() => {
            const contentEl = document.querySelector('.entry-content') || 
                              document.querySelector('.post-content') ||
                              document.querySelector('article'); 
            return contentEl ? (contentEl as HTMLElement).innerText : '';
        });

        if (!content) {
            console.warn(`⚠️ No content text found for ${article.title}`);
            continue;
        }

        await Article.findOneAndUpdate(
          { url: article.url },
          {
            title: article.title,
            url: article.url,
            content: content,
            originalContent: content,
            date: article.date,
            isUpdated: false
          },
          { upsert: true, new: true }
        );
        console.log(`✅ Saved to DB`);

      } catch (err) {
        console.error(`❌ Failed to scrape ${article.title}`, err);
      }
    }

  } catch (error) {
    console.error("❌ Fatal Error:", error);
  } finally {
    await browser.close();
    await mongoose.disconnect();
    console.log("\n👋 Scraper finished.");
  }
};

scrape();