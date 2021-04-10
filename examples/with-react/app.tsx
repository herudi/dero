import { React } from "./deps.ts";

declare global {
    namespace JSX {
        interface IntrinsicElements {
            [k: string]: any;
        }
    }
}

const Index = () => {
    return (
        <div>Hello from react</div>
    );
}
export default Index;