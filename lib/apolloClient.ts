import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';


export const apolloClient = new ApolloClient({
    link: new HttpLink({
        uri: process.env.NEO4J_URI || 'neo4j://localhost:7687',
        headers: {
            Authorization: `Basic ${btoa(`${process.env.NEO4J_USERNAME}:${process.env.NEO4J_PASSWORD}`)}`,
        },
    }),
    cache: new InMemoryCache(),
});
