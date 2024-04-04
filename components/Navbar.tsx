import Link from "next/link";
import { IoTriangleSharp } from "react-icons/io5";

export default function Navbar() {
	return (
		<header className="flex justify-between items-center flex-shrink-0 h-[5.5rem] w-screen px-16 text-white">
			<Link href="/">
				<p className="font-bold text-3xl font-righteous">BPI</p>
			</Link>
			<div className="flex justify-between items-center font-roboto w-1/4">
				<Link href={"/data"} className="font-bold text-xl hover:link flex items-center gap-1">
					Data
					{/* <IoTriangleSharp className="rotate-180 text-[#A8B6FF]" /> */}
				</Link>
				<Link href={"/about"} className={"font-bold text-xl hover:link"}>
					About
				</Link>
				<a
					href={"https://boston.nxone.com/ApplicationBuilder/eFormRender.html?code=AA6693252735B48211CC5C0E68BC949D&Process=OPATPoliceAccountability"}
					// className={"outline outline-2 font-bold bg-primary text-white text-xl rounded-lg py-2 w-32 flex items-center justify-center active:scale-90 shadow-xl transition-button duration-200 hover:bg-primary-hover"}
					className={"font-bold text-xl hover:link"}
					target={"_blank"}
				>
					File Claim
				</a>
			</div>
		</header>
	);
}
