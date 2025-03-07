const resolvers = {
  Query: {
    // Fetch all articles from your persistent storage
    articles: async (_: any, __: any, { driver }: { driver: any }) => {
      const session = driver.session();
      try {
        const result = await session.run(
          `MATCH (a:Article) RETURN a ORDER BY a.createdAt DESC`
        );
        return result.records.map((record: any) => record.get('a').properties);
      } catch (error) {
        console.error("Error fetching articles:", error);
        throw new Error("Failed to fetch articles");
      } finally {
        await session.close();
      }
    },
    // Fetch a single article by its ID from your persistent storage
    article: async (_: any, { id }: { id: string }, { driver }: { driver: any }) => {
      const session = driver.session();
      try {
        const result = await session.run(
          `MATCH (a:Article {id: $id}) RETURN a`,
          { id }
        );
        if (result.records.length === 0) {
          throw new Error('Article not found');
        }
        return result.records[0].get('a').properties;
      } catch (error) {
        console.error("Error fetching article:", error);
        throw new Error("Failed to fetch article");
      } finally {
        await session.close();
      }
    },
  },
  Mutation: {
    // Create a new article and persist it
    createArticle: async (
      _: any,
      { title, description, content, author, featuredImage }: {
        title: string;
        description: string;
        content: string;
        author: string;
        featuredImage: string;
      },
      { driver }: { driver: any }
    ) => {
      const session = driver.session();
      try {
        const result = await session.run(
          `CREATE (a:Article {
            id: apoc.create.uuid(),
            title: $title,
            description: $description,
            content: $content,
            author: $author,
            featuredImage: $featuredImage,
            createdAt: datetime()
          }) RETURN a`,
          { title, description, content, author, featuredImage }
        );
        return result.records[0].get('a').properties;
      } catch (error) {
        console.error("Error creating article:", error);
        throw new Error("Failed to create article");
      } finally {
        await session.close();
      }
    },
  },
};

export default resolvers;
