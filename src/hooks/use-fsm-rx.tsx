/*eslint-disable*/
import { BaseFsmConfig, BaseStateData, CanLeaveToStatesMap, CurrentStateInfo, DebugLogEntry, FSMInitStateData, FsmConfig, StateMap } from "fsm-rx";
import { useCallback, useContext, useEffect, useRef, useState, MutableRefObject } from 'react';
import { ReactFsmRx } from "../classes/react-fsm-rx";
import { takeUntil, Subscription } from "rxjs";
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

    // Variables describing the state of the fsm. 
    const fsmRef: MutableRefObject<ReactFsmRx<TState, TStateData, TCanLeaveToStatesMap>> = useRef(new ReactFsmRx(stateMap, fsmConfig, isInDevMode));
    const hasCleanedRef: MutableRefObject<boolean> = useRef(false);
    const subscription: MutableRefObject<Subscription | undefined> = useRef(undefined);


    const [stateData, setStateData] = useState<TStateData | FSMInitStateData>({ state: "FSMInit" });

    const createFsm = useCallback(() => {
        fsmRef.current = new ReactFsmRx(stateMap, fsmConfig, isInDevMode);
    }, [fsmRef]);

    const subscribeToFsm = useCallback(() => {
        subscription.current = fsmRef.current.stateData$.pipe(takeUntil(fsmRef.current.destroy$)).subscribe((stateData: TStateData | FSMInitStateData) => {
            if (setStateDiagramDefinition) { setStateDiagramDefinition(fsmRef.current.getStateDiagramDefinition(stateData.state)); }
            if (setDebugLog && debugLogKeys) { setDebugLog(transformDebugLogService.processDebugLog(fsmRef.current.debugLog, debugLogKeys)); }
            setStateData(stateData);
        });
    }, [fsmRef]);


    useEffect(() => {
        if (hasCleanedRef.current) {
            createFsm();
            hasCleanedRef.current = false;
        }

        if (!subscription.current) {
            fsmRef.current.currentState$.subscribe((currentStateInfo: CurrentStateInfo<TState, TStateData, TCanLeaveToStatesMap>) => {
                if (currentStateInfo.state === "FSMInit") {
                    subscribeToFsm();
                }
            });
        }

        return () => {
            fsmRef.current.destroy();
            subscription.current = undefined;
            hasCleanedRef.current = true;
        };

    }, [fsmRef, subscription, hasCleanedRef]);

    useEffect(() => {
        if (!props.fsmConfig) { return; }
    }, [props.fsmConfig]);



    return [stateData, fsmRef];

}

/*
{

    const { setStateDiagramDefinition, setDebugLog, debugLogKeys } = useContext(FsmRxContext);
    const fsmRef = useRef(new ReactFsmRx(stateMap, fsmConfig, isInDevMode));

    const hasCleanedRef = useRef(false);
    const [stateData, setStateData] = useState<TStateData | FSMInitStateData>({ state: "FSMInit" });

    const createFsm = useCallback(() => {
        fsmRef.current = new ReactFsmRx(stateMap, fsmConfig, isInDevMode);
    }, [fsmRef]);

    useEffect(() => {
        if (hasCleanedRef.current) {
            createFsm();
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
            fsmRef.current.destroy();
            hasCleanedRef.current = true;
        };

    }, [fsmRef]);

    useEffect(() => {
        if (!props.fsmConfig) { return; }
    }, [props.fsmConfig]);



    return [stateData, fsmRef];

}
*/