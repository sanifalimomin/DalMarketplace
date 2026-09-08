import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Box, CircularProgress, IconButton } from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import Banner from "../components/Banner";
import styles from "../styles/signup.module.css";
import Logo from "../components/logo.jsx";

const BANNER_AUTO_HIDE_MS = 6000;

export default function Signup() {
    const navigate = useNavigate();
    const location = useLocation();
    const { name, email, bannerId, password } = location.state || {};
    const [formData, setFormData] = useState({
        name: name || "",
        email: email || "",
        bannerId: bannerId || "",
        password: password || "",
        confirmPassword: "",
    });
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
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const isNameValid = formData.name.length > 2;
    const isEmailValid = formData.email.endsWith("@dal.ca");
    const isBannerIdValid = formData.bannerId.length === 9 && formData.bannerId.startsWith("B00");
    const isPasswordValid = formData.password.length >= 8;
    const isConfirmPasswordValid = formData.confirmPassword.length > 0 && formData.confirmPassword === formData.password;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSubmitted(true);

        if (!isNameValid || !isEmailValid || !isBannerIdValid || !isPasswordValid || !isConfirmPasswordValid) {
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/signup`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: formData.email,
                    password: formData.password,
                    name: formData.name,
                    bannerId: formData.bannerId,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                return setError(data.error || "Registration failed");
            }

            navigate("/emailVerification", {
                state: {
                    email: formData.email,
                    bannerId: formData.bannerId,
                    flash: { type: "success", message: "Account created successfully! Please check your email for verification." },
                },
            });
        } catch (err) {
            setError("Server error, please try again");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.signup}>
            <Box sx={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 1300 }}>
                <Banner type="error" message={error} onClose={() => setError("")} />
            </Box>
            <div className={styles.container}>

                <div className={styles.header}>
                    {/* <div style="width:30px;height:30px;border-radius:8px;background:#1a1a1a;color:#ffffff;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:800;">DM</div> */}
                    <Logo />
                    <div className={styles.title}>DalMarketplace</div>
                </div>
                <div className={styles.desc}>Create your verified student account</div>

                <div className={styles.inputPlate}>
                    <div className={styles.label}>Full name</div>
                    <input 
                        type="text" 
                        id="name"
                        name="name" 
                        className={styles.textBox} 
                        placeholder="Full Name"
                        value={formData.name}
                        onChange={handleChange}
                     />
                    {submitted && (
                        <div className={styles.valid}>
                            {isNameValid ? (
                                <>
                                    <span className={styles.checkMark}>&#10003;</span> Valid name
                                </>
                            ) : (
                                <>
                                    <div className={styles.invalid}>
                                        <span className={styles.checkMark}>&#10005;</span> Name must be at least 3 characters
                                    </div>
                                </>
                            )
                            }
                        </div>
                    )}  
                </div>

                <div className={styles.inputPlate}>
                    <div className={styles.label}>Dalhousie email</div>
                    <input 
                        type="email" 
                        id="email"
                        name="email" 
                        className={styles.textBox} 
                        placeholder="Dalhousie Email"
                        value={formData.email}
                        onChange={handleChange}
                     />
                     {submitted && (
                        <div className={styles.valid}>
                            {isEmailValid ? (
                                <>
                                    <span className={styles.checkMark}>&#10003;</span> Valid @dal.ca address &mdash; a verification link will be sent here
                                </>
                            ) : (
                                <>
                                    <div className={styles.invalid}>
                                        <span className={styles.checkMark}>&#10005;</span> Email must be a valid @dal.ca address
                                    </div>
                                </>
                            )
                            }
                        </div>
                    )}
                </div>

                <div className={styles.inputPlate}>
                    <div className={styles.label}>Banner ID (B00)</div>
                    <input 
                        type="text" 
                        id="bannerId"
                        name="bannerId" 
                        className={styles.textBox} 
                        placeholder="Banner ID"
                        value={formData.bannerId}
                        onChange={handleChange}
                     />
                    {submitted && (
                        <div className={styles.valid}>
                            {isBannerIdValid ? (
                                <>
                                    <span className={styles.checkMark}>&#10003;</span> Valid Banner ID
                                </>
                            ) : (
                                <>
                                    <div className={styles.invalid}>
                                        <span className={styles.checkMark}>&#10005;</span> Banner ID must be 9 characters starting with "B00"
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>

                <div className={styles.inputPlate}>
                    <div className={styles.label}>Password</div>
                    <div className={styles.passwordWrapper}>
                        <input
                            type={showPassword ? "text" : "password"}
                            id="password"
                            name="password"
                            className={styles.textBox}
                            placeholder="Password"
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
                            )}
                        </div>
                     )}
                </div>

                <div className={styles.inputPlate}>
                    <div className={styles.label}>Confirm password</div>
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
                     {submitted && (
                        <div className={styles.valid}>
                            {isConfirmPasswordValid ? (
                                <>
                                    <span className={styles.checkMark}>&#10003;</span> Passwords match
                                </>
                            ) : (
                                <>
                                    <div className={styles.invalid}>
                                        <span className={styles.checkMark}>&#10005;</span> Passwords must match
                                    </div>
                                </>
                            )}
                        </div>
                     )}
                </div>

                <form onSubmit={handleSubmit}>
                    <button
                        type="submit"
                        className={styles.createAccount}
                        disabled={loading}>
                            {loading && <CircularProgress size={16} sx={{ color: "#fff", mr: 1.25 }} />}
                            {loading ? "Creating account..." : "Create account"}
                    </button>
                </form>

                <div className={styles.haveAnAccount}>Already have an account? <Link to="/" className={styles.signIn}>Sign in</Link></div>
            </div>
        </div>
    );
}