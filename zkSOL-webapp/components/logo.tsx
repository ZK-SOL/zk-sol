import { IconSvgProps } from "@/types";


export const Logo: React.FC<IconSvgProps> = ({size = 32, width, height, ...props}) => (
  <span className="text-md font-bold " style={{fontFamily: 'Space Mono'}}>ZASK</span>
  );