'use client';

import { useEffect, useState } from 'react';
import NewsCard from '@/components/NewsCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface NewsArticle {
  title: string;
  description: string;
  url: string;
  urlToImage?: string;
  publishedAt: string;
}

export default function FeedPage() {
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const categories = ['general', 'business', 'entertainment', 'health', 'science', 'sports', 'technology'];
  const [selectedCategory, setSelectedCategory] = useState('general');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Define available locations
  const locations = [
    { code: 'us', name: 'United States' },
    { code: 'gb', name: 'United Kingdom' },
    { code: 'ca', name: 'Canada' },
    { code: 'au', name: 'Australia' },
    { code: 'in', name: 'India' },
    { code: 'jp', name: 'Japan' },
    // Add more locations as needed
  ];

  // Replace single selection with an array of selected locations.
  const [selectedLocations, setSelectedLocations] = useState<string[]>(['us']);

  // Helper to toggle location selection
  const toggleLocation = (code: string) => {
    setPage(1); // Reset to first page on filter change
    setSelectedLocations(prev =>
      prev.includes(code)
        ? prev.filter(loc => loc !== code)
        : [...prev, code]
    );
  };

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        let allArticles: NewsArticle[] = [];

        // Loop over each selected location to fetch news separately
        for (const location of selectedLocations) {
          const response = await fetch(
            `/api/news?category=${selectedCategory}&q=${searchQuery}&page=${page}&location=${location}`
          );
          const data = await response.json();
          // Assume the API returns an object with an "articles" array.
          allArticles = [...allArticles, ...data.articles];
        }

        if (page === 1) {
          setNews(allArticles);
        } else {
          setNews(prev => [...prev, ...allArticles]);
        }
        setHasMore(allArticles.length > 0);
      } catch (error) {
        console.error('Error fetching news:', error);
      } finally {
        setLoading(false);
      }
    };

    // Debounce the fetch to avoid excessive API calls during rapid input.
    const debounceTimer = setTimeout(() => {
      if (searchQuery.length > 2 || searchQuery.length === 0) {
        fetchNews();
      }
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [selectedCategory, searchQuery, page, selectedLocations]);

  const loadMoreNews = async () => {
    try {
      const nextPage = page + 1;
      let moreArticles: NewsArticle[] = [];

      for (const location of selectedLocations) {
        const response = await fetch(`/api/news?category=${selectedCategory}&q=${searchQuery}&page=${nextPage}&location=${location}`);
        const data = await response.json();
        moreArticles = [...moreArticles, ...data.articles];
      }

      if (moreArticles.length > 0) {
        setNews(prev => [...prev, ...moreArticles]);
        setPage(nextPage);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error fetching more news:', error);
    }
  };

  if (loading) {
    return <div>Loading news...</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Latest News</h1>
      <div className="flex gap-2 overflow-x-auto py-2 mb-6 scrollbar-hide">
        {categories.map(category => (
          <Button
            key={category}
            onClick={() => {
              setSelectedCategory(category);
              setPage(1);
            }}
            className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${
              selectedCategory === category
                ? 'bg-foreground text-background'
                : 'bg-background text-foreground hover:bg-foreground/10'
            }`}
          >
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </Button>
        ))}
      </div>
      <div className="flex flex-wrap gap-4 mb-6">
        <span className="text-sm font-medium">Locations:</span>
        {locations.map((location) => (
          <label key={location.code} className="flex items-center gap-1">
            <input
              type="checkbox"
              value={location.code}
              checked={selectedLocations.includes(location.code)}
              onChange={() => toggleLocation(location.code)}
              className="form-checkbox"
            />
            <span className="text-sm">{location.name}</span>
          </label>
        ))}
      </div>
      <Input
        type="text"
        placeholder="Search news..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="p-2 border border-foreground/20 rounded w-full mb-6 bg-background text-foreground"
      />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {news.map((article, index) => (
          <NewsCard 
            key={index} 
            article={article} 
            countryCode={selectedLocations[0]}
            category={selectedCategory}
            locations={locations}
          />
        ))}
      </div>
      {hasMore && (
        <Button 
          onClick={loadMoreNews}
          className="mt-6 px-4 py-2 bg-foreground text-background rounded hover:bg-foreground/90"
        >
          Load More
        </Button>
      )}
    </div>
  );
}
