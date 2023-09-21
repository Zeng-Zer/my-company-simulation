import "./ResultTable.css"
import { Expression } from "../simulator/simulator";
import { formatNumber } from "../utils/number-utils";

interface ResultTableProps {
    expressions: Expression[];
}


function ResultTable(props: ResultTableProps) {
    return (
        <div>
            <table>
                <tbody>
                    <tr>
                        <th align="left">Label</th>
                        <th align="right">EURL</th>
                    </tr>
                    {props.expressions.map(({ label, value, unit }) => {
                        return (
                            <tr key={label}>
                                <td align="left">{label}</td>
                                <td align="right">{`${formatNumber(value)} ${unit}` }</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

export default ResultTable;
