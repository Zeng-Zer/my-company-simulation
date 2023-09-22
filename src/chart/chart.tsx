import "./chart.css";
import { ImpotRange } from "../simulator/generate-simulation";
import { SimulationConfig } from "../simulator/simulator"
import { Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceArea, ComposedChart, Label } from 'recharts';
import { computePercent, formatNumber } from "../utils/number-utils";
import { useState } from "react";
import { IS_NORMAL_RATE_FLOOR } from "../simulator/is/simulator-is";
import Legend from "./legend";


const colorIR = "#8884d8";
const colorIS = "#FFA500";
const colorCotisation = "#6874c8";
const colorRevenuAfterIR = "#57beeb43";
const colorRevenuAfterIS = "#82ca9d43";

interface ChartProps {
  ca: number;
  simulations: any[];
  config: SimulationConfig;
  impotRanges: ImpotRange[];
  onClick: (e: number) => void;
}

function impotRangeToReferenceArea(impotRange: ImpotRange[], ca: number, referenceY: number) {
  var referenceAreas = [];
  for (let i = 0; i < impotRange.length; i++) {
    const impot = impotRange[i];
    const start = impotRange[i].revenu;
    const end = (i + 1 === impotRange.length) ? ca : impotRange[i + 1].revenu;
    const rate = "IR " + (impot.rate * 100).toString() + "%";
    const fill = "#fbfbfb" + ((i + 1) * 25).toString(16);
    referenceAreas.push((<ReferenceArea x1={start} x2={end} y2={referenceY} stroke="blue" strokeOpacity={0.3} label={rate} fill={fill} />))
  }
  return referenceAreas;
}

function getPayloadData(payload: any, percent = false, total = 0) {
  const key = payload.dataKey;
  const value = payload.value;
  const percentage = percent ? ` (${formatNumber(computePercent(value, total))}%)` : '';
  return (<p key={key}>{`${key}: ${formatNumber(value)}${percentage}`}</p>);
}

function CustomTooltip(props: any) {
  const { active, payload, label, ca, simulations, dataKeys } = props
  if (active && payload && payload.length) {
    const current = simulations.find(s => s['Rémunération totale'] === label);
    const revenu = label as number;
    const revenuSociete = ca - revenu;
    const pStyle = {
      display: "flex",
      alignItems: "center" // Add this line to vertically align the content
    }

    const dotStyle = (color: string) => ({
      width: "10px",
      height: "10px",
      backgroundColor: color,
      borderRadius: "50%",
      display: "inline-block",
      marginRight: "5px"
    });

    const withColorDot = (element: JSX.Element, color: string) => (
      <div style={pStyle}><span className="dot" style={dotStyle(color)}></span>{element}</div>
    );
    const isRem = (k: string) => (k === "Rémunération nette après IR" || k === "Rémunération nette après IS")

    const filteredKeys = dataKeys.filter((d: DataKey) => d.enabled).reverse()
    const tooltipLines = filteredKeys
      .flatMap((dataKey: DataKey) => {
        const idx = dataKeys.indexOf(dataKey);
        const { dataKey: key, color, company } = dataKey;
        const data = payload.find((p: any) => p.dataKey === key);
        return [
          withColorDot(getPayloadData(data, true, company ? revenuSociete : revenu), color),
          ... idx < filteredKeys.length - 1 && isRem(key) && !isRem(filteredKeys[idx + 1].dataKey) ? [<hr className="solid" />] : []
        ]
      })

    return (
      <div>
        {tooltipLines}
        <hr className="solid"/>
        <small>{`Rémunération totale: ${revenu}`}</small>
        <br />
        <small>{`Revenu Société: ${revenuSociete}`}</small>
        <br />
        <small>{`Revenu Perso Brut: ${formatNumber(current['Rémunération nette avant IR'])}`}</small>
      </div>
    );
  }
}

export interface DataKey {
  dataKey: string;
  color: string;
  enabled: boolean;
  company: boolean;
}

function Chart(props: ChartProps) {
  const referenceIS15 = Math.abs(props.ca - (IS_NORMAL_RATE_FLOOR / (props.config.unit === "€/mois" ? 12 : 1)))
  const lastImpot = props.simulations[props.simulations.length - 1];
  const referenceY = lastImpot["Impôt sur le revenu"];
  const maxY = props.simulations[props.simulations.length - 1]["Rémunération totale"];

  const [dataKeys, setDataKeys] = useState<DataKey[]>([
    { dataKey: "Impôt sur le revenu", color: colorIR, enabled: true, company: false },
    { dataKey: "Cotisations et contributions", color: colorCotisation, enabled: true, company: false },
    { dataKey: "Impôt sur les sociétés", color: colorIS, enabled: true, company: true },
    { dataKey: "Rémunération nette après IR", color: colorRevenuAfterIR, enabled: true, company: false },
    { dataKey: "Rémunération nette après IS", color: colorRevenuAfterIS, enabled: true, company: true },
  ])

  const onClickChart = (e: any) => {
    if (e === null || e.activeLabel === undefined) return;
    const value = (e.activeLabel as unknown) as number
    props.onClick(value);
  }

  const onClickLegend = (data: any) => {
    const { dataKey } = data;
    setDataKeys(dataKeys.map(d => d.dataKey === dataKey ? { ...d, enabled: !d.enabled } : d));
  }

  return (
    <>
      <h4>Ratio IS/IR pour un CA de {props.ca}</h4>
      <div className="chart-container">
        <ComposedChart
          width={900}
          height={700}
          data={props.simulations}
          margin={{
            top: 10,
            right: 30,
            left: 30,
            bottom: 40,
          }}
          onClick={onClickChart}
        >
          <CartesianGrid strokeDasharray="1.5 1.5" />
          <XAxis type="number" dataKey="Rémunération totale" domain={['dataMin', 'dataMax']}>
            <Label value="Rémunération" offset={-10} position="insideBottom" />
          </XAxis>
          <YAxis type="number" domain={[0, maxY]}>
            <Label value="Chiffre d'affaire" offset={-15} angle={-90} position="insideLeft" />
          </YAxis>
          <Tooltip content={<CustomTooltip ca={props.ca} simulations={props.simulations} dataKeys={dataKeys} />} />
          <ReferenceArea x1={referenceIS15} x2={props.ca} y1={referenceY} y2={props.ca} stroke="red" strokeOpacity={0.3} label="IS 15%" fill="#fbfbfb11" />
          <ReferenceArea x1={0} x2={referenceIS15} y1={referenceY} y2={props.ca} stroke="red" strokeOpacity={0.3} label="IS 25%" fill="#fbfbfb33" />
          {impotRangeToReferenceArea(props.impotRanges, props.ca, referenceY)}
          {dataKeys.filter(d => d.enabled).map((dataKey) =>
            <Area type="monotone" dataKey={dataKey.dataKey} stackId="1" stroke={dataKey.color} fill={dataKey.color} isAnimationActive={false} />
          )}
        </ComposedChart>
        <Legend data={dataKeys.slice().reverse()} onClick={onClickLegend} />
      </div>
    </>
  )
}

export default Chart
