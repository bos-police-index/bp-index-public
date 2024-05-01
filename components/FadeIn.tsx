import React, { useState, useRef, ReactNode, useEffect } from "react";

export default function FadeInSection({ children }: { children: ReactNode }) {
	const [isVisible, setVisible] = useState(false);
	const domRef = useRef();

	useEffect(() => {
		const observer = new IntersectionObserver((entries) => {
			entries.forEach((entry) => setVisible(entry.isIntersecting));
		});
		observer.observe(domRef.current);
	}, []);

	return (
		<div className={`fade-in-section ${isVisible ? "is-visible" : ""}`} ref={domRef}>
			{children}
		</div>
	);
}
