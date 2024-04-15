
import { ReactNode, useEffect, useState } from "react";
import { FsmRxContext } from "../../hooks/fsm-rx-context";
import { SimpleDebugEntry } from "../../services/transform-debug-log";
import { FsmRxDebugLog } from "../fsm-rx-debug-log/fsm-rx-debug-log";
import { FsmRxStateDiagram } from "../fsm-rx-state-diagram/fsm-rx-state-diagram";
import "./fsm-rx-debug-set.component.scss";

type IsReactElement<T> = T extends React.ReactElement ? T : never;

interface FsmRxDebugSetProps {
    children: IsReactElement<ReactNode>;
    debugLogKeys?: string[];
}

export function FsmRxDebugSet(props: FsmRxDebugSetProps) {

    const [debugLogKeys, setDebugLogKeys] = useState<string[]>(['state']);
    const [stateDiagramDefinition, setStateDiagramDefinition] = useState<string | undefined>(undefined);
    const [debugLog, setDebugLog] = useState<SimpleDebugEntry[] | undefined>(undefined);

    useEffect(() => {
        setDebugLogKeys(props.debugLogKeys ?? ['state']);
    }, [props.debugLogKeys]);

    return (
        <>
            <div className="hero-content">
                <FsmRxContext.Provider value={{ setStateDiagramDefinition, setDebugLog, debugLogKeys }}>
                    {props.children}
                </FsmRxContext.Provider>
                {stateDiagramDefinition && <FsmRxStateDiagram stateDiagramDefinition={stateDiagramDefinition} />}
            </div>
            {debugLog && <FsmRxDebugLog debugLog={debugLog} />}
        </>
    );
}
