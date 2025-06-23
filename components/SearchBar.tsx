import { useRouter } from "next/router";
import { useState, useRef } from "react";
import { toast } from "sonner";
import { styled } from "@mui/material/styles";
import SearchIcon from "@mui/icons-material/Search";
import { IconButton, InputBase, Paper } from "@mui/material";
import { Route } from "nextjs-routes";

interface SearchBarProps {
	title: string;
	officerName: string;
}

const StyledPaper = styled(Paper)(({ theme }) => ({
	display: "flex",
	alignItems: "center",
	width: "100%",
	maxWidth: "400px",
	borderRadius: "var(--radius-md)",
	background: "rgba(255, 255, 255, 0.1)",
	backdropFilter: "blur(8px)",
	border: "1px solid rgba(255, 255, 255, 0.2)",
	transition: "var(--transition-default)",

	"&:hover, &:focus-within": {
		background: "rgba(255, 255, 255, 0.15)",
		border: "1px solid rgba(255, 255, 255, 0.3)",
	},
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
	flex: 1,
	color: "var(--white)",
	padding: "0.5rem 1rem",

	"& input::placeholder": {
		color: "rgba(255, 255, 255, 0.7)",
		opacity: 1,
	},
}));

const StyledIconButton = styled(IconButton)(({ theme }) => ({
	padding: "0.5rem",
	color: "var(--white)",

	"&:hover": {
		background: "rgba(255, 255, 255, 0.1)",
	},
}));

export default function SearchBar({ title, officerName }: SearchBarProps) {
	const router = useRouter();
	const [keyword, setKeyword] = useState<string>("");
	const searchInputRef = useRef<HTMLInputElement>(null);

	const handleSearch = (e: React.FormEvent) => {
		e.preventDefault();
		if (!keyword.trim()) {
			toast.error("Please enter a search term");
			return;
		}

		router.push({
			pathname: `/search/${keyword.trim()}`,
		} as Route);

		setKeyword("");
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter") {
			handleSearch(e);
		}
	};

	return (
		<form onSubmit={handleSearch}>
			<StyledPaper elevation={0}>
				<StyledInputBase
					placeholder="Search officers..."
					value={keyword}
					onChange={(e) => setKeyword(e.target.value)}
					onKeyDown={handleKeyDown}
					inputRef={searchInputRef}
					inputProps={{
						"aria-label": "search officers",
					}}
				/>
				<StyledIconButton type="submit" aria-label="search">
					<SearchIcon />
				</StyledIconButton>
			</StyledPaper>
		</form>
	);
}
