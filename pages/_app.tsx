// pages/_app.jsx
import { FunctionComponent, useEffect, useState } from "react";
import type { AppProps } from "next/app";
import { CacheProvider, EmotionCache } from "@emotion/react";
import { ThemeProvider, CssBaseline, createTheme } from "@mui/material";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Loading from "@components/Loading"; // Make sure the path is correct

import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";

import createEmotionCache from "../utility/createEmotionCache";
import "../styles/globals.css";

import Head from "next/head";
import { useRouter } from "next/router";
import { Toaster } from "sonner";
import NProgress from "nprogress";
import "nprogress/nprogress.css";
import lightThemeOptions from "@styles/theme/lightTheme";
import Navbar from "@components/Navbar";
import { ApolloProvider } from "@apollo/client";
import apolloClient from "@lib/apollo-client";
interface ApplicationAppProps extends AppProps {
  emotionCache?: EmotionCache;
}

const clientSideEmotionCache = createEmotionCache();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

let lightTheme = createTheme(lightThemeOptions, {
  palette: {
    background: {
      default: "rgba(255, 255, 255, 0)",
    },
  },
});

const Application: FunctionComponent<ApplicationAppProps> = (props) => {
  const { Component, emotionCache = clientSideEmotionCache, pageProps } = props;
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleStart = () => {
		if(router.pathname.startsWith('/data')){
			setLoading(true);
		}
      NProgress.start();
    };

    const handleStop = () => {
      setLoading(false);
      NProgress.done();
    };

    router.events.on("routeChangeStart", handleStart);
    router.events.on("routeChangeComplete", handleStop);
    router.events.on("routeChangeError", handleStop);

    return () => {
      router.events.off("routeChangeStart", handleStart);
      router.events.off("routeChangeComplete", handleStop);
      router.events.off("routeChangeError", handleStop);
    };
  }, [router]);

	return (
		<ApolloProvider client={apolloClient}>
			<CacheProvider value={emotionCache}>
				<ThemeProvider theme={lightTheme}>
					<QueryClientProvider client={queryClient}>
						
							<CssBaseline />
							<div data-theme="light" className={"max-w-screen h-screen overflow-clip bg-transparent max-h-screen"}>
								<div id={"wrapper"} className={"max-w-screen h-full overflow-y-auto overflow-x-clip flex flex-col"}>
									<Head>
										<title>Boston Police Index</title>
										<link rel="icon" href="/favicon.ico" />
									</Head>
									<div id="allow-screen-stretch" style={{ height: "100vh", margin: "0 auto", width: "100%" }}>
										<Navbar />
										<main className="flex-1 bg-transparent">
											{loading ? <Loading /> : <Component {...pageProps} />}
											<Toaster richColors closeButton />
										</main>
									</div>
								</div>
							</div>
					</QueryClientProvider>
				</ThemeProvider>
			</CacheProvider>
		</ApolloProvider>
	);
};

export default Application;
