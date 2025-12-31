import mongoose from 'mongoose';
import dotenv from 'dotenv';
import axios from 'axios';
import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Article from '../models/Article';

dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const SERPAPI_KEY = process.env.SERPAPI_KEY;
const MONGODB_URI = process.env.MONGODB_URI || '';

if (!GEMINI_API_KEY || !SERPAPI_KEY || !MONGODB_URI) {
  console.error("❌ Missing API Keys in .env (Need GEMINI_API_KEY & SERPAPI_KEY)");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

async function searchGoogle(query: string) {
  console.log(`🔎 Searching Google for: "${query}"...`);
  const url = `https://serpapi.com/search.json?q=${encodeURIComponent(query)}&api_key=${SERPAPI_KEY}&num=5`;
  
  try {
    const response = await axios.get(url);
    const results = response.data.organic_results || [];
    
    const validLinks = results
      .filter((r: any) => !r.link.includes('youtube.com') && !r.link.includes('.pdf'))
      .slice(0, 2); 

    return validLinks.map((r: any) => ({ title: r.title, link: r.link }));
  } catch (error) {
    console.error("❌ Google Search Failed:", error);
    return [];
  }
}

async function fetchPageContent(url: string) {
  try {
    const { data } = await axios.get(url, { 
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } 
    });
    
    const virtualConsole = new JSDOM(data).virtualConsole;
    virtualConsole.on("error", () => { });

    const dom = new JSDOM(data, { url, virtualConsole });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();
    
    return article ? article.textContent.slice(0, 2000) : null; 
  } catch (error) {
    console.warn(`⚠️ Could not scrape reference: ${url}`);
    return null;
  }
}

const runPhase2 = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ DB Connected");

    const articlesToProcess = await Article.find({ isUpdated: false });
    console.log(`📝 Found ${articlesToProcess.length} articles to process.`);

    for (const article of articlesToProcess) {
      console.log(`\n⚙️ Processing: ${article.title}`);

      const references = await searchGoogle(article.title);
      
      if (references.length === 0) {
        console.log("⏩ No references found, skipping...");
        continue;
      }

      let contextData = "";
      for (const ref of references) {
        console.log(`   Reading: ${ref.title}`);
        const text = await fetchPageContent(ref.link);
        if (text) {
          contextData += `\n\n--- REFERENCE: ${ref.title} ---\n${text}`;
        }
      }

      if (!contextData) {
          console.log("⏩ Could not read content. Skipping.");
          continue;
      }

      console.log("   🧠 Sending to Gemini AI...");
      const prompt = `
        You are an expert editor. 
        Original Article: "${article.content.slice(0, 1000)}..."
        
        New Information from Web:
        ${contextData}

        Task: Rewrite the original article to be more comprehensive using the new information. 
        Maintain a professional tone. 
        IMPORTANT: At the end, list the references used.
        Return ONLY the article body text (Markdown format).
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const newContent = response.text();

      if (newContent) {
          article.content = newContent; 
          article.isUpdated = true;
          article.references = references; 
          await article.save();
          console.log("✅ Article Rewritten & Saved!");
      }
    }
  } catch (error) {
      console.error("❌ Fatal Script Error:", error);
  } finally {
      await mongoose.disconnect();
      console.log("\n👋 Phase 2 Complete.");
  }
};

runPhase2();