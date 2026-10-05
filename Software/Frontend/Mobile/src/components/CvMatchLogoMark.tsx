import { Image, ImageStyle, StyleProp } from "react-native";
import { useAppTheme } from "../theme/ThemeContext";

interface CvMatchLogoMarkProps {
  size?: number;
  showText?: boolean;
  textColor?: string;
  style?: StyleProp<ImageStyle>;
}

export function CvMatchLogoMark({
  size = 32,
  showText = false,
  style
}: CvMatchLogoMarkProps) {
  const { isDark } = useAppTheme();

  if (showText) {
    // Aspect ratio of official CVMatch wordmark (298x102) is ~2.92
    const height = size;
    const width = Math.round(height * 2.92);

    return (
      <Image
        source={
          isDark
            ? (require("../../assets/brand/cvmatch-wordmark-dark.png") as any)
            : (require("../../assets/brand/cvmatch-wordmark-light.png") as any)
        }
        style={[
          {
            width,
            height,
            resizeMode: "contain"
          },
          style
        ]}
      />
    );
  }

  return (
    <Image
      source={require("../../assets/brand/product-logo-mark.png") as any}
      style={[
        {
          width: size,
          height: size,
          resizeMode: "contain"
        },
        style
      ]}
    />
  );
}


