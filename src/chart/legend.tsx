import "./legend.css";
import { DataKey } from "./chart";

interface LegendProps {
  data: DataKey[];
  onClick: (d: DataKey) => void;
}

const changeOpacity = (hexColor: string, newOpacity: number) => {
  if (hexColor.length === 7) {
    hexColor = hexColor + 'ff';
  }
  return hexColor.replace(/..$/, Math.round(newOpacity * 255).toString(16).padStart(2, '0').toUpperCase());
}

const dotStyle = (color: string) => ({
  width: "10px",
  height: "10px",
  backgroundColor: color,
  borderRadius: "50%",
  display: "inline-block",
  marginRight: "5px"
});

const pStyle = {
  display: "flex",
  alignItems: "center" // Add this line to vertically align the content
}

const withColorDot = (element: string, color: string) => (
  <div style={pStyle}><span className="dot" style={dotStyle(color)}></span>{element}</div>
);

function Legend(props: LegendProps) {
  return (
    <div className="legends-container">
      {props.data.map((d: DataKey) => {
        const { dataKey, color, enabled } = d;
        const newColor = enabled ? changeOpacity(color, 1) : changeOpacity("#808080", 0.5);
        return (
          <span className="legend-item" key={dataKey} onClick={() => props.onClick(d)} style={{ color: newColor }}>
            {withColorDot(dataKey, newColor)}
          </span>
        );
      }
      )}
    </div>
  )
}

export default Legend;
