/*eslint-disable*/
import type { Meta, StoryObj, } from '@storybook/react';
import { FsmRxDebugSet } from '../../components/fsm-rx-debug-set/fsm-rx-debug-set';
import { FsmRxInjectorProps, FsmRxPropsInjector } from '../../components/fsm-rx-props-injector/fsm-rx-props-injector';
import { CrossingControlBox, CrossingControlBoxProps } from './components/crossing-control-box/crossing-control-box';
import { TrafficLightRequestCrossing, TrafficLightRequestCrossingProps } from './components/traffic-light-request-crossing/traffic-light-request-crossing';
import { CSSProperties } from 'react';

const meta: Meta<typeof FsmRxPropsInjector> = {
    title: 'Examples/5. Traffic Light Request Crossing',
    component: FsmRxPropsInjector,
};

export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {

    render: (args: FsmRxInjectorProps) => {

        const style: CSSProperties = {
            display: 'flex',
            gap: "10px",
            alignItems: "flex-end"
        };


        const TrafficLightRequestCrossingArgs: TrafficLightRequestCrossingProps = {
            fsmToBindTo: "crossingControlBox",
            fsmConfig: { ...args.fsmConfig, name: "trafficLight" }
        };

        const crossingControlBoxArgs: CrossingControlBoxProps = {
            fsmToBindTo: "trafficLight",
            fsmConfig: { ...args.fsmConfig, name: "crossingControlBox" }
        };

        return (
            <div style={style} >
                <FsmRxDebugSet debugLogKeys={["state", "pedestrianCrossingRequested"]}>
                    <TrafficLightRequestCrossing {...TrafficLightRequestCrossingArgs} />
                </FsmRxDebugSet>
                <FsmRxDebugSet debugLogKeys={["state", "isWalkLightOn", "isWalkRequestIndicatorOn", "flashInterval"]}>
                    <CrossingControlBox {...crossingControlBoxArgs} />
                </FsmRxDebugSet>
            </div>
        );
    }
}

/*
      
         

const meta: Meta<typeof MultiFsmStoryPropInjector> = {
    title: 'Examples/5. Traffic Light Request Crossing',
    component: MultiFsmStoryPropInjector,
};

export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {

    render: (args: BaseFsmComponentConfig) => {

        const trafficLightArgs: TrafficLightSynchronizedProps = {

        };

        return (<>
            <FsmRxDebugSet>
                <TrafficLightRequestCrossing {...trafficLightArgs} />
            </FsmRxDebugSet>
        </>);

    }


    /*
    render: (args: BaseFsmComponentConfig) => {

        const trafficLightArgs: TrafficLightSynchronizedProps = { ...args };
        trafficLightArgs.fsmConfig = { ...args.fsmConfig };
        trafficLightArgs.fsmToBindTo = "crossingControlBox";
        trafficLightArgs.fsmConfig.name = "trafficLight";

        const crossingControlBoxArgs: CrossingControlBoxProps = {
            fsmToBindTo: "trafficLight",
            fsmConfig: {

            }
        };





        return (
            <>
                <FsmRxDebugSet>
                    <TrafficLightRequestCrossing {...trafficLightArgs} />
                </FsmRxDebugSet>
                <FsmRxDebugSet>
                    <CrossingControlBox {...crossingControlBoxArgs} />
                </FsmRxDebugSet>
            </>
        );

    }
    

};
*/