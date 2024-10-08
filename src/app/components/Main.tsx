"use client";

import { addToQueue, checkIdInQueue, deleteFromQueue } from "@/api/userQueue";
import { useCallback, useEffect, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { supabase } from "../../../utils/supabase";
import { fetchMessages, sendMessage } from "@/api/messages";
import {
  deleteChatSession,
  fetchSession,
  updateSessionUser1,
  updateSessionUser2,
} from "@/api/chatSession";

const MainComponent = () => {
  const [currentAction, setCurrentAction] = useState<
    "none" | "search" | "chat"
  >("none");
  const [userId, setUserId] = useState<string | null>(null);
  const [chatSessionId, setChatSessionId] = useState<number | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [messageContent, setMessageContent] = useState("");
  const [user, setUser] = useState<number | null>(null);
  const [partnerConnected, setPartnerConnected] = useState(true);

  useEffect(() => {
    // Check if userId exists in localStorage, if not, create and store it
    let storedUserId = localStorage.getItem("userId");
    if (!storedUserId) {
      storedUserId = uuidv4();
      localStorage.setItem("userId", storedUserId);
    }
    setUserId(storedUserId);
  }, []);

  // Check if user has an existing chat session or is in the queue
  useEffect(() => {
    const fetchAndSetAction = async () => {
      if (userId) {
        const sessionData = await fetchSession(userId);
        if (
          sessionData.length > 0 &&
          ((sessionData[0].user1_id === userId &&
            sessionData[0].user1_connection) ||
            (sessionData[0].user2_id === userId &&
              sessionData[0].user2_connection))
        ) {
          setChatSessionId(sessionData[0].id);
          setCurrentAction("chat");
          if (sessionData[0].user1_id === userId) {
            setUser(1);
          } else if (sessionData[0].user2_id === userId) {
            setUser(2);
          }
          return;
        }

        const userExists = await checkIdInQueue(userId);
        if (userExists) {
          setCurrentAction("search");
        }
      }
    };

    fetchAndSetAction();
  }, [userId]);

  // Handle connection checks
  useEffect(() => {
    if (userId) {
      const channel = supabase
        .channel("chat_sessions")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "chat_sessions",
          },
          (payload) => {
            if (payload.eventType === "INSERT") {
              handleInsert(payload);
            } else if (payload.eventType === "UPDATE") {
              handleUpdate(payload);
            }
          }
        )
        .subscribe((status) => {
          if (status !== "SUBSCRIBED") {
            console.error("Error subscribing to channel:", status);
          }
        });

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [userId]);

  const startSearch = async () => {
    if (userId) {
      const userExists = await checkIdInQueue(userId);

      if (userExists) {
        console.log(
          "User ID already exists in the queue. Please try again later."
        );
      } else {
        setCurrentAction("search");
        addToQueue(userId);
      }
    }
  };

  const handleInsert = (payload: any) => {
    try {
      if (
        userId !== null &&
        (payload.new.user1_id === userId || payload.new.user2_id === userId)
      ) {
        setPartnerConnected(true);
        setChatSessionId(payload.new.id);
        setCurrentAction("chat");
        if (payload.new.user1_id === userId) {
          setUser(1);
        } else if (payload.new.user2_id === userId) {
          setUser(2);
        }
      }
    } catch (error) {
      console.error("Error handling INSERT event:", error);
    }
  };

  const handleUpdate = async (payload: any) => {
    try {
      if (
        userId !== null &&
        (payload.new.user1_id === userId || payload.new.user2_id === userId)
      ) {
        const sessionData = await fetchSession(userId as string);
        const sessionsWithBothConnections = sessionData.filter(
          (session: any) => session.user1_connection && session.user2_connection
        );

        if (sessionsWithBothConnections.length > 0) {
          return;
        } else {
          if (
            (payload.new.user1_id !== userId &&
              !payload.new.user1_connection) ||
            (payload.new.user2_id !== userId && !payload.new.user2_connection)
          ) {
            setPartnerConnected(false);
            return;
          }
        }

        if (payload.new.user1_id === userId) {
          handleLeave();
          return;
        } else if (payload.new.user2_id === userId) {
          handleLeave();
          return;
        }

        if (currentAction !== "chat") {
          setCurrentAction("chat");
        }

        // Check if both users have left
        if (!payload.new.user1_connection && !payload.new.user2_connection) {
          handleLeave();
        }
      }
    } catch (error) {
      console.error("Error handling UPDATE event:", error);
    }
  };

  const handleLeave = useCallback(async () => {
    if (userId && user && chatSessionId) {
      if (user === 1) {
        await updateSessionUser1(userId, false);
      } else if (user === 2) {
        await updateSessionUser2(userId, false);
      }

      setCurrentAction("none");
      setChatSessionId(null);
      setMessages([]);
      setUser(null);

      if (!partnerConnected) {
        await deleteChatSession(chatSessionId);
      }
    }
  }, [userId, user, chatSessionId, partnerConnected]);

  // messages

  const handleSendMessage = async () => {
    if (chatSessionId !== null && userId !== null && partnerConnected) {
      const messageData = {
        chat_session_id: chatSessionId,
        user_id: userId,
        content: messageContent,
      };
      setMessageContent("");
      await sendMessage(messageData);
    }
  };

  const memoizedFetchMessages = useCallback(async () => {
    if (chatSessionId !== null) {
      const fetchedMessages = await fetchMessages(chatSessionId);
      setMessages(fetchedMessages);
    }
  }, [chatSessionId]);

  useEffect(() => {
    if (chatSessionId) {
      memoizedFetchMessages();

      const channel = supabase
        .channel("messages")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `chat_session_id=eq.${chatSessionId}`,
          },
          (payload) => {
            if (payload.new.chat_session_id === chatSessionId) {
              setMessages((messages) => [...messages, payload.new]);
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [chatSessionId, memoizedFetchMessages]);

  const messageContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (messageContainerRef.current) {
      messageContainerRef.current.scrollTop =
        messageContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="h-screen w-screen flex items-center justify-center">
      {currentAction === "search" ? (
        <div className="h-full flex flex-col items-center">
          <div className="h-full flex justify-center items-center">
            <h2>SEARCHING ...</h2>
          </div>
          <div className="py-10">
            <button
              className="bg-blue-200 py-2 px-5 rounded-xl text-sm"
              onClick={() => {
                setCurrentAction("none");
                userId && deleteFromQueue(userId);
              }}
            >
              cancel
            </button>
          </div>
        </div>
      ) : currentAction === "chat" ? (
        <div className="w-full flex flex-col px-2">
          <button
            className="self-end text-red-500 text-sm"
            onClick={() => {
              if (window.confirm("Are you sure you want to leave?")) {
                handleLeave();
              }
            }}
          >
            Leave?
          </button>

          <div className="w-full flex flex-col items-center justify-center bg-blue-900 p-3 rounded-lg gap-5 px-2">
            <h2 className="font-semibold text-white">CHAT</h2>
            {!partnerConnected && (
              <p className="text-yellow-300">Your partner has left the chat.</p>
            )}
            <div className="w-full flex flex-col gap-3">
              <div
                ref={messageContainerRef}
                className="w-full min-h-32 h-32 bg-blue-500 rounded-lg p-2 overflow-y-auto text-black"
              >
                {messages.map((message, index) => (
                  <p key={index}>
                    <span className="font-semibold">
                      {message.user_id === userId ? "You" : "Stranger"}:{" "}
                    </span>
                    {message.content}
                  </p>
                ))}
              </div>
              <div className="w-full flex items-center gap-3">
                <input
                  className="w-full text-black px-2 py-3 rounded-lg"
                  type="text"
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  placeholder="Type your message here..."
                  disabled={!partnerConnected}
                />
                <button
                  disabled={messageContent === "" || !partnerConnected}
                  className={`${
                    messageContent === "" || !partnerConnected
                      ? "bg-gray-700"
                      : "bg-purple-700"
                  } text-white px-3 py-2 rounded-lg`}
                  onClick={handleSendMessage}
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div>
          <button
            className="px-3 py-2 bg-purple-700 text-white rounded-lg"
            onClick={startSearch}
          >
            START SEARCH
          </button>
        </div>
      )}
    </div>
  );
};

export default MainComponent;
