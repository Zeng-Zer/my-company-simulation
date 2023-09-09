import { EvaluatedNode, formatValue } from "publicodes";
import "./ResultTable.css"

const ResultTable = (props: {
  expressions: { label: string, value: EvaluatedNode }[]
}) => {
  return (
    <div>
      <table>
        <tbody>
          <tr>
            <th align="left">Label</th>
            <th align="right">EURL</th>
          </tr>
          {props.expressions.map(({label, value}) => {
            return (
              <tr key={label}>
                <td align="left">{label}</td>
                <td align="right">{formatValue(value)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  );
}

export default ResultTable;
