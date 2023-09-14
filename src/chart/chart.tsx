import { simulateEURL } from "../simulator/eurl/simulator-eurl";
import { ImpotRange } from "../simulator/generate-simulation";
import { simulateIS } from "../simulator/is/simulator-is";
import { SimulationConfig } from "../simulator/simulator"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ReferenceArea, ComposedChart, Line } from 'recharts';


interface ChartProps {
  ca: number;
  simulations: any[];
  config: SimulationConfig;
  impotRanges: ImpotRange[];
}

function impotRangeToReferenceArea(impotRange: ImpotRange[], ca: number, referenceY: number) {
  var referenceAreas = [];
  for (let i = 0; i < impotRange.length; i++) {
    const impot = impotRange[i];
    const start = impotRange[i].revenu;
    const end = (i + 1 === impotRange.length) ? ca : impotRange[i + 1].revenu;
    const rate = "IR " + (impot.rate * 100).toString() + "%";
    const fill = "#fbfbfb" + (i * 45).toString(16);
    referenceAreas.push((<ReferenceArea x1={start} x2={end} y2={referenceY} stroke="blue" strokeOpacity={0.3} label={rate} fill={fill} />))
  }
  return referenceAreas;
}

function formatNumber(number: number) {
  return number.toLocaleString('en-US', { maximumFractionDigits: 2 }).replace(/,/g, ' ')
}

function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip">
        {/* <p className="label">{`${payload[4].dataKey} : ${payload[4].value}`}</p> */}
        {/* <p className="label">{`${payload[3].dataKey} : ${payload[3].value}`}</p> */}
        <p className="label">{`${payload[2].dataKey} : ${formatNumber(payload[2].value)}`}</p>
        <p className="label">{`${payload[1].dataKey} : ${formatNumber(payload[1].value)}`}</p>
        <p className="label">{`${payload[0].dataKey} : ${formatNumber(payload[0].value)}`}</p>
        <p className="label">{`Revenu: : ${label}`}</p>
      </div>
    );
  }
}

function Chart(props: ChartProps) {
  const referenceIS15 = Math.abs(props.ca - (42500 / (props.config.unit === "€/mois" ? 12 : 1)))
  const lastImpot = props.simulations[props.simulations.length - 1];
  const referenceY = lastImpot["Impôt sur le revenu"];
  return (
    <>
      <h4>Ratio IS/IR pour un CA de {props.ca}</h4>
      <ComposedChart
        width={1000}
        height={800}
        data={props.simulations}
        margin={{
          top: 10,
          right: 30,
          left: 0,
          bottom: 0,
        }}
      >
        <CartesianGrid strokeDasharray="1 1" />
        <XAxis type="number" dataKey="revenu" />
        <YAxis />
        <Tooltip content={<CustomTooltip />} />
        <ReferenceArea x1={referenceIS15} x2={props.ca} y1={referenceY} stroke="red" strokeOpacity={0.3} label="IS 15%" fill="#fbfbfb11" />
        <ReferenceArea x1={0} x2={referenceIS15} y1={referenceY} stroke="red" strokeOpacity={0.3} label="IS 25%" fill="#fbfbfb33" />
        {impotRangeToReferenceArea(props.impotRanges, props.ca, referenceY)}
        <Area type="monotone" dataKey="Impôt sur le revenu" stackId="1" stroke="#8884d8" fill="#8884d8" />
        <Area type="monotone" dataKey="Cotisations et contributions" stackId="1" stroke="#8884d8" fill="#8884d8" />
        <Area type="monotone" dataKey="Impôt sur les sociétés" stackId="1" stroke="#FFA500" fill="#FFA500" />
        {/* <Line type="monotone" dataKey="Impôt sur les sociétés" stroke="#CFA500" /> */}
        {/* <Area type="monotone" dataKey="Rémunération nette après impôt" stackId="1" stroke="#87CEEB" fill="#87CEEB" /> */}
        {/* <Area type="monotone" dataKey="Rémunération net après IS" stackId="1" stroke="#82ca9d" fill="#82ca9d" /> */}
      </ComposedChart>
    </>
  )
}

export default Chart
// <Area type="monotone" dataKey="Impôt sur les sociétés" stackId="1" stroke="#8884d8" fill="#8884d8" />
// <Area type="monotone" dataKey="Impôt sur le revenu" stackId="1" stroke="#82ca9d" fill="#82ca9d" />
// <Area type="monotone" dataKey="Cotisations et contributions" stackId="1" stroke="#82ca9d" fill="#82ca9d" />
