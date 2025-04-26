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

// In apolloClient.js
const apolloClient = new ApolloClient({
	link: httpLink,
	uri: process.env.NEXT_PUBLIC_API_URL || "/api/graphql-proxy",
	cache: cache,

	defaultOptions: {
		query: {
			fetchPolicy: "network-only",
		},
	},
});

export default apolloClient;
