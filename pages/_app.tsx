import { FunctionComponent, useEffect, useState } from "react";
import { CacheProvider, EmotionCache } from "@emotion/react";
import Link from "next/link";
import Head from "next/head";
import type { AppProps } from "next/app";
import { useRouter } from "next/router";
import { ApolloProvider } from "@apollo/client";
import { ThemeProvider, CssBaseline, createTheme } from "@mui/material";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import NProgress from "nprogress";

import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";

import Loading from "@components/Loading";
import Navbar from "@components/Navbar";

import createEmotionCache from "@utility/createEmotionCache";
import apolloClient from "@lib/apollo-client";

import "@styles/globals.css";
import lightThemeOptions from "@styles/theme/lightTheme";
import "nprogress/nprogress.css";

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
			if (router.pathname.startsWith("/data")) {
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
						<div data-theme="light" className={"max-w-screen h-screen overflow-clip bg-transparent max-h-screen flex flex-col"}>
							<Navbar /> 
							
							<div id={"wrapper"} className={"flex-1 max-w-screen overflow-y-auto overflow-x-hidden"}> {/* Takes remaining height, scrolls vertically, hides horizontal overflow */}
								<Head>
									<title>Boston Police Index</title>
									<link rel="icon" href="/favicon.ico" />
								</Head>
								
								<div id="allow-screen-stretch" style={{ margin: "0 auto", width: "100%", display: "flex", flexDirection: "column", minHeight: "100%" }}> {/* Ensures it stretches to at least fill wrapper */}
									<main className="flex-1 bg-transparent"> 
										{loading ? <Loading /> : <Component {...pageProps} />}
										<Toaster richColors closeButton />
										<div style={{ background: "none ", fontSize: "x-small", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem 0" }}>
											This is a beta version of the website, if you experience any bugs or would like to recommend a feature, please click{" "}
											<b>
												<Link href="/feedback" content="here">
													{" "}
													&nbsp;<u>here</u>&nbsp;
												</Link>
											</b>
											. For more information, please visit the FAQ page{" "}
											<b>
												<Link href="/about" scroll={false}>
													&nbsp;<u>here</u>
												</Link>
											</b>
											.
										</div>
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
