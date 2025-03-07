# Next.js Auth & GraphQL Starter

A production-ready starter template for building modern web applications with:

- **Next.js 15** as the React framework
- **NextAuth.js** for authentication
- **Apollo GraphQL** for API layer
- **Neo4j** as the graph database backend

## Features

### Authentication
- Built-in support for OAuth providers (GitHub, Google)
- JWT-based session management
- Neo4j-backed user storage
- Easy to add additional providers

### GraphQL API
- Apollo Server integration
- Type-safe GraphQL schema
- Neo4j GraphQL bridge for seamless database operations
- Built-in GraphQL Playground for development

### Database
- Neo4j driver pre-configured
- Graph database optimized for relationships
- Environment-based configuration
- Session management best practices

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```
4. Configure your Neo4j credentials in `.env.local`
5. Run the development server:
   ```bash
   pnpm dev
   ```

## Environment Variables

Create a `.env.local` file with the following variables:

NEO4J_URI=your_neo4j_uri
NEO4J_USERNAME=your_username
NEO4J_PASSWORD=your_password
NextAuth
NEXTAUTH_SECRET=your_secret_key
NEXTAUTH_URL=http://localhost:3000
OAuth Providers
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

## Project Structure

.
├── app/                  # Next.js app router
│   ├── api/              # API routes
│   │   ├── auth/         # NextAuth endpoints
│   │   ├── graphql/      # GraphQL API
│   │   └── neo4j/        # Neo4j REST endpoints
├── lib/                  # Shared utilities
│   ├── driver.ts         # Neo4j driver configuration
│   └── apolloClient.ts   # Apollo Client setup
└── auth.ts               # NextAuth configuration
```

## Customization

### Adding New OAuth Providers
1. Import the provider from `next-auth/providers`
2. Add it to the `providers` array in `auth.ts`

### Extending GraphQL Schema
1. Modify the `typeDefs` in `app/api/graphql/route.ts`
2. Add resolvers as needed

### Database Operations
Use the pre-configured Neo4j driver:
```typescript
import driver from '@/lib/driver';

const session = driver.session();
// Perform your queries
await session.close();
```

## Why This Stack?

- **Next.js**: Provides server-side rendering, static generation, and API routes
- **Neo4j**: Perfect for relationship-heavy data models
- **GraphQL**: Type-safe, efficient API layer
- **NextAuth**: Secure, flexible authentication

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

MIT


