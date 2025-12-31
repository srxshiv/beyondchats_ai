"use client";
import { useEffect, useState } from 'react';

interface Article {
  _id: string;
  title: string;
  content: string;
  originalContent: string;
  url: string;
  isUpdated: boolean;
  references: Array<{ title: string; link: string }>;
}

export default function Home() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [viewMode, setViewMode] = useState<'original' | 'ai'>('ai');

  useEffect(() => {
    async function fetchArticles() {
      try {
        const res = await fetch('/api/articles');
        const data = await res.json();
        if (data.success) {
          setArticles(data.data);
          if (data.data.length > 0) setSelectedArticle(data.data[0]);
        }
      } catch (error) {
        console.error("Failed to fetch", error);
      } finally {
        setLoading(false);
      }
    }
    fetchArticles();
  }, []);

  if (loading) return <div className="p-8 font-mono text-sm">Loading...</div>;

  return (
    <main className="min-h-screen flex flex-col md:flex-row font-sans bg-white text-black">
      <aside className="w-full md:w-80 border-r border-gray-200 h-screen overflow-y-auto flex-shrink-0">
        <div className="p-4 border-b border-gray-200 bg-gray-50 sticky top-0">
          <h1 className="font-bold text-sm tracking-wide uppercase">BeyondChats Reader</h1>
        </div>
        <div>
          {articles.map((article) => (
            <div 
              key={article._id}
              onClick={() => { 
                setSelectedArticle(article); 
                setViewMode('ai'); 
              }}
              className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors
                ${selectedArticle?._id === article._id ? 'bg-black text-white hover:bg-black' : ''}`}
            >
              <h3 className="text-sm font-medium leading-snug">{article.title}</h3>
              <div className="mt-2 text-xs opacity-60">
                {article.isUpdated ? '✓ AI Updated' : '• Pending'}
              </div>
            </div>
          ))}
        </div>
      </aside>

      <section className="flex-1 h-screen overflow-y-auto">
        {selectedArticle ? (
          <div className="max-w-3xl mx-auto p-8 md:p-16">
            <div className="mb-8 pb-4 border-b border-black">
              <a href={selectedArticle.url} target="_blank" className="text-xs text-gray-500 hover:underline mb-2 block">
                Original Source ↗
              </a>
              <h1 className="text-3xl md:text-4xl font-bold leading-tight">{selectedArticle.title}</h1>
            </div>

            <div className="flex gap-6 mb-8 text-sm font-medium border-b border-gray-100 pb-2">
              <button 
                onClick={() => setViewMode('ai')}
                className={`${viewMode === 'ai' ? 'text-black underline underline-offset-4' : 'text-gray-400 hover:text-black'}`}
              >
                AI Rewrite
              </button>
              <button 
                onClick={() => setViewMode('original')}
                className={`${viewMode === 'original' ? 'text-black underline underline-offset-4' : 'text-gray-400 hover:text-black'}`}
              >
                Original Text
              </button>
            </div>

            <article className="prose prose-neutral max-w-none">
              <div className="whitespace-pre-line text-lg leading-8 text-gray-800">
                {viewMode === 'original' 
                  ? (selectedArticle.originalContent || "No original content available.") 
                  : (selectedArticle.content)
                }
              </div>
            </article>

            {viewMode === 'ai' && selectedArticle.references && selectedArticle.references.length > 0 && (
              <div className="mt-16 pt-8 border-t border-gray-200">
                <h4 className="text-xs font-bold uppercase text-gray-400 mb-4 tracking-wider">References</h4>
                <ul className="space-y-2">
                  {selectedArticle.references.map((ref, i) => (
                    <li key={i}>
                      <a href={ref.link} target="_blank" className="text-sm text-blue-600 hover:underline block truncate">
                        [{i + 1}] {ref.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-sm text-gray-400">
            Select an article to begin reading.
          </div>
        )}
      </section>
    </main>
  );
}