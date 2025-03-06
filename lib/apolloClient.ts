import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';

const client = new ApolloClient({
  link: new HttpLink({
    uri: process.env.NEO4J_HTTP_URL,
    headers: {
      Authorization: 'Basic ' + btoa(`${process.env.NEO4J_USERNAME}:${process.env.NEO4J_PASSWORD}`),
    },
  }),
  cache: new InMemoryCache(),
});

export default client; 