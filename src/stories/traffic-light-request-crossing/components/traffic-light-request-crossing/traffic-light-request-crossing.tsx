/*eslint-disable*/
import { BaseStateData, CurrentStateInfo, OnEnterStateChanges, StateData } from "fsm-rx";
import { useCallback, useEffect } from 'react';
import { switchMap, timer } from "rxjs";
import useFsmRx, { FsmRxProps } from "../../../../hooks/use-fsm-rx";
import { CrossingControlBoxData, CrossingControlBoxStates } from "../crossing-control-box/crossing-control-box";
import './traffic-light-request-crossing.scss';


export type TrafficLightRequestCrossingStates = "go" | "prepareToStop" | "stop" | "stop_startWalking" | "stop_finishWalking";

type TrafficLightRequestCrossingTimings = {
    go: 7000,
    prepareToStop: 3000,
    stop: 10000;
    stop_startWalking: 3000,
    stop_finishWalking: 2100;
};

export interface TrafficLightRequestCrossingData extends BaseStateData<TrafficLightRequestCrossingStates> {
    pedestrianCrossingRequested: boolean;
    trafficLightTimings: TrafficLightRequestCrossingTimings;
}

type TrafficLightRequestCrossingCanLeaveToMap = {
    FSMInit: "go",
    go: "prepareToStop",
    stop: "go",
    prepareToStop: "stop" | "stop_startWalking";
    stop_startWalking: "stop_finishWalking";
    stop_finishWalking: "stop";
};


export interface TrafficLightRequestCrossingProps extends FsmRxProps<TrafficLightRequestCrossingStates, TrafficLightRequestCrossingData, TrafficLightRequestCrossingCanLeaveToMap> {
    fsmToBindTo: string;
}

export function TrafficLightRequestCrossing(props: TrafficLightRequestCrossingProps) {

    const [stateData, fsmRef] = useFsmRx<TrafficLightRequestCrossingStates, TrafficLightRequestCrossingData, TrafficLightRequestCrossingCanLeaveToMap>(
        {
            go: {
                canEnterFromStates: { FSMInit: true, stop: true },
                canLeaveToStates: { prepareToStop: true },
                onEnter: handleEnterState
            },
            prepareToStop: {
                canEnterFromStates: { go: true, },
                canLeaveToStates: { stop: true, stop_startWalking: true },
                onEnter: handleEnterState
            },
            stop_startWalking: {
                canEnterFromStates: { prepareToStop: true },
                canLeaveToStates: { stop_finishWalking: true },
                onEnter: handleEnterState
            },
            stop_finishWalking: {
                canEnterFromStates: { stop_startWalking: true },
                canLeaveToStates: { stop: true },
                onEnter: handleEnterState
            },
            stop: {
                canEnterFromStates: { prepareToStop: true, stop_finishWalking: true },
                canLeaveToStates: { go: true },
                onEnter: handleEnterState
            },
        },
        props
    );

    const bindToExternalFsm = useCallback((fsmToBindTo: string): void => {
        fsmRef.current.getFsmStateData$<CrossingControlBoxStates, CrossingControlBoxData>(fsmToBindTo)
            .subscribe(([currentStateInfo, externalStateData]: [CurrentStateInfo<TrafficLightRequestCrossingStates, TrafficLightRequestCrossingData, TrafficLightRequestCrossingCanLeaveToMap>, StateData<CrossingControlBoxStates, CrossingControlBoxData> | undefined]) => {

                if (!externalStateData || externalStateData.state === "FSMInit") { return; }
                if (currentStateInfo.state === "FSMInit") { return; }
                const { stateData } = currentStateInfo;

                if (!currentStateInfo.stateData.pedestrianCrossingRequested && externalStateData.isWalkRequestIndicatorOn) {
                    fsmRef.current.updateState({ ...stateData, pedestrianCrossingRequested: true });
                }
            });
    }, [fsmRef]);

    useEffect(() => {
        fsmRef.current.currentState$.subscribe((currentStateInfo: CurrentStateInfo<TrafficLightRequestCrossingStates, TrafficLightRequestCrossingData, TrafficLightRequestCrossingCanLeaveToMap>) => {
            if (currentStateInfo.state === "FSMInit") {
                if (props.fsmToBindTo !== "") { bindToExternalFsm(props.fsmToBindTo); }
                fsmRef.current.changeState({ state: "go", pedestrianCrossingRequested: false, trafficLightTimings: { go: 7000, prepareToStop: 3000, stop: 10000, stop_finishWalking: 2100, stop_startWalking: 3000 } });
            }
        });
    }, [fsmRef, props.fsmToBindTo]);

    function handleEnterState(onEnterStateChanges: OnEnterStateChanges<TrafficLightRequestCrossingStates, TrafficLightRequestCrossingStates, TrafficLightRequestCrossingData, TrafficLightRequestCrossingCanLeaveToMap>): void {

        const { enteringStateInfo } = onEnterStateChanges;
        const { state, stateData } = enteringStateInfo;
        const { trafficLightTimings } = stateData;
        delayToStateChange(trafficLightTimings[state]);
    }

    function delayToStateChange(delay: number) {
        timer(delay)
            .pipe(switchMap(() => { return fsmRef.current.currentState$; }))
            .subscribe((currentStateInfo: CurrentStateInfo<TrafficLightRequestCrossingStates, TrafficLightRequestCrossingData, TrafficLightRequestCrossingCanLeaveToMap>) => {
                const { stateData, state, canLeaveTo } = currentStateInfo;
                if (state === "FSMInit") { return; }

                let nextState = canLeaveTo[0];
                if (state === "prepareToStop") {
                    nextState = stateData.pedestrianCrossingRequested ? "stop_startWalking" : "stop";
                }

                fsmRef.current.changeState({
                    ...stateData,
                    pedestrianCrossingRequested: state === "prepareToStop" ? false : stateData.pedestrianCrossingRequested,
                    state: nextState
                });

            });
    }

    return (
        <div className="traffic-light-housing">
            <ul>
                <li><span className={`red ${['stop', 'stop_startWalking', 'stop_finishWalking'].includes(stateData.state) ? 'on' : ''}`}></span></li>
                <li><span className={`amber ${stateData.state === "prepareToStop" ? 'on' : ''}`}></span></li>
                <li><span className={`green ${stateData.state === "go" ? 'on' : ''}`}></span></li>
            </ul>
        </div>
    );
}
