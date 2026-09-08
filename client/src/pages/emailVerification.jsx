import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Box } from "@mui/material";
import Banner from "../components/Banner";
import styles from "../styles/emailVerification.module.css";
import Logo from "../components/logo";

const BANNER_AUTO_HIDE_MS = 6000;

export default function EmailVerification() {
    const location = useLocation();
    const { email, bannerId } = location.state || {};
    const [banner, setBanner] = useState(location.state?.flash || null);
    const [loading, setLoading] = useState(false);
    const [valid, setValid] = useState(false);
    const navigate = useNavigate();
    const hasSentInitialEmail = useRef(false);

    useEffect(() => {
        if (!banner) return;
        const t = setTimeout(() => setBanner(null), BANNER_AUTO_HIDE_MS);
        return () => clearTimeout(t);
    }, [banner]);

    const getEmail = async () => {
        if (email !== undefined) {
            return email;
        }

        else if (bannerId != undefined) {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/verify/getEmail`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ bannerId: bannerId })
            });

            const data = await res.json();

            if (!res.ok) {
                return setBanner({ type: "error", message: data.error || "Failed to get email" });
            }

            return data.email;

        } catch (err) {
            setBanner({ type: "error", message: "Server error, please try again" });
        }
    }
    }

    const sendVerificationEmail = async () => {
        setBanner(null);
        setLoading(true);

        const isAlreadyVerified = await checkIfVerified();

        if (!isAlreadyVerified) {

            const userEmail = await getEmail();

            try {
                const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/verify/send`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ bannerId: bannerId, email: userEmail }),
                });

                const data = await res.json();

                if (!res.ok) {
                    return setBanner({ type: "error", message: data.error || "Failed to send verification email" });
                }
                setBanner({ type: "success", message: "Verification email sent. Please check your inbox." });
            } catch (err) {
                setBanner({ type: "error", message: "Server error, please try again" });
            } finally {
                setLoading(false);
            }
        }
    };

    useEffect(() => {
        if (hasSentInitialEmail.current) return;
        hasSentInitialEmail.current = true;
        sendVerificationEmail();
    }, []);

    const checkIfVerified = async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/verify/check-status`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ bannerId: bannerId }),
            });

            const data = await res.json();

            if (!res.ok) {
                return setBanner({ type: "error", message: data.error || "Failed to check verification status" });
            }

            return(data.verified)
        } catch (err) {
            setBanner({ type: "error", message: "Server error, please try again" });
        }
    };

    // Check if user has validated thier email every 5 seconds
    useEffect(() => {
        let timer;
        const fetchVerificationStatus = async () => {
            const verified = await checkIfVerified();

            setValid(verified);

            if (verified) {
                setBanner({ type: "success", message: "Your email has been verified! You can now log in." });
            } else {
                timer = setTimeout(fetchVerificationStatus, 5000);
            }
        };
        fetchVerificationStatus();
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className={styles.emailVerification}>
            <Box sx={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 1300 }}>
                <Banner type={banner?.type} message={banner?.message} onClose={() => setBanner(null)} />
            </Box>
            <div className={styles.mainBody}>
                <div className={styles.card}>

                    <div className={styles.header}>
                        <Logo />
                        <div className={styles.title}>DalMarketplace</div>
                    </div>

                    <div className={styles.icon}>
                        <svg className={styles.iconContent} width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>
                    </div>

                    <div className={styles.heading}>Check your Dalhousie inbox</div>
                    <div className={styles.subHeading}>We sent a verification link to<br /><span className={styles.email}>{email || "Your @dal email"}</span>.<br />Click the link to confirm you are a current or former Dalhousie student.</div>

                    <div className={styles.checkBoxCard}>
                        <div className={styles.checkBoxItem}>
                            <div className={styles.checkIcon}>&#10003;</div> Account created
                        </div>
                        <div className={styles.checkBoxItem}>
                            <div className={styles.checkIcon}>&#10003;</div> Verification email sent
                        </div>
                        <div className={styles.checkBoxItem}>
                            {!valid ? (
                                <>
                                    <div className={styles.checkIcon}></div> Email confirmed
                                </>
                            ) : (
                                <>
                                    <div className={styles.checkIcon}>&#10003;</div> Email confirmed
                                </>
                            )}
                        </div>
                    </div>

                    {valid ? (
                        <>
                            <Link to="/signin">
                                <div className={styles.btn}>I've verified &mdash; continue</div>
                            </Link>
                        </>
                    ) : (
                        <>
                            <button className={styles.btnInvalid}>I've verified &mdash; continue</button>
                        </>
                    )}
                    
                    <div className={styles.resendLine}>Didn't get it? <span
                        className={styles.emailLink}
                        onClick={loading ? undefined : sendVerificationEmail}
                        style={loading ? { opacity: 0.6, pointerEvents: "none" } : undefined}
                    >
                        {loading ? "Sending…" : "Resend link"}
                    </span> &middot; check spam</div>
                </div>
            </div>
        </div>
    );
}