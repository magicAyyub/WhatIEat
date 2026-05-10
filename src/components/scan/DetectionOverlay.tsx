import { View } from "react-native";
import Svg, { Polygon } from "react-native-svg";

import { AppText } from "@/components/ui/app-text";
import { PREVIEW_SIZE, scaleBox, scalePolygon } from "@/helpers/utils/scan";
import type { Detection } from "@/types/ingredient";

type Props = {
  detections: Detection[];
  showBoxes: boolean;
  showMasks: boolean;
};

export function DetectionOverlay({ detections, showBoxes, showMasks }: Props) {
  return (
    <>
      {showMasks ? (
        <Svg
          width={PREVIEW_SIZE}
          height={PREVIEW_SIZE}
          style={{ position: "absolute", left: 0, top: 0 }}
        >
          {detections.map((d, idx) => {
            const polygon = d.mask?.polygon;
            if (!polygon || polygon.length < 3) return null;
            return (
              <Polygon
                key={`mask-${d.name}-${idx}`}
                points={scalePolygon(polygon)}
                fill="rgba(34,197,94,0.20)"
                stroke="rgba(34,197,94,0.9)"
                strokeWidth={1.5}
              />
            );
          })}
        </Svg>
      ) : null}

      {showBoxes
        ? detections.map((d, idx) => {
            const b = scaleBox(d);
            return (
              <View
                key={`box-${d.name}-${idx}`}
                style={{
                  position: "absolute",
                  left: b.left,
                  top: b.top,
                  width: b.width,
                  height: b.height,
                  borderColor: "#22c55e",
                  borderWidth: 2,
                }}
              >
                <View
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    backgroundColor: "#22c55e",
                    paddingHorizontal: 4,
                    paddingVertical: 1,
                  }}
                >
                  <AppText className="text-xs text-white">
                    {d.name} {d.score.toFixed(2)}
                  </AppText>
                </View>
              </View>
            );
          })
        : null}
    </>
  );
}
