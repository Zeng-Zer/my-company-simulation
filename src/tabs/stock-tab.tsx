import { Area, CartesianGrid, ComposedChart, Label, Line, ReferenceArea, ReferenceLine, Tooltip, XAxis, YAxis } from "recharts";
import { ImpotRange } from "../simulator/generate-simulation";
import { SimulationConfig } from "../simulator/simulator";
import { IS_NORMAL_RATE_FLOOR, simulateIS } from "../simulator/is/simulator-is";
import { DataKey, colorCotisation, colorIR, colorIS, colorRevenuAfterIR, colorRevenuAfterIS, getPayloadData, impotRangeToReferenceArea } from "../chart/chart";
import { useState } from "react";
import Legend from "../chart/legend";
import { formatNumber } from "../utils/number-utils";
import { useInput, useInputDropdown } from "../components/input";

const colorRevenuAfterInvestmentsIR = "#57beebc3";
const colorRevenuAfterInvestmentsIS = "#82ca9dc3";

function addInvestments(simulations: any[], ca: number, config: SimulationConfig, investmentYield: number, stockAccount: StockAccount) {
  const simulationsWithStockInvestments = simulations.map(simulation => {
    const revenu = simulation["Rémunération totale"];
    const revenuSociete = ca - revenu;
    // invest with net income
    const stockInvestments = simulation["Rémunération nette après IS"];
    const roi = stockInvestments * investmentYield;
    const newRevenuSociete = revenuSociete + roi;
    const newIS = simulateIS({ ...config, revenus: 0, ca: newRevenuSociete }).find(e => e.label === 'Impôt sur les sociétés')?.value;
    const netReturn = newRevenuSociete - newIS
    const netFromFlatTax = netReturn * 0.7
    const roiNet = netReturn - stockInvestments
    const roiNetFromFlatTax = roiNet * 0.7
    return {
      ...simulation,
      "Société | ROI brut": roi,
      "Société | ROI net": roiNet,
      "Société | Résultat brut": newRevenuSociete,
      "Société | Résultat net après IS": netReturn,
      "Société | Dividendes net après Flat Tax": netFromFlatTax,
      "Société | ROI net après Flat Tax": roiNetFromFlatTax,
    }
  }).map(simulation => {
    const revenu = simulation["Rémunération nette après IR"] > 0 ? simulation["Rémunération nette après IR"] : 0;
    const roi = revenu * investmentYield;
    // net roi after prelevement sociaux (17.2%)
    const taxes = stockAccount === 'PEA' ? 0.172 : 0.3;
    const netRoi = roi * (1 - taxes);
    const netReturn = revenu + netRoi;
    return {
      ...simulation,
      "Perso | ROI brut": roi,
      "Perso | ROI net": netRoi,
      "Perso | Revenu net": netReturn,
    }
  }).map(simulation => {
    const companyNet = simulation["Société | Dividendes net après Flat Tax"]
    const personalNet = simulation["Perso | Revenu net"]
    const totalNet = companyNet + personalNet;
    const investissementNet = simulation["Société | ROI net après Flat Tax"] + simulation["Perso | ROI net"]
    return {
      ...simulation,
      "(Après investissement) Total": totalNet,
      "Investissement Net": investissementNet,
    }
  })
  return simulationsWithStockInvestments;
}

interface StockTabProps {
  ca: number;
  simulations: any[];
  config: SimulationConfig;
  impotRanges: ImpotRange[];
  onClick: (e: number) => void;
}

function CustomTooltip(props: any) {
  const { active, payload, label, ca, simulations, dataKeys, maxTotal } = props
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
    const filteredKeys = dataKeys.filter((d: DataKey) => d.enabled).reverse()
    const tooltipLines = filteredKeys
      .flatMap((dataKey: DataKey) => {
        const { dataKey: key, color, company } = dataKey;
        const data = payload.find((p: any) => p.dataKey === key);
        return [
          withColorDot(getPayloadData(data, true, company ? revenuSociete : revenu), color),
          ...company ? [
            <small>{getPayloadData({dataKey: "Investissement", value: current["Rémunération nette après IS"]}, true, revenuSociete)}</small>,
            <small>{getPayloadData({dataKey: "CTO | ROI brut", value: current["Société | ROI brut"]})}</small>,
            <small>{getPayloadData({dataKey: "CTO | Résultat brut", value: current["Société | Résultat brut"]})}</small>,
            <small>{getPayloadData({dataKey: "CTO | Résultat net après IS", value: current["Société | Résultat net après IS"]})}</small>,
          ] : [
            <small>{getPayloadData({dataKey: "Investissement", value: current["Rémunération nette après IR"]}, true, revenu)}</small>,
            <small>{getPayloadData({dataKey: "Perso | ROI brut", value: current["Perso | ROI brut"]})}</small>,
            <small>{getPayloadData({dataKey: "Perso | ROI net", value: current["Perso | ROI net"]})}</small>,
          ],
        ]
      })

    return (
      <div>
        {tooltipLines}
        <hr className="solid"/>
        {`Total Net: ${formatNumber(current['(Après investissement) Total'])} | Diff Max Total: ${formatNumber(maxTotal - current['(Après investissement) Total'])}`}
        <hr className="solid"/>
        <small>{`Rémunération totale: ${revenu}`}</small>
        <br />
        <small>{`Résultat Société: ${revenuSociete}`}</small>
        <br />
        <small>{`Revenu Perso Brut: ${formatNumber(current['Rémunération nette avant IR'])}`}</small>
        <br />
      </div>
    );
  }
}

