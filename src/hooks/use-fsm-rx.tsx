import { BaseFsmConfig, BaseStateData, CanLeaveToStatesMap, CurrentStateInfo, DebugLogEntry, FSMInitStateData, FsmConfig, StateMap } from "fsm-rx";
import { useEffect, useRef, useState } from 'react';
import { ReactFsmRx } from "../classes/react-fsm-rx";
import { takeUntil } from "rxjs";

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
                    props.setStateDiagramDefinition?.(fsmRef.current.getStateDiagramDefinition(stateData.state));
                    props.setDebugLog?.(fsmRef.current.debugLog);
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
        console.log("the props yo!!!", props.fsmConfig);
    }, [props.fsmConfig]);



    return [stateData, fsmRef];

}