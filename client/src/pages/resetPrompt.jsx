import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Box } from "@mui/material";
import Banner from "../components/Banner";
import styles from "../styles/resetPrompt.module.css";
import Logo from "../components/logo.jsx";

const BANNER_AUTO_HIDE_MS = 6000;

export default function ResetPrompt() {
    const [formData, setFormData] = useState({
        email: "",
    });
    const [banner, setBanner] = useState(null);
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        if (!banner) return;
        const t = setTimeout(() => setBanner(null), BANNER_AUTO_HIDE_MS);
        return () => clearTimeout(t);
    }, [banner]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const isEmailValid = formData.email.trim().toLowerCase().endsWith("@dal.ca");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setBanner(null);
        setSubmitted(true);

        if (!isEmailValid) return;

        setLoading(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/reset/send`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: formData.email,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                return setBanner({ type: "error", message: data.error || "Failed to send email" });
            }

            setBanner({ type: "success", message: "Password reset email has been sent. Check your spam folder." });
        } catch (err) {
            setBanner({ type: "error", message: "Server error, please try again" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.resetPrompt}>
            <Box sx={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 1300 }}>
                <Banner type={banner?.type} message={banner?.message} onClose={() => setBanner(null)} />
            </Box>
            <div className={styles.container}>

                <div className={styles.header}>
                    {/* <div style="width:30px;height:30px;border-radius:8px;background:#1a1a1a;color:#ffffff;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:800;">DM</div> */}
                    <Logo />
                    <div className={styles.title}>DalMarketplace</div>
                </div>
                <div className={styles.desc}>Please enter your email to rest your password</div>

                <div className={styles.inputPlate}>
                    <div className={styles.label}>Email (ending in @dal.ca)</div>
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
                                    <span className={styles.checkMark}>&#10003;</span> Valid @dal.ca address &mdash; a reset link will be sent here
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

                <form onSubmit={handleSubmit}>
                    <button
                        type="submit" 
                        className={styles.createAccount} 
                        disabled={loading}>
                            {loading ? "Sending..." : "Send email"}
                    </button>
                </form>

                <div className={styles.haveAPassword}>Remembered your password? <Link to="/" className={styles.signIn}>Sign in</Link></div>
            </div>
        </div>
    );
}