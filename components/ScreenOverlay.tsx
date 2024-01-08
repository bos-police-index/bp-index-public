import { TbArrowBackUp } from "react-icons/tb";
import React from "react";

interface ScreenOverlayProps {
	title: string;
	children: React.ReactNode;
}
export default function ScreenOverlay({ title, children }: ScreenOverlayProps) {
	return (
		<div id={"screen-overlay"} className={"absolute top-0 left-0 z-20 w-screen h-screen backdrop-blur-lg bg-white/[.3] hidden"}>
			<div className={"flex flex-col w-full h-full"}>
				<span className={"flex flex-row justify-between items-center px-10 py-4"}>
					<p className={"text-3xl font-bold p-2 border-b-4 border-black w-1/4"}>{title}</p>
					<button
						onClick={() => {
							document.getElementById("screen-overlay").classList.add("hidden");
							document.getElementById("screen-overlay").classList.remove("flex");
						}}
						className={"bg-primary rounded-lg p-2 w-32 flex items-center justify-center active:scale-90 shadow-xl transition-button duration-300 hover:bg-primary-hover"}
					>
						<TbArrowBackUp className={"text-3xl text-white"} />
					</button>
				</span>
				<div className={"mt-6 px-10 flex-1"}>{children}</div>
			</div>
		</div>
	);
}
