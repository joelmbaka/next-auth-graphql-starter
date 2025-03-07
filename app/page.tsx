// app/page.tsx
export default function HomePage() {
    return (
      <div className="flex flex-col h-screen p-4 rounded-lg items-center justify-center">
        <h1>Welcome to My Site</h1>
        <p>Read our latest articles below:</p>
        <iframe
          src="/rss"
          title="RSS Feed"
          width="100%"
          height="600"
          style={{ border: 'none' }}
        ></iframe>
      </div>
    );
  }
  