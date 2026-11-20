import { useEffect, type FC, type PropsWithChildren } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { setUnauthorizedHandler } from "../services/api/http-client";
import { useAuthStore } from "../hooks/auth.store";

const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
});

const Providers: FC<PropsWithChildren> = ({children}) => {
    useEffect(() => {
        setUnauthorizedHandler(() => useAuthStore.getState().logout());
        return () => setUnauthorizedHandler(null);
    }, []);

    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
};

export default Providers;
