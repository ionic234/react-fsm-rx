import type { Meta, StoryObj, } from '@storybook/react';
import { FsmRxDebugSet } from '../../components/fsm-rx-debug-set/fsm-rx-debug-set';
import { TrafficLightConditionalInit } from './components/traffic-light-conditional-init/traffic-light-conditional-init';
import { CSSProperties } from 'react';

const meta: Meta<typeof TrafficLightConditionalInit> = {
    title: 'Examples/3. Traffic Light Conditional Init',
    component: TrafficLightConditionalInit,
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
            exclude: '(setStateDiagramDefinition|setDebugLog|initState)'
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

        const goArgs = { ...args };
        goArgs.initState = "go";
        const stopArgs = { ...args };
        stopArgs.initState = "stop";

        return (
            <>
                <FsmRxDebugSet>
                    <TrafficLightConditionalInit {...goArgs} />
                </FsmRxDebugSet>
                <FsmRxDebugSet>
                    <TrafficLightConditionalInit {...stopArgs} />
                </FsmRxDebugSet>
            </>
        );

    }
};