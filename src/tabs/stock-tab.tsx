import { Area, CartesianGrid, ComposedChart, Label, Line, ReferenceArea, ReferenceLine, Tooltip, XAxis, YAxis } from "recharts";
import { ImpotRange, applyIS, generateInvestmentsSimulations } from "../simulator/generate-simulation";
import { SimulationConfig } from "../simulator/simulator";
import { IS_NORMAL_RATE_FLOOR, simulateIS } from "../simulator/is/simulator-is";
import { DataKey, colorCotisation, colorIR, colorIS, colorRevenuAfterIR, colorRevenuAfterIS, getPayloadData, impotRangeToReferenceArea } from "../chart/chart";
import { useState } from "react";
import Legend from "../chart/legend";
import { formatNumber } from "../utils/number-utils";
import { useInput, useInputCheckbox, useInputDropdown, useInputSlider, useSubmitButton } from "../components/input";
import { findLastMatchingElement } from "../utils/array-utils";

const colorRevenuAfterInvestmentsIR = "#57beebc3";
const colorRevenuAfterInvestmentsIS = "#82ca9dc3";

const colorInvestmentsIR = "#57beeb73";
const colorInvestmentsIS = "#82ca9d73";

function addInvestments(
  simulations: any[],
  ca: number,
  config: SimulationConfig,
  investmentYield: number,
  stockAccount: StockAccount,
  reserveCompany: number,
  reservePerso: number,
) {
  const simulationsWithStockInvestments = simulations.map(simulation => {
    const revenu = simulation["Rémunération totale"];
    const revenuSociete = ca - revenu;
    // invest with net income
    const amountToInvest = simulation["Rémunération nette après IS"] - reserveCompany
    const stockInvestments = amountToInvest > 0 ? amountToInvest : 0;
    const roi = stockInvestments * investmentYield;
    const newRevenuSociete = revenuSociete + roi;
    const newIS = applyIS(roi, revenuSociete, 0)
    // const newIS = simulateIS({ ...config, revenus: 0, ca: newRevenuSociete }).find(e => e.label === 'Impôt sur les sociétés')?.value;
    const netReturn = newRevenuSociete - newIS - reserveCompany > 0 ? newRevenuSociete - newIS - reserveCompany : 0;
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
    const amountToInvest = simulation["Rémunération nette après IR"] - reservePerso;
    const stockInvestments = amountToInvest > 0 ? amountToInvest : 0;
    const roi = stockInvestments * investmentYield;
    // net roi after prelevement sociaux (17.2%)
    const taxes = stockAccount === 'PEA' ? 0.172 : 0.3;
    const netRoi = roi * (1 - taxes);
    const netReturn = stockInvestments + netRoi;
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
            <small>{getPayloadData({dataKey: "CTO | ROI net", value: current["Société | ROI net"]})}</small>,
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

function CustomTooltipInvest(props: any) {
  const { active, payload, label, ca, simulations, dataKeys, maxTotal } = props
  if (active && payload && payload.length) {
    const current = simulations.find(s => s['year'] === label);
    const year = label as number;
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
    const lastCompany = findLastMatchingElement(filteredKeys, (d: DataKey) => d.company)
    const lastNonCompany = findLastMatchingElement(filteredKeys, (d: DataKey) => !d.company)
    const tooltipLines = filteredKeys
      .flatMap((dataKey: DataKey) => {
        const { dataKey: key, color, company } = dataKey;
        const data = payload.find((p: any) => p.dataKey === key);
        return [
          withColorDot(getPayloadData(data), color),
          ...key == lastCompany?.dataKey ? [
            <hr className="solid"/>,
            <>{getPayloadData({dataKey: "Société | Total Net Après Flat Tax", value: current["Société | Total Net Après Flat Tax"]})}</>,
            <small>{getPayloadData({dataKey: "Société | Investissement", value: current["Société | Investissement"]})}</small>,
            <small>{getPayloadData({dataKey: "Société | Roi Brut Précédent", value: current["Société | Roi Précédent"]})}</small>,
            <small>{getPayloadData({dataKey: "Société | Roi Brut", value: current["Société | Roi Brut"]})}</small>,
            <small>{getPayloadData({dataKey: "Société | Roi Total Net", value: current["Société | Roi Net"]})}</small>,
            <hr className="solid"/>,
          ] : [],
          ...key == lastNonCompany?.dataKey ? [
            <hr className="solid"/>,
            <>{getPayloadData({dataKey: "Perso | Total Net", value: current["Perso | Total Net"]})}</>,
            <small>{getPayloadData({dataKey: "Perso | Roi Brut Précédent", value: current["Perso | Roi Précédent"]})}</small>,
            <small>{getPayloadData({dataKey: "Perso | Roi Brut", value: current["Perso | Roi Brut"]})}</small>,
            <hr className="solid"/>,
          ] : [],
        ]
      })

    return (
      <div>
        {tooltipLines}
        <>{`Total Net: ${formatNumber(current['Total Net'])}`}</>
        <br />
        <small>{`Année: ${current['year']}`}</small>
        <br />
      </div>
    );
  }
}

export type StockAccount = 'CTO' | 'PEA'

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
  const [reserveCompany, setReserveCompany, reserveCompanyInput] = useInput({ type: 'number', value: 0 })
  const [reservePerso, setReservePerso, reservePersoInput] = useInput({ type: 'number', value: 0 })
  const [investmentYears, setInvestmentYears, investmentYearsInput] = useInputSlider({ min: 1, max: 40, value: 1 })

  const newSimulations = addInvestments(
    props.simulations,
    props.ca,
    props.config,
    (isNaN(returnYield) ? 0 : returnYield) / 100,
    stockAccount.value,
    reserveCompany,
    reservePerso,
  )

  const simulationsWithInvestments = props.simulations.map(simulation => {
    const investments = generateInvestmentsSimulations({
      simulation, stockAccount: stockAccount.value, returnYield, nbYear: 40, reinvest: true
    })
    return {simulation, investments}
  })

  const yearMax = simulationsWithInvestments.reduce((acc, curr) => {
    const { yearMax, year1 } = acc;
    const { simulation, investments } = curr;
    const newYearMax = investments[investmentYears - 1]["Total Net"];
    const newYear1 = investments[0]["Total Net"];
    return {
      yearMax: newYearMax > yearMax.amount ? { amount: newYearMax, remuneration: simulation["Rémunération totale"] } : yearMax,
      year1: newYear1 > year1.amount ? { amount: newYear1, remuneration: simulation["Rémunération totale"] } : year1,
    }
  }, { yearMax: { amount: 0, remuneration: 0}, year1: { amount: 0, remuneration: 0}});

  // console.log({yearMax})

  // const { year5Max, year10Max, year15Max, year20Max } = simulationsWithInvestments.reduce((acc, curr) => {
  //   const { year5Max, year10Max, year15Max, year20Max } = acc;
  //   const { simulation, investments } = curr;
  //   const newYear5  = investments[4]["Total Net"];
  //   const newYear10 = investments[9]["Total Net"];
  //   const newYear15 = investments[14]["Total Net"];
  //   const newYear20 = investments[19]["Total Net"];
  //   return {
  //     year5Max: newYear5 > year5Max.amount ? { amount: newYear5, remuneration: simulation["Rémunération totale"] } : year5Max,
  //     year10Max: newYear10 > year10Max.amount ? { amount: newYear10, remuneration: simulation["Rémunération totale"] } : year10Max,
  //     year15Max: newYear15 > year15Max.amount ? { amount: newYear15, remuneration: simulation["Rémunération totale"] } : year15Max,
  //     year20Max: newYear20 > year20Max.amount ? { amount: newYear20, remuneration: simulation["Rémunération totale"] } : year20Max,
  //   }
  // }, { year5Max: { amount: 0, remuneration: 0}, year10Max: { amount: 0, remuneration: 0}, year15Max: { amount: 0, remuneration: 0}, year20Max: { amount: 0, remuneration: 0}});
  //
  // console.log({year5Max, year10Max, year15Max, year20Max})

  // const maxRevenuInvestments = newSimulations.reduce((acc, curr) => {
  //   const { x, total } = acc;
  //   const newTotal = curr["(Après investissement) Total"];
  //   const companyRoi = curr["Société | ROI net après Flat Tax"];
  //   const persoRoi = curr["Perso | ROI net"];
  //   const isValid = companyRoi > 0 && persoRoi > 0;
  //   return {
  //     x: newTotal > total && isValid ? curr['Rémunération totale'] : x,
  //     total: newTotal > total && isValid ? newTotal : total,
  //   }
  // }, { x: 0, total: 0 });

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

  // const chartMaxY = Math.ceil(maxRevenuInvestments.total * 100) / 100;
  const chartMaxY = Math.ceil(yearMax.year1.amount * 100) / 100;

  // investissements bourse

  const [nbYear, setNbYear, nbYearInput] = useInput({ type: 'number', value: 20 })
  const [reinvest, setReinvest, reinvestInput] = useInputCheckbox(true)

  const [investmentsSimulations, setInvestmentsSimulations] = useState<any[]>([]);

  const [submit, setSubmit, submitInput] = useSubmitButton("Lancer la simulation", () => {
    const simulation = props.simulations.find(s => s['Rémunération totale'] === props.config.revenus)
    setInvestmentsSimulations(generateInvestmentsSimulations({
      simulation, stockAccount: stockAccount.value, returnYield, nbYear, reinvest
    }))
  })
  
  const investmentChartMaxY = /* submit &&  */investmentsSimulations.length > 0 ? Math.ceil(
    // investmentsSimulations[investmentsSimulations.length - 1]["Société | Roi Net Après Flat Tax"] +
    // investmentsSimulations[investmentsSimulations.length - 1]["Perso | Roi Net"]
    investmentsSimulations[investmentsSimulations.length - 1]["Total Net"]
  ) : 0

  const [dataInvestKeys, setDataInvestKeys] = useState<DataKey[]>([
    { dataKey: "Société | Roi Net Après Flat Tax", color: colorRevenuAfterInvestmentsIS, enabled: true, company: true },
    { dataKey: "Société | Investissement Net", color: colorInvestmentsIS, enabled: reinvest, company: true },
    { dataKey: "Perso | Roi Net", color: colorRevenuAfterInvestmentsIR, enabled: true, company: false },
    { dataKey: "Perso | Investissement", color: colorInvestmentsIR, enabled: reinvest, company: false },
  ])

  const onClickInvestLegend = (data: any) => {
    const { dataKey } = data;
    setDataInvestKeys(dataInvestKeys.map(d => d.dataKey === dataKey ? { ...d, enabled: !d.enabled } : d));
  }


  return (
    <div>
      <div>
        <h4>Gain en bourse Perso / Société pour un CA de {props.ca}</h4>
        <label>Rendement investissement %: {returnYieldInput}</label><br/>
        <label>Support d'investissement: {stockAccountInput}</label><br/>
        <label>Meilleur rentabilité sur {investmentYears} an{investmentYears > 1 && "s"}: {investmentYearsInput} </label><br/>
        {/* <label>Réserve perso: {reservePersoInput}</label><br/> */}
        {/* <label>Réserve société: {reserveCompanyInput}</label><br/> */}
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
            <Tooltip content={<CustomTooltip ca={props.ca} simulations={newSimulations} dataKeys={dataKeys} maxTotal={yearMax.year1.amount}/>} />
            <ReferenceArea x1={referenceIS15} x2={props.ca} y1={referenceY} y2={chartMaxY} stroke="red" strokeOpacity={0.3} label="IS 15%" fill="#fbfbfb11" />
            <ReferenceArea x1={0} x2={referenceIS15} y1={referenceY} y2={chartMaxY} stroke="red" strokeOpacity={0.3} label="IS 25%" fill="#fbfbfb33" />
            {impotRangeToReferenceArea(props.impotRanges, props.ca, referenceY)}
            {dataKeys.filter(d => d.enabled).map((dataKey) =>
              <Area type="monotone" dataKey={dataKey.dataKey} stackId="1" stroke={dataKey.color} fill={dataKey.color} isAnimationActive={false} />
            )}
            {/* <Line type="monotone" dataKey="(Après investissement) Total" stroke="green" dot={false} isAnimationActive={false} /> */}
            <ReferenceLine x={yearMax.yearMax.remuneration} stroke="red" strokeDasharray="3 3">
              <Label position="center" offset={10} stroke="#ff888888" value={formatNumber(yearMax.year1.amount)} />
              <Label position="bottom" offset={10} stroke="#bbbbbb88" value={yearMax.yearMax.remuneration} />
            </ReferenceLine>
          </ComposedChart>
          <Legend data={dataKeys.slice().reverse()} onClick={onClickLegend} />
        </div>
      </div>
      {/* Investments */}
      <div>
        <label>Nombre d'année: {nbYearInput}</label><br/>
        <label>Reinvestissement des revenus: {reinvestInput}</label><br/>
        <h4>Simulation sur {nbYear} ans avec une rémunération de {props.config.revenus}</h4>
        {submitInput}
        {submit && <div className="chart-container">
          <ComposedChart
            width={900}
            height={700}
            data={investmentsSimulations}
            margin={{
              top: 10,
              right: 30,
              left: 30,
              bottom: 40,
            }}
          >
            <CartesianGrid strokeDasharray="1.5 1.5" />
            <XAxis type="number" dataKey="year" domain={['dataMin', 'dataMax']}>
              <Label value="Année" offset={-10} position="insideBottom" />
            </XAxis>
            <YAxis type="number" domain={[0, investmentChartMaxY]}>
              <Label value="Chiffre d'affaire" offset={-15} angle={-90} position="insideLeft" />
            </YAxis>
            <Tooltip content={<CustomTooltipInvest ca={props.ca} simulations={investmentsSimulations} dataKeys={dataInvestKeys} maxTotal={yearMax.year1.amount}/>} />
            <ReferenceArea x1={referenceIS15} x2={props.ca} y1={referenceY} y2={chartMaxY} stroke="red" strokeOpacity={0.3} label="IS 15%" fill="#fbfbfb11" />
            <ReferenceArea x1={0} x2={referenceIS15} y1={referenceY} y2={chartMaxY} stroke="red" strokeOpacity={0.3} label="IS 25%" fill="#fbfbfb33" />
            {impotRangeToReferenceArea(props.impotRanges, props.ca, referenceY)}
            {dataInvestKeys.filter(d => d.enabled).map((dataKey) =>
              <Area type="monotone" dataKey={dataKey.dataKey} stackId="1" stroke={dataKey.color} fill={dataKey.color} isAnimationActive={false} />
            )}
          </ComposedChart>
          <Legend data={dataInvestKeys.slice().reverse()} onClick={onClickInvestLegend} />
        </div>
        }
      </div>
    </div>
  )
}

export default StockTab;

