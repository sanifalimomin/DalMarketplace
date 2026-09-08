import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import Navbar from "../components/Navbar";
import Banner from "../components/Banner";
import styles from "../styles/messages.module.css";
import { useAuth } from "../contexts/AuthContext";
import { getChatToken } from "../services/chatService";
import { StreamChat } from "stream-chat";

const chatClient = StreamChat.getInstance(import.meta.env.VITE_STREAM_API_KEY);
const BANNER_AUTO_HIDE_MS = 6000;

function initialsFromName(name = "User") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function formatRelativeTime(dateValue) {
  if (!dateValue) return "";

  const seconds = Math.floor(
    (Date.now() - new Date(dateValue).getTime()) / 1000,
  );

  if (seconds < 60) return "now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  if (seconds < 172800) return "Yesterday";

  return new Date(dateValue).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function formatMessageTime(dateValue) {
  if (!dateValue) return "";

  return new Date(dateValue).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDayLabel(dateValue) {
  if (!dateValue) return "";

  const date = new Date(dateValue);
  const today = new Date();

  const isToday =
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();

  if (isToday) return "Today";

  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  if (isYesterday) return "Yesterday";

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function isSameDay(firstDate, secondDate) {
  if (!firstDate || !secondDate) return false;

  const first = new Date(firstDate);
  const second = new Date(secondDate);

  return (
    first.getDate() === second.getDate() &&
    first.getMonth() === second.getMonth() &&
    first.getFullYear() === second.getFullYear()
  );
}

function getMember(channel, memberId) {
  const members = Object.values(channel?.state?.members || {});

  return (
    members.find((member) => member.user?.id === memberId)?.user || {
      id: memberId,
      name: "User",
      image: "",
    }
  );
}

function getOtherMember(channel, currentUserId) {
  const members = Object.values(channel?.state?.members || {});

  return (
    members.find((member) => member.user?.id !== currentUserId)?.user || {
      id: "",
      name: "User",
      image: "",
    }
  );
}

export default function Messages() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [channels, setChannels] = useState([]);
  const [activeChannel, setActiveChannel] = useState(null);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [connectionError, setConnectionError] = useState("");
  const [sendError, setSendError] = useState("");
  const [messageVersion, setMessageVersion] = useState(0);

  const chatBodyRef = useRef(null);

  useEffect(() => {
    if (!sendError) return;
    const t = setTimeout(() => setSendError(""), BANNER_AUTO_HIDE_MS);
    return () => clearTimeout(t);
  }, [sendError]);

  useEffect(() => {
    let cancelled = false;

    async function loadChat() {
      try {
        setLoading(true);
        setConnectionError("");

        if (!user?.token || !user?.userId) {
          throw new Error("Please sign in before using messages.");
        }

        const { token } = await getChatToken(user.token);

        if (chatClient.userID !== user.userId) {
          if (chatClient.userID) {
            await chatClient.disconnectUser();
          }

          await chatClient.connectUser(
            {
              id: user.userId,
              name: user.name || user.bannerId || "User",
            },
            token,
          );
        }

        const loadedChannels = await chatClient.queryChannels(
          {
            type: "messaging",
            members: { $in: [user.userId] },
          },
          { last_message_at: -1 },
          { watch: true, state: true },
        );

        const requestedChannelId = new URLSearchParams(location.search).get(
          "channel",
        );

        let selectedChannel =
          loadedChannels.find((channel) => channel.id === requestedChannelId) ||
          loadedChannels[0] ||
          null;

        if (requestedChannelId && !selectedChannel) {
          const requestedChannel = chatClient.channel(
            "messaging",
            requestedChannelId,
          );

          await requestedChannel.watch();

          loadedChannels.unshift(requestedChannel);
          selectedChannel = requestedChannel;
        }

        if (cancelled) return;

        setChannels([...loadedChannels]);
        setActiveChannel(selectedChannel);
      } catch (err) {
        console.error("Chat connection error:", err);

        if (!cancelled) {
          setConnectionError(err.message || "Unable to load messages.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadChat();

    return () => {
      cancelled = true;
    };
  }, [user?.token, user?.userId, user?.name, user?.bannerId, location.search]);

  useEffect(() => {
    if (!activeChannel) return undefined;

    const listener = activeChannel.on("message.new", () => {
      setMessageVersion((value) => value + 1);

      setChannels((currentChannels) => {
        const updatedChannels = [...currentChannels];
        const index = updatedChannels.findIndex(
          (channel) => channel.cid === activeChannel.cid,
        );

        if (index > -1) {
          const [changedChannel] = updatedChannels.splice(index, 1);
          updatedChannels.unshift(changedChannel);
        }

        return updatedChannels;
      });
    });

    return () => listener.unsubscribe();
  }, [activeChannel]);

  useEffect(() => {
    if (!chatBodyRef.current) return;

    chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
  }, [activeChannel?.cid, messageVersion]);

  function handleSelectChannel(channel) {
    setActiveChannel(channel);

    navigate(`/messages?channel=${channel.id}`, {
      replace: true,
    });
  }

  async function handleSend(event) {
    event.preventDefault();

    const text = draft.trim();

    if (!text || !activeChannel) return;

    try {
      await activeChannel.sendMessage({ text });

      setDraft("");
      setMessageVersion((value) => value + 1);

      setChannels((currentChannels) => {
        const updatedChannels = [...currentChannels];
        const index = updatedChannels.findIndex(
          (channel) => channel.cid === activeChannel.cid,
        );

        if (index > -1) {
          const [changedChannel] = updatedChannels.splice(index, 1);
          updatedChannels.unshift(changedChannel);
        }

        return updatedChannels;
      });
    } catch (err) {
      console.error("Could not send message:", err);
      setSendError("Message could not be sent. Please try again.");
    }
  }

  if (loading) {
    return (
      <div className={styles.page}>
        <Navbar />
        <div className={styles.main}>
          <p>Loading messages...</p>
        </div>
      </div>
    );
  }

  if (connectionError) {
    return (
      <div className={styles.page}>
        <Navbar />
        <div className={styles.main}>
          <p>Chat error: {connectionError}</p>
        </div>
      </div>
    );
  }

  const messages = activeChannel?.state?.messages || [];
  const sellerId = activeChannel?.data?.sellerId;
  const seller = sellerId ? getMember(activeChannel, sellerId) : null;

  const otherUser = activeChannel
    ? getOtherMember(activeChannel, user.userId)
    : null;

  const listingId = activeChannel?.data?.listingId;
  const listingTitle = activeChannel?.data?.listingTitle || "Listing";
  const listingPrice = activeChannel?.data?.listingPrice;

  return (
    <div className={styles.page}>
      <Navbar />
      <Banner type="error" message={sendError} onClose={() => setSendError("")} />

      <div className={styles.main}>
        <div className={styles.title}>Messages</div>

        <div className={styles.card}>
          <aside className={styles.sidebar}>
            <div className={styles.sidebarHeader}>Conversations</div>

            {channels.length === 0 && (
              <div className={styles.emptyChat}>No conversations yet.</div>
            )}

            {channels.map((channel) => {
              const person = getOtherMember(channel, user.userId);
              const channelMessages = channel.state?.messages || [];
              const lastMessage = channelMessages[channelMessages.length - 1];

              return (
                <button
                  key={channel.cid}
                  type="button"
                  className={
                    activeChannel?.cid === channel.cid
                      ? `${styles.conversationItem} ${styles.conversationItemActive}`
                      : styles.conversationItem
                  }
                  onClick={() => handleSelectChannel(channel)}
                >
                  <div className={styles.avatar}>
                    {initialsFromName(person.name)}
                  </div>

                  <div className={styles.conversationBody}>
                    <div className={styles.conversationTop}>
                      <span className={styles.conversationName}>
                        {person.name}
                      </span>

                      <span className={styles.conversationTime}>
                        {formatRelativeTime(
                          lastMessage?.created_at ||
                            channel.data?.last_message_at ||
                            channel.data?.created_at,
                        )}
                      </span>
                    </div>

                    <div className={styles.conversationPreview}>
                      {lastMessage?.text ||
                        `About: ${channel.data?.listingTitle || "Listing"}`}
                    </div>
                  </div>
                </button>
              );
            })}
          </aside>

          {activeChannel ? (
            <section className={styles.chatPanel}>
              <div className={styles.chatHeader}>
                <div className={styles.chatHeaderInfo}>
                  <div className={styles.chatHeaderName}>
                    {seller?.name || otherUser?.name || "Seller"}
                  </div>

                  <div className={styles.chatHeaderAbout}>
                    About: {listingTitle}
                    {listingPrice !== undefined &&
                      listingPrice !== null &&
                      ` — $${listingPrice}`}
                  </div>
                </div>

                <div className={styles.headerSpacer} />

                {seller?.image ? (
                  <img
                    src={seller.image}
                    alt={seller.name}
                    className={styles.avatarImage}
                  />
                ) : (
                  <div className={styles.avatar}>
                    {initialsFromName(seller?.name || "Seller")}
                  </div>
                )}

                {listingId && (
                  <Link
                    to={`/listings/${listingId}`}
                    className={styles.viewListingBtn}
                  >
                    View listing
                  </Link>
                )}
              </div>

              <div ref={chatBodyRef} className={styles.chatBody}>
                {messages.length === 0 && (
                  <div className={styles.emptyChat}>
                    Start the conversation about this listing.
                  </div>
                )}

                {messages.map((message, index) => {
                  const previousMessage = messages[index - 1];
                  const isSellerMessage = message.user?.id === sellerId;
                  const showDate = !isSameDay(
                    message.created_at,
                    previousMessage?.created_at,
                  );

                  return (
                    <div key={message.id}>
                      {showDate && (
                        <div className={styles.pill}>
                          {formatDayLabel(message.created_at)}
                        </div>
                      )}

                      <div
                        className={
                          isSellerMessage
                            ? `${styles.messageRow} ${styles.messageRowSeller}`
                            : `${styles.messageRow} ${styles.messageRowBuyer}`
                        }
                      >
                        <div
                          className={`${styles.bubble} ${
                            isSellerMessage
                              ? styles.bubbleSent
                              : styles.bubbleReceived
                          }`}
                        >
                          {message.text}

                          <div
                            className={`${styles.bubbleMeta} ${
                              isSellerMessage
                                ? styles.bubbleMetaSent
                                : styles.bubbleMetaReceived
                            }`}
                          >
                            {formatMessageTime(message.created_at)}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <form className={styles.composer} onSubmit={handleSend}>
                <input
                  className={styles.composerInput}
                  type="text"
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder="Write a message..."
                  aria-label="Message"
                />

                <button type="submit" className={styles.sendButton}>
                  Send
                </button>
              </form>
            </section>
          ) : (
            <div className={styles.emptyChat}>Select a conversation</div>
          )}
        </div>

        <div className={styles.privacyNote}>
          Messaging keeps phone numbers and emails private until you choose to
          share them.
        </div>
      </div>
    </div>
  );
}
