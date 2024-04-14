import mermaid, { RenderResult } from 'mermaid';
import { useEffect, useRef, useState } from 'react';
import { Observable, Subject, from, map, takeUntil, take } from 'rxjs';
import uniqueDataService from '../../services/unique-data';
import "./fsm-rx-state-diagram.scss";

export type FsmRxStateDiagramProps = {
    stateDiagramDefinition: string;
};

export function FsmRxStateDiagram(props: FsmRxStateDiagramProps) {

    const [canvasId] = useState(`canvas_${uniqueDataService.generateUUID()}`);
    const svgElementRef = useRef<HTMLDivElement>(null);
    const destroyRef = useRef<Subject<void>>(new Subject());

    useEffect(() => {
        const currentDestroyRef = destroyRef.current;
        mermaid.initialize({
            startOnLoad: true,
            securityLevel: "loose",
        });
        return (() => {
            currentDestroyRef.next();
        });
    }, []);

    useEffect(() => {

        if (!props.stateDiagramDefinition) { return; }
        if (!svgElementRef.current) { return; }

        destroyRef.current.next();

        function renderDiagram(id: string, stateDiagramDefinition: string, svgElementRef: HTMLDivElement): Observable<string> {
            return from(mermaid.render(id, stateDiagramDefinition, svgElementRef)).pipe(
                takeUntil(destroyRef.current),
                take(1),
                map((renderResult: RenderResult) => { return renderResult.svg; })
            );
        }

        renderDiagram(canvasId, props.stateDiagramDefinition, svgElementRef.current).subscribe({
            next: (svg: string) => {
                if (svgElementRef.current) {
                    svgElementRef.current.innerHTML = svg;
                }
            }
        });
    }, [props.stateDiagramDefinition, canvasId]);

    return (
        <div className="canvas">
            <div className="mermaid" ref={svgElementRef} />
        </div>
    );
}
