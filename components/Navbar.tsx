import Link from "next/link";
import * as React from "react";
import SearchBar from "./SearchBar";
import MenuIcon from "@mui/icons-material/Menu";
import Button from "@mui/material/Button";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import BPILogo from '../public/BPI-Logo-White.png'
import dept from '../public/department.png'
import Image from "next/image";
import '../public/favicon.ico'
import { bpi_deep_green } from "@styles/theme/lightTheme";

export default function Navbar() {
	const HamburgerMenu = () => {
		const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
		const open = Boolean(anchorEl);
		const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
			setAnchorEl(event.currentTarget);
		};
		const handleClose = () => {
			setAnchorEl(null);
		};
		return (
			<div>
				<Button id="basic-button" aria-controls={open ? "basic-menu" : undefined} aria-haspopup="true" aria-expanded={open ? "true" : undefined} onClick={handleClick}>
					<MenuIcon style={{ color: "white", fontSize: "3rem" }} />
				</Button>
				<Menu
					id="basic-menu"
					anchorEl={anchorEl}
					open={open}
					onClose={handleClose}
					anchorOrigin={{
						vertical: "bottom",
						horizontal: "center",
					}}
					transformOrigin={{
						vertical: "top",
						horizontal: "center",
					}}
					MenuListProps={{
						"aria-labelledby": "basic-button",
					}}
				>
					<MenuItem onClick={handleClose} style={{ justifyContent: "center" }}>
						<Link href={"/data"} className="text-l hover:link" style={{ display: "flex", alignItems: "center", flexDirection: "column" }}>
							Data
						</Link>
					</MenuItem>
					<MenuItem onClick={handleClose} style={{ justifyContent: "center" }}>
						<Link href={"/about"} className="text-l hover:link" style={{ display: "flex", alignItems: "center", flexDirection: "column" }}>
							About
						</Link>
					</MenuItem>
					<MenuItem onClick={handleClose} style={{ justifyContent: "center" }}>
						<Link href={"/feedback"} className="text-l hover:link" style={{ display: "flex", alignItems: "center", flexDirection: "column" }}>
							Feedback
						</Link>
					</MenuItem>
					<MenuItem onClick={handleClose} style={{ justifyContent: "center" }}>
						<a
							href={"https://boston.nxone.com/ApplicationBuilder/eFormRender.html?code=AA6693252735B48211CC5C0E68BC949D&Process=OPATPoliceAccountability"}
							// className={"outline outline-2 font-bold bg-primary text-white text-xl rounded-lg py-2 w-32 flex items-center justify-center active:scale-90 shadow-xl transition-button duration-200 hover:bg-primary-hover"}
							className="text-l hover:link"
							target={"_blank"}
							style={{ display: "flex", alignItems: "center", flexDirection: "column" }}
						>
							File Claim
						</a>
					</MenuItem>
				</Menu>
			</div>
		);
	};

	return (
		<header className="flex justify-center items-center h-[4rem] px-0 text-white pb-[0rem]" style={{ borderBottom: "white 0px solid", width: "100%", backgroundColor: bpi_deep_green }}>
			<div style={{ maxWidth: "1128px" }} className="flex justify-between items-center">
				<div className="flex justify-center items-center font-roboto ml-[-1.7rem]">
					<Link href="/" style={{ width: "5rem" }}>
						<img src={BPILogo.src} alt="BPI Logo" width={1000} height={1000} />
					</Link>
				</div>

				<div className="flex justify-start items-center font-roboto max-w-1128">
					<SearchBar title="Search Officers" officerName="" />

					<HamburgerMenu />
				</div>
			</div>
		</header>
	);
}
