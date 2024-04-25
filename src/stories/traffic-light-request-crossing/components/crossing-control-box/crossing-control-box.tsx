import { BaseStateData, ChangeStateData, CurrentStateInfo, StateData, OnEnterStateChanges } from "fsm-rx";
import { useCallback, useEffect } from "react";
import useFsmRx, { FsmRxProps } from "../../../../hooks/use-fsm-rx";
import { TrafficLightRequestCrossingData, TrafficLightRequestCrossingStates } from "../traffic-light-request-crossing/traffic-light-request-crossing";
import './crossing-control-box.scss';
import { interval, switchMap, takeUntil } from "rxjs";

/*eslint-disable*/
export type CrossingControlBoxStates = "doNotWalk" | "startWalking" | "finishWalking";

interface BaseCrossingControlBoxData extends BaseStateData<CrossingControlBoxStates> {
    isWalkLightOn: boolean,
    isWalkRequestIndicatorOn: boolean;
}

interface DoNotWalkCrossingControlBoxData extends BaseCrossingControlBoxData {
    state: "doNotWalk",
    isWalkLightOn: false;
    isWalkRequestIndicatorOn: boolean;
}

interface StartWalkingCrossingControlBoxData extends BaseCrossingControlBoxData {
    state: "startWalking",
    isWalkLightOn: true,
    isWalkRequestIndicatorOn: true;
}

interface FinishWalkingCrossingControlBoxData extends BaseCrossingControlBoxData {
    state: "finishWalking",
    flashInterval: 350;
    isWalkLightOn: boolean,
    isWalkRequestIndicatorOn: boolean;
}

export type CrossingControlBoxData = DoNotWalkCrossingControlBoxData | StartWalkingCrossingControlBoxData | FinishWalkingCrossingControlBoxData;

type CrossingControlBoxCanLeaveToMap = {
    FSMInit: "doNotWalk",
    doNotWalk: "startWalking",
    startWalking: "finishWalking",
    finishWalking: "doNotWalk";
};

export interface CrossingControlBoxProps extends FsmRxProps<CrossingControlBoxStates, CrossingControlBoxData, CrossingControlBoxCanLeaveToMap> {
    fsmToBindTo: string;
}

