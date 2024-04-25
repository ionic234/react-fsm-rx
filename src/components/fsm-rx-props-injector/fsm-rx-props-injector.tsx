import { BaseFsmComponentConfig } from "../../classes/react-fsm-rx";

export type FsmRxInjectorProps = {
    fsmConfig: Partial<BaseFsmComponentConfig>;
};

export function FsmRxPropsInjector(props: FsmRxInjectorProps): JSX.Element {
    console.log(props);
    return (<></>);
}