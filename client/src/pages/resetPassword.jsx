import styles from "../styles/resetPassword.module.css";
import { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Box, IconButton } from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import Banner from "../components/Banner";
import Logo from "../components/logo.jsx";

const BANNER_AUTO_HIDE_MS = 6000;

export default function ResetPassword() {
    const [formData, setFormData] = useState({
        password: "",
        confirmPassword: "",
    });
    const [searchParams] = useSearchParams();

    const navigate = useNavigate();
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    useEffect(() => {
        if (!error) return;
        const t = setTimeout(() => setError(""), BANNER_AUTO_HIDE_MS);
        return () => clearTimeout(t);
    }, [error]);

    const handleChange = (e) => {
        setFormData( prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    const isPasswordValid = formData.password.length >= 8;
    const doPasswordsMatch = formData.confirmPassword.length > 0 && formData.confirmPassword === formData.password;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSubmitted(true);

        if (!isPasswordValid || !doPasswordsMatch) return;

        setLoading(true);
        try {
            const token = searchParams.get('token');

            const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/reset/reset-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    password: formData.password,
                    token: token,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                return setError(data.error || "Failed to reset password");
            }

            navigate("/signin", {
                state: {
                    flash: { type: "success", message: "Password has been reset. Please log in with your new password." },
                },
            });
        } catch (err) {
            setError("Server error, please try again");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.resetPassword}>
            <Box sx={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 1300 }}>
                <Banner type="error" message={error} onClose={() => setError("")} />
            </Box>
            <div className={styles.container}>

                <div className={styles.header}>
                    {/* <div style="width:30px;height:30px;border-radius:8px;background:#1a1a1a;color:#ffffff;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:800;">DM</div> */}
                    <Logo />
                    <div className={styles.title}>DalMarketplace</div>
                </div>
                <div className={styles.desc}>Please enter your new password and confirm</div>

                <div className={styles.inputPlate}>
                    <div className={styles.label}>New Password</div>
                    <div className={styles.passwordWrapper}>
                        <input
                            type={showPassword ? "text" : "password"}
                            id="password"
                            name="password"
                            className={styles.textBox}
                            placeholder="New password"
                            value={formData.password}
                            onChange={handleChange}
                        />
                        <IconButton
                            type="button"
                            className={styles.eyeToggle}
                            onClick={() => setShowPassword((s) => !s)}
                            aria-label={showPassword ? "Hide password" : "Show password"}
                            size="small"
                        >
                            {showPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                        </IconButton>
                    </div>
                     {submitted && (
                        <div className={styles.valid}>
                            {isPasswordValid ? (
                                <>
                                    <span className={styles.checkMark}>&#10003;</span> Valid password
                                </>
                            ) : (
                                <>
                                    <div className={styles.invalid}>
                                        <span className={styles.checkMark}>&#10005;</span> Password must be at least 8 characters
                                    </div>
                                </>
                            )
                            }
                        </div>
                    )}
                </div>

                <div className={styles.inputPlate}>
                    <div className={styles.label}>Confirm Password</div>
                    <div className={styles.passwordWrapper}>
                        <input
                            type={showConfirmPassword ? "text" : "password"}
                            id="confirmPassword"
                            name="confirmPassword"
                            className={styles.textBox}
                            placeholder="Confirm password"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                        />
                        <IconButton
                            type="button"
                            className={styles.eyeToggle}
                            onClick={() => setShowConfirmPassword((s) => !s)}
                            aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                            size="small"
                        >
                            {showConfirmPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                        </IconButton>
                    </div>
                    {submitted && !doPasswordsMatch && (
                        <div className={styles.valid}>
                            <div className={styles.invalid}>
                                <span className={styles.checkMark}>&#10005;</span> Passwords must match
                            </div>
                        </div>
                    )}
                </div>

                <form onSubmit={handleSubmit}>
                    <button
                        type="submit"
                        className={styles.createAccount}
                        disabled={loading}>
                            {loading ? "Processing..." : "Reset password"}
                    </button>
                </form>
            </div>
        </div>
    )
}
