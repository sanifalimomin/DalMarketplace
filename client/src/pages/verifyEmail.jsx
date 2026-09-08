import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("verifying"); // verifying, success, error
  const [message, setMessage] = useState("Validating your account...");

  // Extract token from URL parameter (?token=your_token_here)
  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Invalid or missing verification token.");
      return;
    }

    // Call your backend API to verify the token
    fetch(`${import.meta.env.VITE_API_BASE_URL}/api/verify/verify?token=${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Verification failed or token expired.");
        }
        return res.json();
      })
      .then(() => {
        setStatus("success");
        setMessage("Your account has been successfully verified!");
      })
      .catch((err) => {
        setStatus("error");
        setMessage(err.message || "Something went wrong.");
      });
  }, [token]);

  return (
    <div style={{ padding: "40px", textAlign: "center" }}>
      <h1>Account Verification</h1>
      
      {status === "verifying" && <p style={{ color: "orange" }}>{message}</p>}
      
      {status === "success" && (
        <div>
          <p style={{ color: "green", fontWeight: "bold" }}>{message}</p>
          <Link to="/signin">Thank you for verifying your email! Please log in to use your account.</Link>
        </div>
      )}
      
      {status === "error" && (
        <div>
          <p style={{ color: "red", fontWeight: "bold" }}>{message}</p>
          <Link to="/signup">Try Registering</Link>
        </div>
      )}
    </div>
  );
}