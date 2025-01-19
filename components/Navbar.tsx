import Link from "next/link";
import * as React from "react";
import SearchBar from "./SearchBar";
import MenuIcon from "@mui/icons-material/Menu";
import Button from "@mui/material/Button";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import BPILogo from '../public/BPI-Logo-White.png'
import { useRouter } from "next/router";
import "../public/favicon.ico";
import { bpi_deep_green } from "@styles/theme/lightTheme";
import { Route } from "nextjs-routes";

export default function Navbar() {
	const HamburgerMenu = () => {
		const router = useRouter();
		const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
		const open = Boolean(anchorEl);
		const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
			setAnchorEl(event.currentTarget);
		};
		const handleClose = () => {
			setAnchorEl(null);
		};

		const handleNavigate = (route: Route) => {
			router.push(route); // Navigate to the /data page
		};
		return (
			<div>
				<Button id="basic-button" aria-controls={open ? "basic-menu" : undefined} aria-haspopup="true" aria-expanded={open ? "true" : undefined} onClick={handleClick}>
					<MenuIcon style={{ color: "white", fontSize: "2.2rem" }} />
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
					<MenuItem style={{ justifyContent: "center" }} onClick={() => handleNavigate("/data" as unknown as Route)}>
						<div className="text-l" style={{ display: "flex", alignItems: "center", flexDirection: "column", width: "100%", height: "100%" }}>
							Data
						</div>
					</MenuItem>
					<MenuItem style={{ justifyContent: "center" }} onClick={() => handleNavigate("/about" as unknown as Route)}>
						<div className="text-l" style={{ display: "flex", alignItems: "center", flexDirection: "column", width: "100%", height: "100%" }}>
							About
						</div>
					</MenuItem>
					<MenuItem style={{ justifyContent: "center" }} onClick={() => handleNavigate("/feedback" as unknown as Route)}>
						<div className="text-l" style={{ display: "flex", alignItems: "center", flexDirection: "column", width: "100%", height: "100%" }}>
							Feedback
						</div>
					</MenuItem>
					<MenuItem style={{ justifyContent: "center" }} onClick={() => handleNavigate("https://forms.boston.gov/appbuilder/eFormRender.html?code=AA6693252735B48211CC5C0E68BC949D&Process=OPATPoliceAccountability" as unknown as Route)}>
						<div className="text-l" style={{ display: "flex", alignItems: "center", flexDirection: "column", width: "100%", height: "100%" }}>
							File Claim
						</div>
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
