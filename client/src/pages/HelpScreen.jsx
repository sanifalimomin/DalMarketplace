import { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import styles from "../styles/help.module.css";

/**
 * Data for the help page
 */
const HELP_SECTIONS = [
  {
    id: "faqs",
    title: "FAQs",
    defaultOpen: false,
    kind: "placeholder",
    items: [
      {
        id: "faq-1",
        question: "How do I post an item?",
        answer:
          "Click + Post item in the top navbar, fill in your item details, photos, and price, then submit for listing.",
      },
      {
        id: "faq-2",
        question: "Who can buy and sell on DalMarketplace?",
        answer:
          "The marketplace is for verified Dalhousie students.",
      },
      {
        id: "faq-3",
        question: "Is there a fee to sell an item?",
        answer:
          "No, posting and selling on DalMarketplace is completely free for verified Dalhousie students.",
      },
    ],
  },
  {
    id: "account",
    title: "Account",
    defaultOpen: false,
    kind: "placeholder",
    items: [
      {
        id: "acct-1",
        question: "How do I verify?",
        answer:
          "Verification uses your Dalhousie credentials.",
      },
      {
        id: "acct-2",
        question: "How do I update my profile?",
        answer:
          "Click your avatar in the top-right corner to access profile settings.",
      },
            {
        id: "acct-3",
        question: "Can I use DalMarketplace after I graduate?",
        answer:
          "Your account remains active as long as your Dalhousie credentials are valid.",
      },
    ],
  },
  {
    id: "contact",
    title: "Contact Us",
    defaultOpen: true,
    kind: "contact",
    email: "marketplacedal@gmail.com",
    phone: "(902) 494-2211",
  },
];

function Chevron({ open }) {
  return (
    <svg
      className={`${styles.chevron} ${open ? styles.chevronOpen : ""}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

export default function HelpScreen() {
  const [openIds, setOpenIds] = useState(() =>
    new Set(HELP_SECTIONS.filter((s) => s.defaultOpen).map((s) => s.id)),
  );

  function toggleSection(id) {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className={styles.page}>
      <Navbar />

      <div className={styles.main}>
        <h1 className={styles.title}>Help</h1>

        <div className={styles.accordionList}>
          {HELP_SECTIONS.map((section) => {
            const isOpen = openIds.has(section.id);

            return (
              <div key={section.id} className={styles.card}>
                <button
                  type="button"
                  className={styles.cardHeader}
                  onClick={() => toggleSection(section.id)}
                  aria-expanded={isOpen}
                  aria-controls={`help-panel-${section.id}`}
                  id={`help-header-${section.id}`}
                >
                  <span className={styles.cardTitle}>{section.title}</span>
                  <Chevron open={isOpen} />
                </button>

                {isOpen && (
                  <div
                    className={styles.cardBody}
                    id={`help-panel-${section.id}`}
                    role="region"
                    aria-labelledby={`help-header-${section.id}`}
                  >
                    {section.kind === "contact" ? (
                      <div className={styles.contactList}>
                        <div className={styles.contactRow}>
                          <span className={styles.contactLabel}>Email: </span>
                          <a
                            className={styles.contactLink}
                            href={`mailto:${section.email}`}
                          >
                            {section.email}
                          </a>
                        </div>
                        <div className={styles.contactRow}>
                          <span className={styles.contactLabel}>Phone: </span>
                          <span>{section.phone}</span>
                        </div>
                      </div>
                    ) : (
                      <div className={styles.placeholderBlock}>
                        {section.items.map((item) => (
                          <div key={item.id} className={styles.placeholderItem}>
                            <div className={styles.placeholderQuestion}>
                              {item.question}
                            </div>
                            <p className={styles.placeholderAnswer}>
                              {item.answer}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <footer className={styles.footer}>
        © 2026 DalMarketplace
        <span className={styles.footerSep}>·</span>
        <Link to="/about" className={styles.footerLink}>
          About
        </Link>
        <span className={styles.footerSep}>·</span>
        <Link to="/safety" className={styles.footerLink}>
          Safety
        </Link>
        <span className={styles.footerSep}>·</span>
        Verified students only
      </footer>
    </div>
  );
}
