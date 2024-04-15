import { BaseFsmConfig, BaseStateData, CanLeaveToStatesMap, CurrentStateInfo, DebugLogEntry, FSMInitStateData, FsmConfig, StateMap } from "fsm-rx";
import { useContext, useEffect, useRef, useState } from 'react';
import { ReactFsmRx } from "../classes/react-fsm-rx";
import { takeUntil } from "rxjs";
import { FsmRxContext } from "./fsm-rx-context";
import transformDebugLogService from "../services/transform-debug-log";

type BaseConfig = {
    outputStateDiagramDefinition: boolean,
    outputDebugLog: boolean;
};

export type BaseFsmComponentConfig = BaseFsmConfig & BaseConfig;

export type FsmComponentConfig<
    TState extends string,
    TStateData extends BaseStateData<TState>,
    TCanLeaveToStatesMap extends CanLeaveToStatesMap<TState>
> = FsmConfig<TState, TStateData, TCanLeaveToStatesMap> & BaseConfig;


export type FsmRxProps<
    TState extends string,
    TStateData extends
    BaseStateData<TState>, TCanLeaveToStatesMap extends CanLeaveToStatesMap<TState>
> = {
    fsmConfig?: Partial<FsmComponentConfig<TState, TStateData, TCanLeaveToStatesMap>>;
    setStateDiagramDefinition?: React.Dispatch<React.SetStateAction<string | undefined>>;
    setDebugLog?: React.Dispatch<React.SetStateAction<DebugLogEntry<TState, TStateData>[] | undefined>>;
};

export default function useFsmRx<
    TState extends string,
    TStateData extends BaseStateData<TState>,
    TCanLeaveToStatesMap extends CanLeaveToStatesMap<TState>
>(stateMap: StateMap<TState, TStateData, TCanLeaveToStatesMap>,
    props: FsmRxProps<TState, TStateData, TCanLeaveToStatesMap>,
    fsmConfig?: Partial<FsmConfig<TState, TStateData, TCanLeaveToStatesMap>>,
    isInDevMode?: boolean): [FSMInitStateData | TStateData, React.MutableRefObject<ReactFsmRx<TState, TStateData, TCanLeaveToStatesMap>>] {

    const { setStateDiagramDefinition, setDebugLog, debugLogKeys } = useContext(FsmRxContext);
    const fsmRef = useRef(new ReactFsmRx(stateMap, fsmConfig, isInDevMode));
    const hasCleanedRef = useRef(false);
    const [stateData, setStateData] = useState<TStateData | FSMInitStateData>({ state: "FSMInit" });

    useEffect(() => {
        if (hasCleanedRef) {
            fsmRef.current = new ReactFsmRx(stateMap, fsmConfig, isInDevMode);
            hasCleanedRef.current = false;
        }

        fsmRef.current.currentState$.subscribe((currentStateInfo: CurrentStateInfo<TState, TStateData, TCanLeaveToStatesMap>) => {
            if (currentStateInfo.state === "FSMInit") {
                fsmRef.current.stateData$.pipe(takeUntil(fsmRef.current.destroy$)).subscribe((stateData: TStateData | FSMInitStateData) => {
                    if (setStateDiagramDefinition) { setStateDiagramDefinition(fsmRef.current.getStateDiagramDefinition(stateData.state)); }
                    if (setDebugLog && debugLogKeys) { setDebugLog(transformDebugLogService.processDebugLog(fsmRef.current.debugLog, debugLogKeys)); }
                    setStateData(stateData);
                });
            }
        });

        return () => {
            // Will call unsubscribe on currentFsmRef.stateData$;
            fsmRef.current.destroy();
            hasCleanedRef.current = true;
        };

    }, [fsmRef]);

    useEffect(() => {
        if (!props.fsmConfig) { return; }
        //console.log("the props yo!!!", props.fsmConfig);
    }, [props.fsmConfig]);



    return [stateData, fsmRef];

}