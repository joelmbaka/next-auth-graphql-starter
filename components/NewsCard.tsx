interface NewsArticle {
  title: string;
  description: string;
  url: string;
  urlToImage?: string;
  publishedAt: string;
}

interface NewsCardProps {
  article: NewsArticle;
  layout?: 'default' | 'compact' | 'featured';
  countryCode: string;
  category: string;
  locations: { code: string; name: string }[];
}

import { getCountryFlag } from '@/lib/functions';

export default function NewsCard({ article, layout = 'default', countryCode, locations }: NewsCardProps) {
  if (layout === 'compact') {
    return (
      <div className="flex items-center space-x-4">
        {article.urlToImage && (
          <img
            src={article.urlToImage}
            alt={article.title}
            className="w-24 h-24 object-cover rounded"
          />
        )}
        <div>
          <h2 className="text-lg font-semibold">{article.title}</h2>
          <p className="text-sm text-gray-500">
            {new Date(article.publishedAt).toLocaleDateString()}
          </p>
        </div>
      </div>
    );
  }

  if (layout === 'featured') {
    return (
      <div className="relative h-96">
        {article.urlToImage && (
          <img
            src={article.urlToImage}
            alt={article.title}
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-4">
          <h2 className="text-white text-2xl font-bold">{article.title}</h2>
          <p className="text-white">{article.description}</p>
        </div>
      </div>
    );
  }

  // Default layout
  return (
    <div className="bg-background rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <a href={article.url} target="_blank" rel="noopener noreferrer">
        {article.urlToImage && (
          <img
            src={article.urlToImage}
            alt={article.title}
            className="w-full h-48 object-cover"
          />
        )}
        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-semibold">{article.title}</h2>
            <div className="flex items-center space-x-2">
              <img
                src={`https://flagcdn.com/${countryCode}.svg`}
                alt={countryCode}
                className="w-6 h-4"
              />
              <span className="text-sm text-gray-500">
                {locations.find(loc => loc.code === countryCode)?.name || 'Unknown Location'}
              </span>
            </div>
          </div>
          <p className="text-gray-600 mb-4">{article.description}</p>
          <p className="text-sm text-gray-500">
            {new Date(article.publishedAt).toLocaleDateString()}
          </p>
        </div>
      </a>
    </div>
  );
} 