import { default as ReactClient } from "https://jspm.dev/react@17.0.2";

const React = ReactClient as any;

declare global {
    namespace JSX {
        interface IntrinsicElements {
            [k: string]: any;
        }
    }
}

export default React;