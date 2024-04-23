/*eslint-disable*/
import { BaseStateData, CurrentStateInfo, FSMInitStateData, OnEnterStateChanges } from "fsm-rx";
import { useCallback, useEffect } from 'react';
import { takeUntil, timer } from "rxjs";
import useFsmRx, { FsmRxProps } from "../../../../hooks/use-fsm-rx";
import fsmRepository from "../../../../services/fsm-repository";
import './traffic-light-synchronized.scss';

type TrafficLightStates = "go" | "prepareToStop" | "stop";

type TrafficLightTimings = {
    go: 7000,
    prepareToStop: 3000;
};

interface TrafficLightData extends BaseStateData<TrafficLightStates> {
    trafficLightTimings: TrafficLightTimings;
}

export type TrafficLightCanLeaveToMap = {
    FSMInit: "go" | "stop",
    go: "prepareToStop",
    prepareToStop: "stop",
    stop: "go";
};

interface TrafficLightSynchronizedProps extends FsmRxProps<TrafficLightStates, TrafficLightData, TrafficLightCanLeaveToMap> {
    initState: Extract<TrafficLightStates, "stop" | "go">;
    fsmToBindTo: string;
}

export function TrafficLightSynchronized(props: TrafficLightSynchronizedProps) {

    const [stateData, fsmRef] = useFsmRx<TrafficLightStates, TrafficLightData, TrafficLightCanLeaveToMap>(
        {
            go: {
                canEnterFromStates: { FSMInit: true, stop: true },
                canLeaveToStates: { prepareToStop: true },
                onEnter: handleEnterState
            },
            prepareToStop: {
                canEnterFromStates: { go: true },
                canLeaveToStates: { stop: true },
                onEnter: handleEnterState
            },
            stop: {
                canEnterFromStates: { prepareToStop: true, FSMInit: true },
                canLeaveToStates: { go: true },
            }
        },
        props,
        {
            name: "trafficLight"
        }
    );

    const bindToExternalFsm = useCallback((fsmToBindTo: string): void => {
        fsmRepository.getFsmData$(fsmToBindTo, fsmRef.current.destroy$).subscribe((externalStateData: FSMInitStateData | BaseStateData<string> | undefined) => {
            fsmRef.current.currentState$.subscribe((currentStateInfo: CurrentStateInfo<TrafficLightStates, TrafficLightData, TrafficLightCanLeaveToMap>) => {
                if (externalStateData?.state === "stop" && currentStateInfo.state === "stop") {
                    const { stateData, canLeaveTo } = currentStateInfo;
                    fsmRef.current.changeState({
                        ...stateData,
                        state: canLeaveTo[0]
                    });
                }
            });

        });
    }, [fsmRef]);

    useEffect(() => {
        fsmRef.current.currentState$.subscribe((currentStateInfo: CurrentStateInfo<TrafficLightStates, TrafficLightData, TrafficLightCanLeaveToMap>) => {
            if (currentStateInfo.state === "FSMInit") {
                if (props.fsmToBindTo !== "") { bindToExternalFsm(props.fsmToBindTo); }
                fsmRef.current.changeState({ state: props.initState, trafficLightTimings: { go: 7000, prepareToStop: 3000 } });
            }
        });
    }, [fsmRef, props.initState, props.fsmToBindTo, bindToExternalFsm]);

    function handleEnterState(onEnterStateChanges: OnEnterStateChanges<TrafficLightStates, "go" | "prepareToStop", TrafficLightData, TrafficLightCanLeaveToMap>): void {

        const { enteringStateInfo } = onEnterStateChanges;
        const { stateData, state, canLeaveTo } = enteringStateInfo;
        const { trafficLightTimings } = stateData;

        timer(trafficLightTimings[state])
            .pipe(takeUntil(fsmRef.current.destroy$))
            .subscribe(() => {
                fsmRef.current.changeState({
                    ...stateData,
                    state: canLeaveTo[0]
                });
            });
    }

    return (
        <div className="traffic-light-housing">
            <ul>
                <li><span className={`red ${stateData.state === "stop" ? 'on' : ''}`}></span></li>
                <li><span className={`amber ${stateData.state === "prepareToStop" ? 'on' : ''}`}></span></li>
                <li><span className={`green ${stateData.state === "go" ? 'on' : ''}`}></span></li>
            </ul>
        </div>
    );
}
