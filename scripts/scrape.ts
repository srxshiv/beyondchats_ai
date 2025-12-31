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

  // 1. Connect to Database
  await mongoose.connect(MONGODB_URI);
  console.log("✅ Connected to MongoDB");

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  try {
    // 2. Navigate to Main Blog Page
    // We assume the pagination logic is similar, but let's focus on the selectors first.
    const blogUrl = 'https://beyondchats.com/blogs/';
    console.log(`🌍 Navigating to ${blogUrl}...`);
    await page.goto(blogUrl, { waitUntil: 'domcontentloaded' });

    // --- PAGINATION LOGIC (Keep this as is for now) ---
    const lastPageNum = await page.evaluate(() => {
      // Note: If you can provide the HTML for the pagination section later, we can fix this too.
      // For now, standard WordPress usually uses 'page-numbers'.
      const pageLinks = document.querySelectorAll('.page-numbers'); 
      const pageNumbers = Array.from(pageLinks)
        .map(el => parseInt((el as HTMLElement).innerText))
        .filter(num => !isNaN(num));
      return pageNumbers.length > 0 ? Math.max(...pageNumbers)-1 : 1;
    });

    const lastPageUrl = `https://beyondchats.com/blogs/page/${lastPageNum}/`;
    console.log(`➡️  Going to oldest page: ${lastPageUrl}`);
    await page.goto(lastPageUrl, { waitUntil: 'domcontentloaded' });

    // --- UPDATED SELECTORS BASED ON YOUR HTML ---
    const articleLinks = await page.evaluate(() => {
      // 1. Target the main card container
      const cards = document.querySelectorAll('article.entry-card'); 

      return Array.from(cards).map(card => {
        // 2. Target the Title and Link
        // Structure: <h2 class="entry-title"><a ...>Title</a></h2>
        const titleLinkEl = card.querySelector('.entry-title a') as HTMLAnchorElement;
        
        // 3. Target the Date
        // Structure: <li class="meta-date"><time ...>Date</time></li>
        const dateEl = card.querySelector('.meta-date time') as HTMLTimeElement;

        return {
          title: titleLinkEl ? titleLinkEl.innerText.trim() : 'No Title',
          url: titleLinkEl ? titleLinkEl.href : '',
          // Prefer datetime attribute for consistency, fallback to text
          date: dateEl ? (dateEl.getAttribute('datetime') || dateEl.innerText) : ''
        };
      });
    });

    const targetArticles = articleLinks.filter(a => a.url).slice(-5);
    console.log(`🔍 Found ${targetArticles.length} articles to scrape.`);

    // --- CONTENT SCRAPING LOOP ---
    for (const article of targetArticles) {
      console.log(`\n📥 Scraping content from: ${article.title}`);
      
      try {
        await page.goto(article.url, { waitUntil: 'domcontentloaded' });

        // 4. Extract Main Body Content
        // Note: We still need to guess the content wrapper.
        // Standard WordPress themes often use '.entry-content' or '.ct-container'.
        const content = await page.evaluate(() => {
            // Trying multiple common selectors in order of likelihood
            const contentEl = document.querySelector('.entry-content') || 
                              document.querySelector('.post-content') ||
                              document.querySelector('article'); 
            return contentEl ? (contentEl as HTMLElement).innerText : '';
        });

        if (!content) {
            console.warn(`⚠️ No content text found for ${article.title}`);
            continue;
        }

        // Save to DB
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