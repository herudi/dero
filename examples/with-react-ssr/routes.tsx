import Home from './page/Home.tsx';
import About from './page/About.tsx';

const Routes = [
    {
        path: '/',
        exact: true,
        component: Home,
        apiUrl: '/api/home'
    },
    {
        path: '/about',
        component: About,
        apiUrl: '/api/about'
    }
];

export default Routes;