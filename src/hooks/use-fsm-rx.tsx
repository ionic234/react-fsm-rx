/*eslint-disable*/
import { BaseStateData, CanLeaveToStatesMap, CurrentStateInfo, DebugLogEntry, FSMInit, FSMInitStateData, FsmConfig, StateMap } from "fsm-rx";
import { MutableRefObject, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Subscription, takeUntil } from "rxjs";
import { FsmComponentConfig, ReactFsmRx } from "../classes/react-fsm-rx";
import transformDebugLogService from "../services/transform-debug-log";
import { FsmRxContext } from "./fsm-rx-context";

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
    const hasUnmountedRef: MutableRefObject<boolean> = useRef(false);
    const subscription: MutableRefObject<Subscription | undefined> = useRef(undefined);

    const [stateData, setStateData] = useState<TStateData | FSMInitStateData>({ state: "FSMInit" });

    const createFsm = useCallback(() => {
        fsmRef.current = new ReactFsmRx(stateMap, fsmConfig, isInDevMode);
    }, [fsmRef]);

    const subscribeToFsm = useCallback(() => {
        subscription.current = fsmRef.current.stateData$.pipe(takeUntil(fsmRef.current.destroy$)).subscribe((stateData: TStateData | FSMInitStateData) => {
            if (fsmRef.current.resolvedFsmConfig.outputStateDiagramDefinition && setStateDiagramDefinition) { setStateDiagramDefinition(fsmRef.current.getStateDiagramDefinition(stateData.state)); }
            if (fsmRef.current.resolvedFsmConfig.outputDebugLog && setDebugLog && debugLogKeys) { setDebugLog(transformDebugLogService.processDebugLog(fsmRef.current.debugLog, debugLogKeys)); }
            setStateData(stateData);
        });
    }, [fsmRef, subscription]);

    useEffect(() => {
        if (hasUnmountedRef.current) {
            createFsm();
            hasUnmountedRef.current = false;
        }

        if (!subscription.current) {
            fsmRef.current.currentState$.subscribe((currentStateInfo: CurrentStateInfo<TState, TStateData, TCanLeaveToStatesMap>) => {
                if (currentStateInfo.state === "FSMInit") { subscribeToFsm(); }
            });
        }

        return () => {
            fsmRef.current.destroy();
            subscription.current = undefined;
            hasUnmountedRef.current = true;
        };

    }, [fsmRef, subscription, hasUnmountedRef]);

    useEffect(() => {
        if (!props.fsmConfig) { return; }
        const [previousConfig, newConfig] = fsmRef.current.updateFsmConfig(props.fsmConfig);

        fsmRef.current.handlePossibleStateOverrideChange(previousConfig.stateOverride, newConfig.stateOverride);

        let forceLogUpdate = false;
        if (setDebugLog && debugLogKeys && previousConfig.debugLogBufferCount !== newConfig.debugLogBufferCount) {
            fsmRef.current.capDebugLogLength(newConfig.debugLogBufferCount);
            forceLogUpdate = newConfig.outputDebugLog;
        }

        if (setDebugLog && debugLogKeys && (forceLogUpdate || previousConfig.outputDebugLog !== newConfig.outputDebugLog)) {
            setDebugLog(newConfig.outputDebugLog ? transformDebugLogService.processDebugLog(fsmRef.current.debugLog, debugLogKeys) : undefined);
        }

        let forceStateDiagram = false;
        if (setStateDiagramDefinition && newConfig.outputStateDiagramDefinition && previousConfig.stateDiagramDirection !== newConfig.stateDiagramDirection) {
            fsmRef.current.clearStateDiagramDefinition();
            forceStateDiagram = newConfig.outputDebugLog;
        }

        if (setStateDiagramDefinition && (forceStateDiagram || previousConfig.outputStateDiagramDefinition !== newConfig.outputStateDiagramDefinition)) {
            if (!newConfig.outputStateDiagramDefinition) {
                fsmRef.current.clearStateDiagramDefinition();
                setStateDiagramDefinition(undefined);
            } else {
                fsmRef.current.currentState$.subscribe((currentStateInfo: CurrentStateInfo<TState, TStateData, TCanLeaveToStatesMap>) => {
                    setStateDiagramDefinition(fsmRef.current.getStateDiagramDefinition(currentStateInfo.state as TState | FSMInit));
                });
            }
        }

    }, [props.fsmConfig, fsmRef]);

    return [stateData, fsmRef];
}
