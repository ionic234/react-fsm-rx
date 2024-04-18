/*eslint-disable*/

import './App.scss';
import { TrafficLightSimple } from "./stories/traffic-light-simple/components/traffic-light-simple/traffic-light-simple";
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
