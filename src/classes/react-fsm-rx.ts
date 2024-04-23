/*eslint-disable*/

import deepEqual from "deep-equal";
import { BaseStateData, CanLeaveToStatesMap, ChangeStateData, CurrentStateInfo, FSMInit, FsmRxConcrete, DebugLogEntry, FsmConfig, BaseFsmConfig, StateOverride, StateMap } from "fsm-rx";
import { Observable, Subject } from "rxjs";


type BaseConfig = {
    outputStateDiagramDefinition: boolean,
    outputDebugLog: boolean;
    name: string;
};

export type BaseFsmComponentConfig = BaseFsmConfig & BaseConfig;

export type FsmComponentConfig<
    TState extends string,
    TStateData extends BaseStateData<TState>,
    TCanLeaveToStatesMap extends CanLeaveToStatesMap<TState>
> = FsmConfig<TState, TStateData, TCanLeaveToStatesMap> & BaseConfig;


export class ReactFsmRx<
    TState extends string,
    TStateData extends BaseStateData<TState>,
    TCanLeaveToStatesMap extends CanLeaveToStatesMap<TState>
> extends FsmRxConcrete<TState, TStateData, TCanLeaveToStatesMap> {

    public constructor(stateMap: StateMap<TState, TStateData, TCanLeaveToStatesMap>, fsmConfig?: Partial<FsmConfig<TState, TStateData, TCanLeaveToStatesMap>>, isInDevMode?: boolean) {
        super(stateMap, fsmConfig, isInDevMode);
    };


    public override changeState<TCurrentState extends (TState | FSMInit) = TState | FSMInit>(
        stateData: TCurrentState extends (TState | FSMInit) ? ChangeStateData<TState, TCurrentState, TStateData, TCanLeaveToStatesMap> : TStateData
    ): void {
        super.changeState(stateData);
    }

    public override get currentState$(): Observable<CurrentStateInfo<TState, TStateData, TCanLeaveToStatesMap>> {
        return super.currentState$;
    }

    public override getStateDiagramDefinition(highlightState?: TState | FSMInit): string {
        return super.getStateDiagramDefinition(highlightState);
    }

    public override get debugLog(): DebugLogEntry<TState, TStateData>[] {
        return super.debugLog;
    }

    public override destroy$: Subject<void> = new Subject();

    /** A subject used to trigger the completion of observables when the FSM transitions to a new state.*/
    public nextChangeStateTransition$: Subject<void> = new Subject();

    /** A subject used to trigger the completion of observables when an override occurs.*/
    public override$: Subject<void> = new Subject();

    public override destroy(): void {
        super.destroy();
    }

    declare public resolvedFsmConfig: FsmComponentConfig<TState, TStateData, TCanLeaveToStatesMap>;


    public updateFsmConfig(fsmConfig: Partial<FsmComponentConfig<TState, TStateData, TCanLeaveToStatesMap>>): [FsmComponentConfig<TState, TStateData, TCanLeaveToStatesMap>, FsmComponentConfig<TState, TStateData, TCanLeaveToStatesMap>] {
        const previousConfig: FsmComponentConfig<TState, TStateData, TCanLeaveToStatesMap> = this.resolvedFsmConfig;
        this.resolvedFsmConfig = this.extractFsmConfig(
            {
                ...this.resolvedFsmConfig,
                ...fsmConfig
            }, this.isInDevMode
        );
        return [previousConfig, this.resolvedFsmConfig];
    }

    /**
     * An override of the function that constructs the FsmConfig object by combining the supplied fsmConfig partial with default values.  
     * This override adds additional options relevant for components. 
     * @param fsmConfig The partial configuration object supplied by the user.
     * @param isInDevMode A boolean which determines whether the application in running in debug mode or not.
     * @returns A whole FSMConfig object constructed by combining the supplied fsmConfig partial with default values.
     */
    protected override extractFsmConfig(
        fsmConfig: Partial<FsmComponentConfig<TState, TStateData, TCanLeaveToStatesMap>>,
        isInDevMode: boolean
    ): FsmComponentConfig<TState, TStateData, TCanLeaveToStatesMap> {
        return {
            ...super.extractFsmConfig(fsmConfig, isInDevMode),
            name: fsmConfig.name ?? "",
            outputStateDiagramDefinition: fsmConfig.outputStateDiagramDefinition ?? (isInDevMode ? true : false),
            outputDebugLog: fsmConfig.outputDebugLog ?? (isInDevMode ? true : false),
        };
    }

    /**
   * Determines if an override value has been given and executes the override if it has
   * @param previousStateOverride The previous value for stateOverride
   * @param newStateOverride The new value for stateOverride. 
   */
    public handlePossibleStateOverrideChange(
        previousStateOverride: StateOverride<TState, TStateData, TCanLeaveToStatesMap> | false,
        newStateOverride: StateOverride<TState, TStateData, TCanLeaveToStatesMap> | false
    ): void {
        if (!newStateOverride) { return; }
        if (!deepEqual(previousStateOverride, newStateOverride, { strict: true })) {
            this.override$.next();
            this.overrideCurrentState(newStateOverride, this.resolvedFsmConfig.resetDebugLogOnOverride);
        }
    }

    public override capDebugLogLength(maxLength: number): void {
        return super.capDebugLogLength(maxLength);
    }

    public override clearStateDiagramDefinition(): void {
        return super.clearStateDiagramDefinition();
    }

}
