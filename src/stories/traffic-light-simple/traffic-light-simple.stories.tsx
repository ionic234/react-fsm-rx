import type { Meta, StoryObj } from '@storybook/react';
import { TrafficLightSimple } from "./components/traffic-light-simple/TrafficLightSimple";
import { FsmRxDebugSet } from '../../components/fsm-rx-debug-set/fsm-rx-debug-set';

const meta: Meta<typeof TrafficLightSimple> = {
  component: TrafficLightSimple,
  decorators: [
    (Story) => (
      <FsmRxDebugSet>
        <Story />
      </FsmRxDebugSet>
    ),
  ],
  args: {
    fsmConfig: {
      stateDiagramDirection: "TB",
      debugLogBufferCount: 10,
      outputDebugLog: true,
      stringifyLogTransitionData: false,
      outputStateDiagramDefinition: true,
    }
  },
  parameters: {
    deepControls: { enabled: true },
    controls: {
      exclude: '(setStateDiagramDefinition|setDebugLog)'
    }
  },
  argTypes: {
    //eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    'fsmConfig.stateDiagramDirection': {
      control: { type: 'select' },
      options: ["LR", "TB"],
      name: 'State Diagram Direction'
    },
    'fsmConfig.debugLogBufferCount': {
      name: ' Debug Log Buffer Count',
      control: { type: 'number' }
    },
    'fsmConfig.outputDebugLog': {
      name: `Output Debug Log`,
      control: { type: 'boolean' }
    },
    'fsmConfig.stringifyLogTransitionData': {
      name: `Stringify Log Transition Data`,
      control: { type: 'boolean' }
    },
    'fsmConfig.outputStateDiagramDefinition': {
      name: `Output State Diagram Definition`,
      control: { type: 'boolean' }
    },
  }
};


export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};