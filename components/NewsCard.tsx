interface NewsArticle {
  title: string;
  description: string;
  url: string;
  urlToImage?: string;
  publishedAt: string;
}

export default function NewsCard({ article }: { article: NewsArticle }) {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <a href={article.url} target="_blank" rel="noopener noreferrer">
        {article.urlToImage && (
          <img
            src={article.urlToImage}
            alt={article.title}
            className="w-full h-48 object-cover"
          />
        )}
        <div className="p-4">
          <h2 className="text-xl font-semibold mb-2">{article.title}</h2>
          <p className="text-gray-600 mb-4">{article.description}</p>
          <p className="text-sm text-gray-500">
            {new Date(article.publishedAt).toLocaleDateString()}
          </p>
        </div>
      </a>
    </div>
  );
} 