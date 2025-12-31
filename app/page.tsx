"use client";
import { useEffect, useState } from 'react';

// Define the shape of the data based on our Mongoose Schema
interface Article {
  _id: string;
  title: string;
  content: string;         // This is the AI Written version
  originalContent: string; // This is the Original Scraped version
  url: string;
  isUpdated: boolean;
  references: Array<{ title: string; link: string }>;
}

export default function Home() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [showOriginal, setShowOriginal] = useState(false);

  // Fetch data on load
  useEffect(() => {
    async function fetchArticles() {
      try {
        const res = await fetch('/api/articles');
        const data = await res.json();
        if (data.success) {
          setArticles(data.data);
          // Auto-select the first article if available
          if (data.data.length > 0) setSelectedArticle(data.data[0]);
        }
      } catch (error) {
        console.error("Failed to fetch articles", error);
      } finally {
        setLoading(false);
      }
    }
    fetchArticles();
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-lg">Loading Articles...</div>;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10 px-8 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          BeyondChats <span className="font-light text-slate-500">Re-Writer</span>
        </h1>
        <div className="text-sm text-slate-500">
          {articles.length} Articles Loaded
        </div>
      </header>

      <div className="flex h-[calc(100vh-65px)]">
        
        {/* LEFT SIDEBAR: Article List */}
        <aside className="w-1/3 max-w-sm border-r bg-white overflow-y-auto">
          <div className="p-4 space-y-3">
            {articles.map((article) => (
              <div 
                key={article._id}
                onClick={() => { 
                  setSelectedArticle(article); 
                  setShowOriginal(false); // Reset to AI view when switching
                }}
                className={`p-4 rounded-lg cursor-pointer transition-all duration-200 border
                  ${selectedArticle?._id === article._id 
                    ? 'bg-blue-50 border-blue-200 shadow-sm ring-1 ring-blue-200' 
                    : 'bg-white border-slate-100 hover:border-slate-300 hover:shadow-sm'
                  }`}
              >
                <h3 className="font-semibold text-slate-800 mb-2 line-clamp-2 leading-tight">
                  {article.title}
                </h3>
                <div className="flex items-center justify-between mt-2">
                  <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                    article.isUpdated 
                    ? 'bg-emerald-100 text-emerald-700' 
                    : 'bg-amber-100 text-amber-700'
                  }`}>
                    {article.isUpdated ? "AI Enhanced" : "Original Only"}
                  </span>
                  <span className="text-xs text-slate-400">
                    {/* Just a placeholder date logic */}
                    {new Date().toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* RIGHT CONTENT: Article Viewer */}
        <section className="flex-1 overflow-y-auto bg-slate-50 p-8 md:p-12">
          {selectedArticle ? (
            <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200 min-h-[500px]">
              
              {/* Toolbar */}
              <div className="flex items-center justify-between p-6 border-b bg-white rounded-t-xl sticky top-0 z-10">
                <div className="flex bg-slate-100 p-1 rounded-lg">
                  <button 
                    onClick={() => setShowOriginal(true)}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                      showOriginal ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    Original
                  </button>
                  <button 
                    onClick={() => setShowOriginal(false)}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                      !showOriginal ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    AI Rewrite ✨
                  </button>
                </div>
                
                <a 
                  href={selectedArticle.url} 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-xs font-medium text-blue-600 hover:underline flex items-center gap-1"
                >
                  Visit Source ↗
                </a>
              </div>

              {/* Content Body */}
              <div className="p-8 md:p-10">
                <h1 className="text-3xl font-bold text-slate-900 mb-6 leading-tight">
                  {selectedArticle.title}
                </h1>
                
                <div className="prose prose-slate max-w-none">
                  {/* We use whitespace-pre-line to preserve paragraphs from the text block */}
                  <div className="whitespace-pre-line text-lg leading-relaxed text-slate-700">
                    {showOriginal 
                      ? (selectedArticle.originalContent || "No original content found.") 
                      : (selectedArticle.content)
                    }
                  </div>
                </div>

                {/* References Footer (Only on AI View) */}
                {!showOriginal && selectedArticle.references && selectedArticle.references.length > 0 && (
                  <div className="mt-12 pt-8 border-t border-slate-100">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">
                      Sources Used by AI
                    </h4>
                    <ul className="space-y-2">
                      {selectedArticle.references.map((ref, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <span className="text-slate-300">•</span>
                          <a 
                            href={ref.link} 
                            target="_blank" 
                            className="text-blue-600 hover:underline truncate max-w-md block"
                          >
                            {ref.title}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <p>Select an article from the sidebar</p>
            </div>
          )}
        </section>

      </div>
    </main>
  );
}