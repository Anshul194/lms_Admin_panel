import { useEffect, useState } from "react";
import { Navigate, Outlet, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
    selectIsAuthenticated,
    selectCurrentUser,
    selectAuthStatus,
    clearCredentials,
    checkAuthStatus,
} from "../../store/slices/authslice";
import type { AppDispatch } from "../../store";

// Roles that are allowed into this admin panel
const ALLOWED_ROLES = ["admin", "ADMIN", "moderator", "MODERATOR", "news_editor"];

const ProtectedRoute = () => {
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();

    const isAuthenticated = useSelector(selectIsAuthenticated);
    const currentUser = useSelector(selectCurrentUser);
    const authStatus = useSelector(selectAuthStatus);

    // Track whether we've completed the server-side verification
    const [serverVerified, setServerVerified] = useState(false);

    useEffect(() => {
        const verify = async () => {
            const token =
                localStorage.getItem("accessToken") || localStorage.getItem("token");

            if (!token) {
                // No token at all — clear anything stale and redirect
                dispatch(clearCredentials());
                setServerVerified(true);
                return;
            }

            // Always hit the server to get the REAL user & role.
            // This prevents anyone from faking their role in localStorage/Redux.
            const result = await dispatch(checkAuthStatus());

            if (checkAuthStatus.fulfilled.match(result)) {
                const serverRole = result.payload?.user?.role;
                if (!serverRole || !ALLOWED_ROLES.includes(String(serverRole).trim())) {
                    // Authenticated on the server, but role is NOT allowed in this panel
                    dispatch(clearCredentials());
                    navigate("/signin", { replace: true });
                }
            } else {
                // Server rejected the token (expired, invalid, revoked)
                dispatch(clearCredentials());
                navigate("/signin", { replace: true });
            }

            setServerVerified(true);
        };

        verify();
        // Run once per mount (each route navigation mounts ProtectedRoute)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // --- Render logic ---

    // Still waiting for server response — show a neutral loading state
    // (never render panel content before verification completes)
    if (!serverVerified || authStatus === "loading") {
        return (
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "100vh",
                    background: "#f9fafb",
                }}
            >
                <div
                    style={{
                        width: 40,
                        height: 40,
                        border: "4px solid #e5e7eb",
                        borderTop: "4px solid #6366f1",
                        borderRadius: "50%",
                        animation: "spin 0.8s linear infinite",
                    }}
                />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    // Not authenticated → redirect
    if (!isAuthenticated) {
        return <Navigate to="/signin" replace />;
    }

    // Role check using ONLY the server-verified Redux state (never localStorage)
    const serverRole = currentUser?.role;
    if (!serverRole || !ALLOWED_ROLES.includes(String(serverRole).trim())) {
        return <Navigate to="/signin" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
