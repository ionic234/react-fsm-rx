/*eslint-disable*/

import { BaseStateData, DebugLogEntry } from "fsm-rx";
import { ReactNode, cloneElement, useState, useEffect } from "react";
import { FsmRxDebugLog } from "../fsm-rx-debug-log/fsm-rx-debug-log";
import { FsmRxStateDiagram } from "../fsm-rx-state-diagram/fsm-rx-state-diagram";
import "./fsm-rx-debug-set.component.scss";

type IsReactElement<T> = T extends React.ReactElement ? T : never;

interface FsmRxDebugSetProps {
    children: IsReactElement<ReactNode>;
    debugLogKeys?: string[];
}

export function FsmRxDebugSet<TState extends string, TStateData extends BaseStateData<TState>>(props: FsmRxDebugSetProps) {

    const [debugLogKeys, setDebugLogKeys] = useState<string[]>(['state']);
    const [stateDiagramDefinition, setStateDiagramDefinition] = useState<string | undefined>(undefined);
    const [debugLog, setDebugLog] = useState<DebugLogEntry<TState, TStateData>[] | undefined>(undefined);
    const propsInjectedChild = cloneElement(props.children, { setStateDiagramDefinition, setDebugLog });

    useEffect(() => {
        setDebugLogKeys(props.debugLogKeys ?? ['state']);
    }, [props.debugLogKeys]);

    return (
        <>
            <div className="hero-content">
                {propsInjectedChild}
                {stateDiagramDefinition && <FsmRxStateDiagram stateDiagramDefinition={stateDiagramDefinition} />}
            </div>
            {debugLog && <FsmRxDebugLog debugLog={debugLog} debugLogKeys={debugLogKeys} />}
        </>
    );

}