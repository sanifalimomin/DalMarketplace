import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Box, CircularProgress, IconButton } from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { useAuth } from "../contexts/AuthContext";
import Banner from "../components/Banner";
import styles from "../styles/login.module.css";
import Logo from "../components/logo";

const BANNER_AUTO_HIDE_MS = 6000;

export default function Login() {
    const navigate = useNavigate();
    const location = useLocation();
    const { signIn } = useAuth();
    const [formData, setFormData] = useState({
        bannerId: "",
        password: "",
    });
    const [error, setError] = useState("");
    const [banner, setBanner] = useState(location.state?.flash || null);
    const [valid, setValid] = useState(false);
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        if (!error) return;
        const t = setTimeout(() => setError(""), BANNER_AUTO_HIDE_MS);
        return () => clearTimeout(t);
    }, [error]);

    useEffect(() => {
        if (!banner) return;
        const t = setTimeout(() => setBanner(null), BANNER_AUTO_HIDE_MS);
        return () => clearTimeout(t);
    }, [banner]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const isBannerIdValid = formData.bannerId.length === 9 && formData.bannerId.startsWith("B00");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSubmitted(true);

        if (!isBannerIdValid || !formData.password) {
            return;
        }

        setLoading(true);

        try {
            const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (!res.ok) {
                if (data.details?.code === "EMAIL_NOT_VERIFIED") {
                    navigate("/emailVerification", {
                        state: {
                            bannerId: data.details.bannerId || formData.bannerId,
                            flash: { type: "error", message: "Please verify your email before logging in." },
                        },
                    });
                    return;
                }
                return setError(data.error || "Login failed");
            }

            signIn(data.token, data.bannerId, data.userId, data.name, data.avatarUrl);
            navigate("/dashboard");
        } catch (err) {
            setError("Server error, please try again");
        } finally {
            setLoading(false);
        }
    };

    const activeBanner = error ? { type: "error", message: error } : banner;

    return (
        <div className={styles.container}>
            <Box sx={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 1300 }}>
                <Banner
                    type={activeBanner?.type}
                    message={activeBanner?.message}
                    onClose={() => (error ? setError("") : setBanner(null))}
                />
            </Box>
            <div className={styles.login}>
                <div className={styles.logo}>
                    <Logo />DalMarketplace
                </div>
                <div className={styles.description}>
                    Sign in with your Dalhouse account
                </div>
                <div className={styles.loginForm}>
                    <form className={styles.form} onSubmit={handleSubmit}>
                        <div className={styles.inputPlate}>
                            <label htmlFor="bannerId" className={styles.label}>Banner ID</label>
                            <input
                                type="text"
                                name="bannerId"
                                placeholder="Banner ID"
                                className={styles.input}
                                onChange={handleChange}
                                required
                            />
                            {submitted && (
                                !isBannerIdValid ? (
                                    <span className={styles.invalid}>Please use a valid Banner ID.</span>
                                ) : (
                                    <span className={styles.valid}>
                                        <span className={styles.checkMark}>✓</span>
                                        Recognized Banner Id
                                    </span>
                                )
                            )}
                        </div>
                        
                        <div className={styles.inputPlate}>
                            <label htmlFor="password" className={styles.label}>Password</label>
                            <div className={styles.passwordWrapper}>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    placeholder="Password"
                                    className={styles.input}
                                    onChange={handleChange}
                                    required
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
                            <Link to="/resetPrompt" className={styles.forgotPassword}>Forgot Password?</Link>
                        </div>

                        <button type="submit" className={styles.signInBtn} disabled={loading}>
                                {loading && <CircularProgress size={16} sx={{ color: "#fff", mr: 1.25 }} />}
                                {loading ? "Signing In..." : "Sign In"}
                            </button>
                    </form>
                    <p className={styles.note}>Only @dal.ca and verified alumni</p>
                    <p className={styles.signUpPrompt}>
                        New to DalMarketplace? <Link className={styles.signUpLink} to="/signup">Create an account</Link>
                    </p>
            </div>
        </div>
        </div>
    );
}