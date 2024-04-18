
import { BaseStateData, CurrentStateInfo, OnEnterStateChanges } from "fsm-rx";
import { useEffect } from 'react';
import { takeUntil, timer } from "rxjs";
import './traffic-light-conditional-init.scss';
import useFsmRx, { FsmRxProps } from "../../../../hooks/use-fsm-rx";

type TrafficLightStates = "go" | "prepareToStop" | "stop";

type TrafficLightTimings = {
    go: 7000,
    prepareToStop: 3000,
    stop: 10000;
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

interface TrafficLightConditionalInitProps extends FsmRxProps<TrafficLightStates, TrafficLightData, TrafficLightCanLeaveToMap> {
    initState: Extract<TrafficLightStates, "stop" | "go">;
}


export function TrafficLightConditionalInit(props: TrafficLightConditionalInitProps) {

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
                onEnter: handleEnterState
            }
        },
        props
    );

    useEffect(() => {
        fsmRef.current.currentState$.subscribe((currentStateInfo: CurrentStateInfo<TrafficLightStates, TrafficLightData, TrafficLightCanLeaveToMap>) => {
            if (currentStateInfo.state === "FSMInit") {

                console.log('props.initState', props.initState);
                fsmRef.current.changeState({ state: props.initState, trafficLightTimings: { go: 7000, prepareToStop: 3000, stop: 10000 } });
            }
        });
    }, [fsmRef, props.initState]);

    function handleEnterState(onEnterStateChanges: OnEnterStateChanges<TrafficLightStates, TrafficLightStates, TrafficLightData, TrafficLightCanLeaveToMap>): void {

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
