import { useSpring, animated } from "@react-spring/web";
import { bpi_deep_green } from "@styles/theme/lightTheme";
import { payCategoryColorMap } from "@styles/theme/lightTheme";

export enum PayCategories {
	totalPay = "totalPay",
	detailPay = "detailPay",
	otPay = "otPay",
	otherPay = "otherPay",
	retroPay = "retroPay",
	regularPay = "regularPay",
	injuredPay = "injuredPay",
	quinnPay = "quinnPay",
}

type RectangleProps = {
	width: number;
	height: number;
	x: number;
	y: number;
	mode: PayCategories;
};

const HistogramRectangle = (props: RectangleProps) => {
	const { x, y, width, height, mode } = props;

	const springProps = useSpring({
		to: { x, y, width, height },
		config: {
			friction: 30,
		},
		delay: x,
	});

	if (y === undefined) {
		return null;
	}

	return <animated.rect x={springProps.x} y={springProps.y} width={springProps.width} height={springProps.height} opacity={0.7} stroke={payCategoryColorMap[mode]} fill={payCategoryColorMap[mode]} fillOpacity={1} strokeWidth={1} rx={1} />;
};

export default HistogramRectangle;