"use client";

interface TableOfContentsButtonProps {
	svg_path: string;
	text: string;
	anchor: string;
}

export const TableOfContentsButton: React.FC<TableOfContentsButtonProps> = ({ svg_path, text, anchor }) => {
	return (
		<div>
			<button
				style={{
					backgroundColor: "#f5f5f5",
					height: "4rem",
					borderRadius: "5px",
					display: "flex",
					alignItems: "center",
					justifyContent: "flex-start",
					padding: "0.5rem 0.5rem",
					border: "none",
					cursor: "pointer",
					gap: "0rem",
					maxWidth: "9rem",
					lineHeight: "1rem",
				}}
				onClick={() => document.getElementById(anchor)?.scrollIntoView({ behavior: "smooth" })}
			>
				<img src={svg_path} alt="icon" style={{ height: "3rem", width: "3rem" }} />
				<p style={{ fontSize: "0.75rem", color: "#333", margin: 0 }}>{text}</p>
			</button>
		</div>
	);
};
