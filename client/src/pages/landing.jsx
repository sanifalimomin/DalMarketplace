import styles from "../styles/landing.module.css";
import { Link, useNavigate } from "react-router-dom";
import Logo from "../components/logo";

function SignUp() {
    const navigate = useNavigate();

    const handleSignUp = () => {
        navigate("/signup");
    };

    return (
        <button className={styles.signUpBtn} onClick={handleSignUp}>Sign Up</button>
    );
}

function SignIn() {
    const navigate = useNavigate();
    const handleSignIn = () => {
        navigate("/signin");
    };

    return (
        <button className={styles.signInBtn} onClick={handleSignIn}>Sign In</button>
    );
}

export default function Landing() {
    return (
        <div className={styles.landing}>
            <h1 className={styles.heading}><Logo /><div className={styles.logo1}>DAL</div>Marketplace</h1>
            <p className={styles.description}>A website for Dal students to buy and sell items.</p>
                <SignIn />
            <p className={styles.signUpPrompt}>Don't have an account? <SignUp /></p>
        </div>
    );
}