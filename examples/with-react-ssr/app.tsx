import { React, ReactRouterDom } from "./deps/deps-client.ts";
import Routes from './routes.tsx';
import Navbar from './component/Navbar.tsx';

const { Switch, Route } = ReactRouterDom;

const App = ({ isServer, Component, initData }: any) => {

    if (isServer) return (
        <>
            <Navbar />
            <Component initData={initData} />
        </>
    );

    return (
        <React.Suspense fallback={<div>Loading...</div>}>
            <Navbar />
            <Switch>
                {Routes.map((el, x) => {
                    return <Route
                        {...el}
                        key={x}
                        component={(props: any) => {
                            return <el.component {...props} initData={initData} />;
                        }}
                    />
                })}
            </Switch>
        </React.Suspense>
    );
}

export default App;