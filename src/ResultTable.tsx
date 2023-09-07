import "./ResultTable.css"

const ResultTable = (props: {
  expressions: { label: string, value: string }[]
}) => {
  return (
    <div>
      <table>
        <tr>
          <th align="left">Label</th>
          <th align="right">EURL</th>
          <th align="right">SASU</th>
        </tr>
        {props.expressions.map(({label, value}) => {
          return (
            <tr key={label}>
              <td align="left">{label}</td>
              <td align="right">{value}</td>
              <td align="right">{value}</td>
            </tr>
          )
        })}
      </table>
    </div>
  );
}

export default ResultTable;
