import { BaseStateData, CanLeaveToStatesMap, ChangeStateData, CurrentStateInfo, FSMInit, FsmRxConcrete, DebugLogEntry } from "fsm-rx";
import { Observable, Subject } from "rxjs";


export class ReactFsmRx<
    TState extends string,
    TStateData extends BaseStateData<TState>,
    TCanLeaveToStatesMap extends CanLeaveToStatesMap<TState>
> extends FsmRxConcrete<TState, TStateData, TCanLeaveToStatesMap> {

    public override changeState<TCurrentState extends (TState | FSMInit) = TState | FSMInit>(
        stateData: TCurrentState extends (TState | FSMInit) ? ChangeStateData<TState, TCurrentState, TStateData, TCanLeaveToStatesMap> : TStateData
    ): void {
        super.changeState(stateData);
    }

    public override get currentState$(): Observable<CurrentStateInfo<TState, TStateData, TCanLeaveToStatesMap>> {
        return super.currentState$;
    }

    public override getStateDiagramDefinition(highlightState?: TState | FSMInit | undefined): string {
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

}