type StockAccount = 'CTO' | 'PEA'

function StockTab(props: StockTabProps) {
  const referenceIS15 = Math.abs(props.ca - (IS_NORMAL_RATE_FLOOR / (props.config.unit === "€/mois" ? 12 : 1)))
  const lastImpot = props.simulations[props.simulations.length - 1];
  const referenceY = lastImpot["Impôt sur le revenu"];
  const maxY = props.simulations[props.simulations.length - 1]["Rémunération totale"];

  const [returnYield, setReturnYield, returnYieldInput] = useInput({ type: 'number', value: 5 })
  const [stockAccount, setStockAccount, stockAccountInput] = useInputDropdown<StockAccount>([
    { value: 'PEA', label: 'PEA' },
    { value: 'CTO', label: 'CTO' },
  ])

  const newSimulations = addInvestments(
    props.simulations,
    props.ca,
    props.config,
    (isNaN(returnYield) ? 0 : returnYield) / 100,
    stockAccount.value
  );

  const maxRevenuInvestments = newSimulations.reduce((acc, curr) => {
    const { x, total } = acc;
    return {
      x: curr["(Après investissement) Total"] > total ? curr['Rémunération totale'] : x,
      total: curr["(Après investissement) Total"] > total ? curr["(Après investissement) Total"] : total,
    }
  }, { x: 0, total: 0 });

  const [dataKeys, setDataKeys] = useState<DataKey[]>([
    { dataKey: "Perso | Revenu net", color: colorRevenuAfterInvestmentsIR, enabled: true, company: false },
    { dataKey: "Société | Dividendes net après Flat Tax", color: colorRevenuAfterInvestmentsIS, enabled: true, company: true },
    // { dataKey: "Perso | ROI net", color: colorRevenuAfterInvestmentsIR, enabled: true, company: false },
    // { dataKey: "Société | ROI net après Flat Tax", color: colorRevenuAfterInvestmentsIS, enabled: true, company: true },
  ])

  const onClickLegend = (data: any) => {
    const { dataKey } = data;
    setDataKeys(dataKeys.map(d => d.dataKey === dataKey ? { ...d, enabled: !d.enabled } : d));
  }

  const onClickChart = (e: any) => {
    if (e === null || e.activeLabel === undefined) return;
    const value = (e.activeLabel as unknown) as number
    props.onClick(value);
  }

  const chartMaxY = Math.ceil(maxRevenuInvestments.total * 100) / 100;

  return (
    <div>
      <h4>Gain en bourse Perso / Société pour un CA de {props.ca}</h4>
      <label>Rendement investissement %: {returnYieldInput}</label><br/>
      <label>Support d'investissement: {stockAccountInput}</label><br/>
      <div className="chart-container">
        <ComposedChart
          width={900}
          height={700}
          data={newSimulations}
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
          <YAxis type="number" domain={[0, chartMaxY]}>
            <Label value="Chiffre d'affaire" offset={-15} angle={-90} position="insideLeft" />
          </YAxis>
          <Tooltip content={<CustomTooltip ca={props.ca} simulations={newSimulations} dataKeys={dataKeys} maxTotal={maxRevenuInvestments.total}/>} />
          <ReferenceArea x1={referenceIS15} x2={props.ca} y1={referenceY} y2={chartMaxY} stroke="red" strokeOpacity={0.3} label="IS 15%" fill="#fbfbfb11" />
          <ReferenceArea x1={0} x2={referenceIS15} y1={referenceY} y2={chartMaxY} stroke="red" strokeOpacity={0.3} label="IS 25%" fill="#fbfbfb33" />
          {impotRangeToReferenceArea(props.impotRanges, props.ca, referenceY)}
          {dataKeys.filter(d => d.enabled).map((dataKey) =>
            <Area type="monotone" dataKey={dataKey.dataKey} stackId="1" stroke={dataKey.color} fill={dataKey.color} isAnimationActive={false} />
          )}
          <Line type="monotone" dataKey="(Après investissement) Total" stroke="green" dot={false} isAnimationActive={false} />
          <ReferenceLine x={maxRevenuInvestments.x} stroke="red" strokeDasharray="3 3">
            <Label position="insideBottom" offset={10} stroke="#ff888888" value={formatNumber(maxRevenuInvestments.total)} />
          </ReferenceLine>
        </ComposedChart>
        <Legend data={dataKeys.slice().reverse()} onClick={onClickLegend} />
      </div>
    </div>
  )
}

export default StockTab;
