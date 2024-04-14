import { BaseStateData, DebugLogEntry, TransitionResult, TransitionTypes } from "fsm-rx";
import "./fsm-rx-debug-log.scss";
import { useEffect, useState } from "react";

/**
 * The type of the debug entry. 
 * Each string in the union represents a style class to apply to the table row.  
 */
export type DebugEntryResult = "success" | "error" | "warning" | "filtered" | 'override' | 'reset';

/**
 * A simplified representation of a data entry in an FsmRxComponents debugLog.
 * Used to populate a table row. 
 */
export type SimpleDebugEntry = {
    time: string,
    type: TransitionTypes,
    data: string,
    message: string,
    result: DebugEntryResult;
};


export type FsmRxDebugLogProps<TState extends string, TStateData extends BaseStateData<TState>> = {
    debugLog: DebugLogEntry<TState, TStateData>[];
    debugLogKeys: string[];
};

export function FsmRxDebugLog<TState extends string, TStateData extends BaseStateData<TState>>(props: FsmRxDebugLogProps<TState, TStateData>) {

    const [simpleDebugLog, setSimpleDebugLog] = useState<SimpleDebugEntry[]>([]);

    useEffect(() => {
        /**
         * Processes the debugLog of the target FsmRxComponent into the SimpleDebugEntry format for rendering in a FsmRxDebugLogComponent.
         * @param debugLog The debugLog of the target FsmRxComponent.
         * @returns An array containing the simpleDebugEntries for rendering in a FsmRxDebugLogComponent
         */
        function processDebugLog(debugLog: DebugLogEntry<string, BaseStateData<string>>[], debugLogKeys: string[]): SimpleDebugEntry[] {
            return debugLog.reduce((rData: SimpleDebugEntry[], entry: DebugLogEntry<string, BaseStateData<string>>) => {
                rData.push({
                    time: formatTimestamp(entry.timeStamp),
                    type: entry.transitionType,
                    data: typeof (entry.stateData) === "string" ? entry.stateData : formatEntryStateData(entry.stateData, debugLogKeys),
                    message: entry.message,
                    result: getDebugEntryResult(entry.result)
                });
                return rData;
            }, []).reverse();
        }

        setSimpleDebugLog(processDebugLog(props.debugLog, props.debugLogKeys));
    }, [props]);

    /**
     * Formats the supplied timestamp as HH:MM:SS:MMM AM/PM 
     * @param timeStamp The timestamp to format.
     * @returns A string representation off the timestamp in HH:MM:SS:MMM AM/PM format. 
     */
    function formatTimestamp(timeStamp: number): string {
        const date = new Date(timeStamp);
        const formatter: Intl.DateTimeFormat = new Intl.DateTimeFormat('en-AU', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            fractionalSecondDigits: 3,
        });
        return formatter.format(date);
    }

    /**
   * Transforms the stateData into a string containing only the items specified in debugLogKeys. 
   * @param stateData The data to be processed.
   * @param debugLogKeys An array of keys to include in the returned string. 
   * @returns A string representation of the StateData containing only the keys specified in debugLogKeys. 
   */
    function formatEntryStateData(
        stateData: Record<string, unknown>,
        debugLogKeys: string[]): string {

        const pulledData = debugLogKeys.reduce((rData: Record<string, unknown>, key: string) => {
            if (key in stateData) {
                rData[key] = stateData[key];
            }
            return rData;
        }, {});
        return JSON.stringify(pulledData, null, 1);
    }

    /**
     * Transforms the supplied TransitionResult into the simplified DebugEntryResult.
     * @param transitionResult The transitionResult of a DebugLogEntry
     * @returns A DebugEntryResult
     */
    function getDebugEntryResult(transitionResult: TransitionResult): DebugEntryResult {
        switch (transitionResult) {
            case "success":
                return "success";
            case "override":
                return "override";
            case "reset":
                return 'reset';
            case "internal_error":
                return 'error';
            case "unknown_error":
                return "error";
            default:
                return 'warning';
        }
    }

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
                    {simpleDebugLog.map((entry, index) => (
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