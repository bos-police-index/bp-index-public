import Link from "next/link";
import * as React from "react";
import SearchBar from "./SearchBar";
import MenuIcon from "@mui/icons-material/Menu";
import Button from "@mui/material/Button";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import BPILogo from "../public/BPI Logo White 1.png";

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
		<header className="flex justify-between items-center h-[7rem] w-screen px-0 text-white pb-[0rem] max-w-1128">
			<div style={{ width: "86%", marginLeft: "0rem" }} className="flex justify-between items-center">
				<div className="flex justify-center items-end font-roboto mt-[1rem]">
					<Link href="/">
						<img src={BPILogo.src} alt="logo" width={100} />
					</Link>
				</div>

				<div className="flex justify-start items-center font-roboto w-1/2 mt-[-2rem] ">
					<SearchBar title="Search Officers" officerName="" />
					<div style={{ marginTop: "2.5rem" }}>
						<HamburgerMenu />
					</div>
				</div>
			</div>
		</header>
	);
}
