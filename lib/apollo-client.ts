import { ApolloClient, InMemoryCache, HttpLink, from } from '@apollo/client';

const httpLink = new HttpLink({
  uri: process.env.NEXT_PUBLIC_API_URL, 
});
if(httpLink.options.uri == undefined){
  console.log('check your .env for the httpLink')
  console.log(`httpLink: ${httpLink.options.uri}`)
}
// console.log(`httpLink: ${httpLink.options.uri}`)
const cache = new InMemoryCache();

const apolloClient = new ApolloClient({
  link: from([httpLink]),
  cache: cache,
});

export default apolloClient;
