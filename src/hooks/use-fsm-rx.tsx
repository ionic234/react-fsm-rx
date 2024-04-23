/*eslint-disable*/

import { BaseStateData, CanLeaveToStatesMap, CurrentStateInfo, DebugLogEntry, FSMInit, FSMInitStateData, StateMap } from "fsm-rx";
import { MutableRefObject, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Subject, Subscription, takeUntil, timer } from "rxjs";
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
>(
    stateMap: StateMap<TState, TStateData, TCanLeaveToStatesMap>,
    props: FsmRxProps<TState, TStateData, TCanLeaveToStatesMap>,
    fsmConfig: Partial<FsmComponentConfig<TState, TStateData, TCanLeaveToStatesMap>> = {},
    isInDevMode?: boolean
): [FSMInitStateData | TStateData, MutableRefObject<ReactFsmRx<TState, TStateData, TCanLeaveToStatesMap>>] {

    const [stateData, setStateData] = useState<TStateData | FSMInitStateData>({ state: "FSMInit" });
    const { setStateDiagramDefinition, setDebugLog, debugLogKeys } = useContext(FsmRxContext);
    const fsmRef: MutableRefObject<null | ReactFsmRx<TState, TStateData, TCanLeaveToStatesMap>> = useRef(null);
    const subscription: MutableRefObject<Subscription | undefined> = useRef(undefined);
    const isRemounted: MutableRefObject<Subject<void>> = useRef(new Subject<void>());

    function getFsmInstance(): MutableRefObject<ReactFsmRx<TState, TStateData, TCanLeaveToStatesMap>> {
        if (fsmRef.current === null) {
            const reactFsmRx = new ReactFsmRx(stateMap, { ...fsmConfig, ...(props.fsmConfig || {}) }, isInDevMode);
            fsmRef.current = reactFsmRx;
        }
        return fsmRef as MutableRefObject<ReactFsmRx<TState, TStateData, TCanLeaveToStatesMap>>;
    }

    const subscribeToFsm = useCallback(() => {
        if (subscription.current === undefined) {
            const fsmRef = getFsmInstance();
            subscription.current = fsmRef.current.stateData$.pipe(takeUntil(fsmRef.current.destroy$)).subscribe((stateData: TStateData | FSMInitStateData) => {
                if (fsmRef.current === null) { return; }
                if (fsmRef.current.resolvedFsmConfig.outputStateDiagramDefinition && setStateDiagramDefinition) { setStateDiagramDefinition(fsmRef.current.getStateDiagramDefinition(stateData.state)); }
                if (fsmRef.current.resolvedFsmConfig.outputDebugLog && setDebugLog && debugLogKeys) { setDebugLog(transformDebugLogService.processDebugLog(fsmRef.current.debugLog, debugLogKeys)); }
                setStateData(stateData);
            });
        }
    }, [subscription]);

    useEffect(() => {
        subscribeToFsm();
    }, [subscription]);

    useEffect(() => {
        if (!props.fsmConfig) { return; }

        const fsmRef = getFsmInstance();

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

    useEffect(() => {
        isRemounted.current.next();
        return (() => {
            if (getFsmInstance().current.isInDevMode) {
                // Handle hot module replacement 
                timer(0).pipe(takeUntil(isRemounted.current), takeUntil(getFsmInstance().current.destroy$)).subscribe(() => {
                    subscription.current = undefined;
                    getFsmInstance().current.destroy();
                    fsmRef.current === null;
                });
            } else {
                subscription.current = undefined;
                getFsmInstance().current.destroy();
                fsmRef.current === null;
            }
        });
    }, [isRemounted]);

    return [stateData, getFsmInstance()];
}





/*
import { BaseStateData, CanLeaveToStatesMap, CurrentStateInfo, DebugLogEntry, FSMInit, FSMInitStateData, FsmConfig, StateMap } from "fsm-rx";
import { MutableRefObject, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Subscription, takeUntil } from "rxjs";
import { FsmComponentConfig, ReactFsmRx } from "../classes/react-fsm-rx";
import transformDebugLogService from "../services/transform-debug-log";
import { FsmRxContext } from "./fsm-rx-context";
import fsmRepository from '../services/fsm-repository';

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
>(
    stateMap: StateMap<TState, TStateData, TCanLeaveToStatesMap>,
    props: FsmRxProps<TState, TStateData, TCanLeaveToStatesMap>,
    fsmConfig: Partial<FsmComponentConfig<TState, TStateData, TCanLeaveToStatesMap>> = {},
    isInDevMode?: boolean
): [FSMInitStateData | TStateData, React.MutableRefObject<ReactFsmRx<TState, TStateData, TCanLeaveToStatesMap>>] {

    const { setStateDiagramDefinition, setDebugLog, debugLogKeys } = useContext(FsmRxContext);
    const fsmRef: MutableRefObject<ReactFsmRx<TState, TStateData, TCanLeaveToStatesMap>> = useRef(createReactFsmRx(stateMap, { ...fsmConfig, ...(props.fsmConfig || {}) }, isInDevMode));

    const hasUnmountedRef: MutableRefObject<boolean> = useRef(false);
    const subscription: MutableRefObject<Subscription | undefined> = useRef(undefined);

    const [stateData, setStateData] = useState<TStateData | FSMInitStateData>({ state: "FSMInit" });

    const createFsm = useCallback(() => {
        console.log("crete FSM callback");

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
            // may need to remove from registry if not enough auto unload time. 
            console.log('why is this not');


            const fsmName = fsmRef.current.resolvedFsmConfig.name;
            if (fsmName !== "") { fsmRepository.removeFsmData(fsmName); }
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


    function createReactFsmRx(
        stateMap: StateMap<TState, TStateData, TCanLeaveToStatesMap>,
        fsmConfig: Partial<FsmComponentConfig<TState, TStateData, TCanLeaveToStatesMap>> = {},
        isInDevMode?: boolean
    ): ReactFsmRx<TState, TStateData, TCanLeaveToStatesMap> {


        const reactFsmRx = new ReactFsmRx(stateMap, { ...fsmConfig, ...(props.fsmConfig || {}) }, isInDevMode);
        if (reactFsmRx.resolvedFsmConfig.name !== "") {
            fsmRepository.addFsmData(reactFsmRx.resolvedFsmConfig.name, reactFsmRx.stateData$, reactFsmRx.destroy$);
        }
        return reactFsmRx;
    }
    return [stateData, fsmRef];
}
*/