/*eslint-disable*/

import { BaseStateData, CanLeaveToStatesMap, CurrentStateInfo, FSMInitStateData, FsmConfig, FsmRxConcrete, OnEnterStateChanges, StateMap } from "fsm-rx";
import { useEffect, useRef, useState } from 'react';
import { timer } from "rxjs";
import './App.scss';

function useFsmRx<
  TState extends string,
  TStateData extends
  BaseStateData<TState>, TCanLeaveToStatesMap extends CanLeaveToStatesMap<TState>
>(stateMap: StateMap<TState, TStateData, TCanLeaveToStatesMap>,
  fsmConfig?: Partial<FsmConfig<TState, TStateData, TCanLeaveToStatesMap>>,
  isInDevMode?: boolean): [FSMInitStateData | TStateData, React.MutableRefObject<FsmRxConcrete<TState, TStateData, TCanLeaveToStatesMap>>] {

  const fsmRef = useRef(new FsmRxConcrete(stateMap, fsmConfig, isInDevMode));
  const [stateData, setStateData] = useState<TStateData | FSMInitStateData>({ state: "FSMInit" });

  useEffect(() => {
    fsmRef.current.currentState$.subscribe((currentStateInfo: CurrentStateInfo<TState, TStateData, TCanLeaveToStatesMap>) => {
      if (currentStateInfo.state === "FSMInit") {
        fsmRef.current.stateData$.subscribe((stateData: TStateData | FSMInitStateData) => { setStateData(stateData); });
      }
    });
  }, []);

  return [stateData, fsmRef];

}

type TrafficLightStates = "go" | "prepareToStop" | "stop";

type TrafficLightTimings = {
  go: 7000,
  prepareToStop: 3000,
  stop: 10000;
};

interface TrafficLightData extends BaseStateData<TrafficLightStates> {
  trafficLightTimings: TrafficLightTimings;
}

type TrafficLightCanLeaveToMap = {
  FSMInit: "go",
  go: "prepareToStop",
  prepareToStop: "stop",
  stop: "go";
};

function App() {

  const [stateData, fsmRef] = useFsmRx<TrafficLightStates, TrafficLightData, TrafficLightCanLeaveToMap>({
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
      canEnterFromStates: { prepareToStop: true },
      canLeaveToStates: { go: true },
      onEnter: handleEnterState
    }
  });

  function handleEnterState(onEnterStateChanges: OnEnterStateChanges<TrafficLightStates, TrafficLightStates, TrafficLightData, TrafficLightCanLeaveToMap>): void {

    const { enteringStateInfo } = onEnterStateChanges;
    const { stateData, state, canLeaveTo } = enteringStateInfo;
    const { trafficLightTimings } = stateData;

    timer(trafficLightTimings[state])
      .subscribe(() => {
        fsmRef.current.changeState({
          ...stateData,
          state: canLeaveTo[0]
        });
      });
  }

  useEffect(() => {
    fsmRef.current.currentState$.subscribe((currentStateInfo: CurrentStateInfo<TrafficLightStates, TrafficLightData, TrafficLightCanLeaveToMap>) => {
      if (currentStateInfo.state === "FSMInit") {
        fsmRef.current.changeState({ state: "go", trafficLightTimings: { go: 7000, prepareToStop: 3000, stop: 10000 } });
      }
    });
  }, []);

  return (
    <>
      <div className="traffic-light-housing">
        <ul>
          <li><span className={`red ${stateData.state === "stop" ? 'on' : ''}`}></span></li>
          <li><span className={`amber ${stateData.state === "prepareToStop" ? 'on' : ''}`}></span></li>
          <li><span className={`green ${stateData.state === "go" ? 'on' : ''}`}></span></li>
        </ul>
      </div>
    </>
  );

}
export default App;
