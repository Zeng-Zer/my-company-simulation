import { simulateEURL } from "../simulator/eurl/simulator-eurl";
import { simulateIS } from "../simulator/is/simulator-is";
import { SimulationConfig } from "../simulator/simulator"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';


function createRangeWithInterval(start: number, end: number, interval: number) {
  return Array.from({ length: (end - start) / interval + 1 }, (_, i) => start + i * interval);
}

interface ChartProps {
  config: SimulationConfig
  ca: number
}

function Chart(props: ChartProps) {
      // <ResultTable expressions={simulateEURL(config)}/>
      // <h3>Reste sur Société</h3>
      // <ResultTable expressions={simulateIS({ ...config, ca })}/>

  const revenus = createRangeWithInterval(0, props.ca, props.ca / 10);
  const simulations = revenus.map(revenu => {
    const config: SimulationConfig = {
      ...props.config,
      revenus: revenu,
    };


    const eurlSimulations = simulateEURL(config)
      // .filter(({ label }) => label === 'Cotisations et contributions' || label === 'Impôt sur le revenu')
      .filter(({ label }) => label !== 'Rémunération totale')
      .map(({ label, value }) => ({ label, value: value.nodeValue }));
    const isSimulations = simulateIS({ ...config, ca: props.ca })
      // .filter(({ label }) => label === 'Montant de l\'impôt')
      .map(({ label, value }) => ({ label, value: value.nodeValue }));

    return [ ...eurlSimulations, ...isSimulations ].reduce(function(map, obj) {
      map[obj.label as string] = obj.value as number;
      return map;
    }, {
        revenu,
        'Rémunération net après IS': props.ca - revenu - (isSimulations.find(({ label }) => label === 'Impôt sur les sociétés')?.value as number),
      });
  });

  simulations.forEach(simulation => {
    console.log(simulation);
  });

// export type ExpressionEURLLabel = 'Rémunération totale' |
// 'Cotisations et contributions' |
// 'Rémunération nette avant impôt' |
// 'Impôt sur le revenu' |
// 'Rémunération nette après impôt'
  return (
    <>
      <h4>Ratio IS/IR pour un CA de {props.ca}</h4>
      {revenus.join(', ')}
        <AreaChart
          width={1000}
          height={800}
          data={simulations}
          margin={{
            top: 10,
            right: 30,
            left: 0,
            bottom: 0,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="revenu" />
          <YAxis />
          <Tooltip />
          <Area type="monotone" dataKey="Rémunération nette après impôt" stackId="1" stroke="#8884d8" fill="#8884d8" />
          <Area type="monotone" dataKey="Rémunération net après IS" stackId="1" stroke="#82ca9d" fill="#82ca9d" />
          <Area type="monotone" dataKey="Impôt sur le revenu" stackId="1" stroke="#8884d8" fill="#8884d8" />
          <Area type="monotone" dataKey="Cotisations et contributions" stackId="1" stroke="#8884d8" fill="#8884d8" />
          <Area type="monotone" dataKey="Impôt sur les sociétés" stackId="1" stroke="#82ca9d" fill="#82ca9d" />
      </AreaChart>
    </>
  )
}

export default Chart
          // <Area type="monotone" dataKey="Impôt sur les sociétés" stackId="1" stroke="#8884d8" fill="#8884d8" />
          // <Area type="monotone" dataKey="Impôt sur le revenu" stackId="1" stroke="#82ca9d" fill="#82ca9d" />
          // <Area type="monotone" dataKey="Cotisations et contributions" stackId="1" stroke="#82ca9d" fill="#82ca9d" />
