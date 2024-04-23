import type { Meta, StoryObj, } from '@storybook/react';
import { FsmRxDebugSet } from '../../components/fsm-rx-debug-set/fsm-rx-debug-set';
import { TrafficLightSynchronized } from './components/traffic-light-synchronized/traffic-light-synchronized';
import { CSSProperties } from 'react';

const meta: Meta<typeof TrafficLightSynchronized> = {
    title: 'Examples/4. Traffic Light Synchronized',
    component: TrafficLightSynchronized,
    decorators: [
        (Story) => {
            const style: CSSProperties = {
                display: 'flex',
                gap: "10px"
            };
            return (
                <div style={style} >
                    <Story />
                </div >
            );
        }
    ],
    args: {
        fsmConfig: {
            stateDiagramDirection: "TB",
            debugLogBufferCount: 10,
            outputDebugLog: true,
            stringifyLogTransitionData: false,
            outputStateDiagramDefinition: true,
        },
    },
    parameters: {
        deepControls: { enabled: true },
        controls: {
            exclude: '(setStateDiagramDefinition|setDebugLog|initState|fsmToBindTo)'
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

export const Default: Story = {
    render: (args) => {

        const goArgs = { ...args, ...{ fsmConfig: { ...args.fsmConfig } } };
        goArgs.initState = "go";
        goArgs.fsmToBindTo = "trafficLight2";
        goArgs.fsmConfig.name = "trafficLight1";

        const stopArgs = { ...args, ...{ fsmConfig: { ...args.fsmConfig } } };
        stopArgs.initState = "stop";
        stopArgs.fsmToBindTo = "trafficLight1";
        stopArgs.fsmConfig.name = "trafficLight2";

        return (
            <>
                <FsmRxDebugSet>
                    <TrafficLightSynchronized {...goArgs} />
                </FsmRxDebugSet>
                <FsmRxDebugSet>
                    <TrafficLightSynchronized {...stopArgs} />
                </FsmRxDebugSet>
            </>
        );

    }
};