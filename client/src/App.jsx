import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Box, CircularProgress } from "@mui/material";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./contexts/AuthContext";

const Signup = lazy(() => import("./pages/signup"));
const Login = lazy(() => import("./pages/login"));
const Dashboard = lazy(() => import("./pages/dashboard"));
const MyListings = lazy(() => import("./pages/myListings"));
const NewPosting = lazy(() => import("./pages/newPosting"));
const Help = lazy(() => import("./pages/HelpScreen"));
const VerifyEmail = lazy(() => import("./pages/verifyEmail"));
const EmailVerification = lazy(() => import("./pages/emailVerification"));
const Messages = lazy(() => import("./pages/messages"));
const ItemScreen = lazy(() => import("./pages/itemScreen"));
const UserProfile = lazy(() => import("./pages/userProfile"));
const SellerProfile = lazy(() => import("./pages/sellerProfile"));
const MyPurchases = lazy(() => import("./pages/myPurchases"));
const ResetPrompt = lazy(() => import("./pages/resetPrompt"));
const ResetPassword = lazy(() => import("./pages/resetPassword"));
const NotFound = lazy(() => import("./pages/notFound"));

function RouteFallback() {
  return (
    <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
      <CircularProgress />
    </Box>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/signin" element={<Login />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/emailVerification" element={<EmailVerification />} />
            <Route path="/resetPrompt" element={<ResetPrompt />} />
            <Route path="/resetPassword" element={<ResetPassword />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-listings"
              element={
                <ProtectedRoute>
                  <MyListings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/listings/new"
              element={
                <ProtectedRoute>
                  <NewPosting />
                </ProtectedRoute>
              }
            />
            <Route
              path="/listings/:id/edit"
              element={
                <ProtectedRoute>
                  <NewPosting />
                </ProtectedRoute>
              }
            />
            <Route
              path="/help"
              element={
                <ProtectedRoute>
                  <Help />
                </ProtectedRoute>
              }
            />
            <Route
              path="/messages"
              element={
                <ProtectedRoute>
                  <Messages />
                </ProtectedRoute>
              }
            />
            <Route
              path="/listings/:id"
              element={
                <ProtectedRoute>
                  <ItemScreen />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <UserProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/users/:sellerId"
              element={
                <ProtectedRoute>
                  <SellerProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/purchases"
              element={
                <ProtectedRoute>
                  <MyPurchases />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