export function CrossingControlBox(props: CrossingControlBoxProps): JSX.Element {
    const [stateData, fsmRef] = useFsmRx<CrossingControlBoxStates, CrossingControlBoxData, CrossingControlBoxCanLeaveToMap>(
        {
            doNotWalk: {
                canEnterFromStates: { FSMInit: true, finishWalking: true },
                canLeaveToStates: { startWalking: true },
            },
            startWalking: {
                canEnterFromStates: { doNotWalk: true },
                canLeaveToStates: { finishWalking: true }
            },
            finishWalking: {
                canEnterFromStates: { startWalking: true },
                canLeaveToStates: { doNotWalk: true },
                onEnter: handleEnterFinishWalking

            }
        },
        props
    );

    useEffect(() => {
        fsmRef.current.currentState$.subscribe((currentStateInfo: CurrentStateInfo<CrossingControlBoxStates, CrossingControlBoxData, CrossingControlBoxCanLeaveToMap>) => {
            if (currentStateInfo.state === "FSMInit") {
                if (props.fsmToBindTo !== "") { bindToExternalFsm(props.fsmToBindTo); }
                fsmRef.current.changeState({ state: "doNotWalk", isWalkLightOn: false, isWalkRequestIndicatorOn: false });
            }
        });
    }, [fsmRef, props.fsmToBindTo]);


    const bindToExternalFsm = useCallback((fsmToBindTo: string): void => {
        fsmRef.current.getFsmStateData$<TrafficLightRequestCrossingStates, TrafficLightRequestCrossingData>(fsmToBindTo)
            .subscribe(([currentStateInfo, externalStateData]: [CurrentStateInfo<CrossingControlBoxStates, CrossingControlBoxData, CrossingControlBoxCanLeaveToMap>, StateData<TrafficLightRequestCrossingStates, TrafficLightRequestCrossingData> | undefined]) => {

                if (currentStateInfo.state === "FSMInit" ||
                    !externalStateData ||
                    externalStateData.state === "FSMInit" ||
                    externalStateData.state === "go" ||
                    externalStateData.state === "prepareToStop"
                ) { return; }

                const { stateData, state, canLeaveTo } = currentStateInfo;

                let nextStateData: ChangeStateData<
                    CrossingControlBoxStates,
                    typeof state,
                    CrossingControlBoxData,
                    CrossingControlBoxCanLeaveToMap
                >;

                switch (externalStateData.state) {
                    case "stop_startWalking":
                        nextStateData = {
                            state: "startWalking",
                            isWalkLightOn: true,
                            isWalkRequestIndicatorOn: true
                        };
                        break;
                    case "stop_finishWalking":
                        nextStateData = {
                            state: "finishWalking",
                            isWalkLightOn: true,
                            isWalkRequestIndicatorOn: false,
                            flashInterval: 350
                        };
                        break;
                    case "stop":
                        nextStateData = {
                            state: "doNotWalk",
                            isWalkLightOn: false,
                            isWalkRequestIndicatorOn: stateData.isWalkRequestIndicatorOn
                        };
                        break;
                    default:
                        fsmRef.current.assertCannotReach(externalStateData.state);
                        return;
                }

                if (!canLeaveTo.some((needleState: CrossingControlBoxStates) => { return needleState === nextStateData.state; })) { return; };

                fsmRef.current.changeState(nextStateData);

            });
    }, [fsmRef]);

    function handleWalkButtonClicked() {
        fsmRef.current.currentState$.subscribe((currentStateInfo: CurrentStateInfo<CrossingControlBoxStates, CrossingControlBoxData, CrossingControlBoxCanLeaveToMap>) => {
            const { stateData, state } = currentStateInfo;

            if (state !== "doNotWalk" && state !== "finishWalking") { return; }
            if (stateData.isWalkRequestIndicatorOn) { return; }

            fsmRef.current.updateState({
                ...stateData,
                isWalkRequestIndicatorOn: true
            });
        });
    }

    function handleEnterFinishWalking(onEnterStateChanges: OnEnterStateChanges<CrossingControlBoxStates, "finishWalking", CrossingControlBoxData, CrossingControlBoxCanLeaveToMap>): void {

        const { enteringStateInfo } = onEnterStateChanges;
        const { stateData } = enteringStateInfo;
        const { flashInterval } = stateData;

        interval(flashInterval).pipe(
            takeUntil(fsmRef.current.nextChangeStateTransition$),
            takeUntil(fsmRef.current.destroy$),
            switchMap(() => { return fsmRef.current.currentState$; }),
        ).subscribe((currentStateInfo: CurrentStateInfo<CrossingControlBoxStates, CrossingControlBoxData, CrossingControlBoxCanLeaveToMap>) => {

            const { state: currentState, stateData: currentStateData } = currentStateInfo;

            if (currentState === "finishWalking") {
                const { isWalkLightOn } = currentStateData;
                fsmRef.current.updateState({
                    ...currentStateData,
                    isWalkLightOn: !isWalkLightOn
                });
            }
        });
    }

    return (
        <div className="crossing-control-box">
            {stateData.state !== "FSMInit" && (
                <div className="content">
                    <span className={`walk-display ${stateData.isWalkLightOn ? 'on' : ''}`}>
                        <p>Walk</p>
                    </span>
                    <div className="interface">
                        <span className={`walk-requested-indicator ${stateData.isWalkRequestIndicatorOn ? 'on' : ''}`}></span>
                        <button className="walk-button" onClick={handleWalkButtonClicked}></button>
                    </div>
                </div>
            )}
        </div>
    );
};