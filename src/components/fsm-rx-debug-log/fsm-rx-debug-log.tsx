import "./fsm-rx-debug-log.scss";
import { SimpleDebugEntry } from "../../services/transform-debug-log";

export type FsmRxDebugLogProps = {
    debugLog: SimpleDebugEntry[];
};

export function FsmRxDebugLog(props: FsmRxDebugLogProps) {

    return (
        <div className="fsm-rx-debug-log">
            <table>
                <thead>
                    <tr>
                        <th className="time">
                            <p>Time</p>
                        </th>
                        <th className="type">
                            <p>Transition Type</p>
                        </th>
                        <th className="data">
                            <p>Transition Data</p>
                        </th>
                        <th className="message">
                            <p>Message</p>
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {props.debugLog.map((entry, index) => (
                        <tr key={index} className={entry.result}>
                            <td className="time">
                                <p>{entry.time}</p>
                            </td>
                            <td className="type">
                                <p>{entry.type}</p>
                            </td>
                            <td className="data">
                                <p>{entry.data}</p>
                            </td>
                            <td className="message">
                                <p>{entry.message}</p>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table >
        </div >
    );
}