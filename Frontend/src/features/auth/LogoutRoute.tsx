import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useLogoutMutation } from "./authApi";
import { useAppDispatch } from "../../app/hooks";
import { logout as logoutAction } from "./authSlice";

export default function LogoutRoute() {
  const dispatch = useAppDispatch();
  const [logoutApi] = useLogoutMutation();

  useEffect(() => {
    (async () => {
      try {
        // mutation takes no args; it reads refreshToken from localStorage
        await logoutApi().unwrap();
      } catch {
        // ignore API errors on logout
      } finally {
        dispatch(logoutAction());
      }
    })();
  }, [dispatch, logoutApi]);

  return <Navigate to="/login" replace />;
}






// import { useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import { useLogoutMutation } from "./authApi";
// import { useAppDispatch } from "../../app/hooks"; // adjust hook path
// import { clearAuth } from "./authSlice";

// export default function LogoutRoute() {
//   const [logout] = useLogoutMutation();
//   const dispatch = useAppDispatch();
//   const navigate = useNavigate();

//   useEffect(() => {
//     (async () => {
//       try {
//         const refreshToken =
//           localStorage.getItem("refreshToken") ?? ""; // may be empty
//         if (refreshToken) {
//           await logout({ refreshToken }).unwrap();
//         }
//       } catch {
//         // ignore API failure; we'll still clear client-side auth
//       } finally {
//         dispatch(clearAuth());
//         navigate("/login", { replace: true });
//       }
//     })();
//   }, [dispatch, logout, navigate]);

//   return null; // no UI needed
// }
