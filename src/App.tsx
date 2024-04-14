/*eslint-disable*/

import './App.scss';
import { TrafficLightSimple } from "./components/TrafficLightSimple/TrafficLightSimple";
import { FsmRxDebugSet } from "./components/fsm-rx-debug-set/fsm-rx-debug-set";
function App() {

  return (
    <>
      <FsmRxDebugSet>
        <TrafficLightSimple />
      </FsmRxDebugSet>

    </>
  );

}
export default App;
