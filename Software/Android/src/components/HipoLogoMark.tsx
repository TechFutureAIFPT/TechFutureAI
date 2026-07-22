import Svg, { Circle, Path } from "react-native-svg";

export function HipoLogoMark({ size = 34 }: { size?: number }) {
  return (
    <Svg height={size} viewBox="0 0 64 64" width={size}>
      <Path
        d="M16 43c9.5 4.8 24.2 2.2 36-8.2"
        fill="none"
        stroke="#19BFE5"
        strokeLinecap="round"
        strokeWidth={4.2}
      />
      <Path
        d="M10 49c12.5 7.2 33.8 2.4 48-11.4"
        fill="none"
        stroke="#18A9D6"
        strokeLinecap="round"
        strokeWidth={4.2}
      />
      <Path
        d="M24 33c10.2-5.2 16.7-13.6 15.7-23"
        fill="none"
        stroke="#32105A"
        strokeLinecap="round"
        strokeWidth={4.2}
      />
      <Path
        d="M34 35c8.7-4.6 14.9-12.2 14.4-21.4"
        fill="none"
        stroke="#5B1487"
        strokeLinecap="round"
        strokeWidth={4.2}
      />
      <Path
        d="M43 37c7.6-4.2 12.1-10.9 10.6-18.8"
        fill="none"
        stroke="#8D22B2"
        strokeLinecap="round"
        strokeWidth={4.2}
      />
      <Circle cx={25} cy={32} fill="#D31EEA" r={4.6} />
      <Circle cx={35} cy={35} fill="#C719DE" r={4.6} />
      <Circle cx={44} cy={38} fill="#B91CD5" r={4.6} />
      <Circle cx={52} cy={35} fill="#28CBE5" r={4.6} />
      <Circle cx={58} cy={38} fill="#32D4EA" r={4.6} />
    </Svg>
  );
}
