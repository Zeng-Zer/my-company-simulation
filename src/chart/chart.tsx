import { simulateEURL } from "../simulator/eurl/simulator-eurl";
import { simulateIS } from "../simulator/is/simulator-is";
import { SimulationConfig } from "../simulator/simulator"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';


interface ChartProps {
  ca: number;
  simulations: any[];
}

function Chart(props: ChartProps) {
  return (
    <>
      <h4>Ratio IS/IR pour un CA de {props.ca}</h4>
        <AreaChart
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
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="revenu" />
          <YAxis />
          <Tooltip />
          <Area type="monotone" dataKey="Impôt sur le revenu" stackId="1" stroke="#8884d8" fill="#8884d8" />
          <Area type="monotone" dataKey="Cotisations et contributions" stackId="1" stroke="#8884d8" fill="#8884d8" />
          <Area type="monotone" dataKey="Impôt sur les sociétés" stackId="1" stroke="#FFA500" fill="#FFA500" />
          <Area type="monotone" dataKey="Rémunération nette après impôt" stackId="1" stroke="#87CEEB" fill="#87CEEB" />
          <Area type="monotone" dataKey="Rémunération net après IS" stackId="1" stroke="#82ca9d" fill="#82ca9d" />
      </AreaChart>
    </>
  )
}

export default Chart
          // <Area type="monotone" dataKey="Impôt sur les sociétés" stackId="1" stroke="#8884d8" fill="#8884d8" />
          // <Area type="monotone" dataKey="Impôt sur le revenu" stackId="1" stroke="#82ca9d" fill="#82ca9d" />
          // <Area type="monotone" dataKey="Cotisations et contributions" stackId="1" stroke="#82ca9d" fill="#82ca9d" />
