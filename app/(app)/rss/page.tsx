// app/rss/page.tsx
import Parser from 'rss-parser';

export const dynamic = 'force-dynamic'; // if you want to fetch data on every request

export default async function RSSPage() {
  const parser = new Parser();
  // Use a standard RSS feed URL instead
  const feed = await parser.parseURL('https://news.ycombinator.com/rss');

  return (
    <div style={{ padding: '1rem', fontFamily: 'sans-serif' }}>
      <h1>{feed.title}</h1>
      {feed.items.map((item, index) => (
        <div key={index} style={{ marginBottom: '1rem' }}>
          <h2>
            <a href={item.link} target="_blank" rel="noopener noreferrer">
              {item.title}
            </a>
          </h2>
          <p>{item.contentSnippet || 'No summary available.'}</p>
        </div>
      ))}
    </div>
  );
}
