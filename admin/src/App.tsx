import { RouterProvider } from "react-router";
import Providers from "./providers/Providers.tsx";
import { router } from "./router";

export default function App() {
    return (
        <Providers>
            <RouterProvider router={router} />
        </Providers>
    );
}