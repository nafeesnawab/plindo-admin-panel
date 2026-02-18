import { cn } from "@/utils";
import { NavLink } from "react-router";

import plindoLogo from "@/assets/images/plindo-logo.png";

interface Props {
	size?: number | string;
	className?: string;
}
function Logo({ size = 36, className }: Props) {
	const sizeValue = typeof size === "number" ? size : Number.parseInt(size, 10) || 50;
	return (
		<NavLink to="/" className={cn(className)}>
			<img src={plindoLogo} alt="PLINDO" width={sizeValue} height={sizeValue} />
		</NavLink>
	);
}

export default Logo;
