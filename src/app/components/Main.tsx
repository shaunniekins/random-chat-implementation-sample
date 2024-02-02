"use client";

import { addToQueue, checkIdInQueue } from "@/api/userQueue";
import { memo, useCallback, useEffect, useState } from "react";
import { supabase } from "../../../utils/supabase";
import { fetchMessages, sendMessage } from "@/api/messages";
import { updateSessionUser1, updateSessionUser2 } from "@/api/chatSession";

const MainComponent = () => {
  const [currentAction, setCurrentAction] = useState("none"); // none, search, chat
  const [leave, setLeave] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  const [chatSessionId, setChatSessionId] = useState<number | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [messageContent, setMessageContent] = useState("");

  const [connectionFound, setConnectionFound] = useState(false);

  useEffect(() => {
    if (userId) {
      // console.log(`User ${userId} is subscribing to the channel`);

      const channel = supabase
        .channel("chat_sessions2")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "chat_sessions2",
            // filter: `user1_id=eq.${userId},or,user2_id=eq.${userId}`,
            // filter: `user1_id=eq.${userId}`,
          },
          (payload) => {
            try {
              console.log(`INSERT event triggered for User ${userId}`);

              if (
                payload.new.user1_id === userId ||
                payload.new.user2_id === userId
              ) {
                console.log("New chat session: ", payload.new.id);
                setChatSessionId(payload.new.id);
                setCurrentAction("chat");
                setConnectionFound(true);

                if (payload.new.user1_id === userId) {
                  updateSessionUser1(userId, true);
                } else if (payload.new.user2_id === userId) {
                  updateSessionUser2(userId, true);
                }
              }
            } catch (error) {
              console.error("Error handling event:", error);
            }
          }
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "chat_sessions2",
            // filter: `user1_id=eq.${userId},or,user2_id=eq.${userId}`,
          },
          (payload) => {
            try {
              console.log(`UPDATE event triggered for User ${userId}`);

              if (
                payload.new.user1_id === userId ||
                payload.new.user2_id === userId
              ) {
                console.log("New chat session: ", payload.new.id);
                setChatSessionId(payload.new.id);
                setCurrentAction("chat");
                if (!connectionFound) {
                  setConnectionFound(true);
                  if (payload.new.user1_id === userId) {
                    updateSessionUser1(userId, true);
                  } else if (payload.new.user2_id === userId) {
                    updateSessionUser2(userId, true);
                  }
                }
              }
            } catch (error) {
              console.error("Error handling event:", error);
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

  // const memoizedFetchMessages = useCallback(async () => {
  //   if (chatSessionId !== null) {
  //     const messages = await fetchMessages(chatSessionId);
  //     setMessages(messages);
  //   }
  // }, [chatSessionId]);

  useEffect(() => {
    if (chatSessionId) {
      // memoizedFetchMessages();

      const channel = supabase
        .channel("messages")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
          },
          (payload) => {
            // console.log("1 New message: ", payload.new);
            if (payload.new.chat_session_id === chatSessionId) {
              // console.log("New message: ", payload.new);
              setMessages((messages) => [...messages, payload.new as any]);
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [chatSessionId]);

  const handleSendMessage = async () => {
    const messageData = {
      chat_session_id: chatSessionId,
      user_id: userId,
      content: messageContent,
    };

    setMessageContent("");
    await sendMessage(messageData);
  };

  return (
    <div className="h-screen w-screen flex items-center justify-center">
      {currentAction === "search" ? (
        <h2>SEARCHING ...</h2>
      ) : currentAction === "chat" ? (
        <div className="w-full flex flex-col px-2">
          <button
            className="self-end text-red-500 text-sm"
            onClick={() => {
              if (window.confirm("Are you sure you want to leave?")) {
                setCurrentAction("none");
              }
            }}>
            Leave?
          </button>

          <div className="w-full flex flex-col items-center justify-center bg-blue-900 p-3 rounded-lg gap-5 px-2">
            <h2 className="font-semibold text-white">CHAT</h2>
            <div className="w-full flex flex-col gap-3">
              <div className="w-full min-h-32 h-32 bg-blue-500 rounded-lg p-2 overflow-y-auto text-black">
                {messages.map((message, index) => (
                  <p key={index}>
                    {message.user_id === userId ? "You" : "Stranger"}:{" "}
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
                />
                <button
                  disabled={messageContent === ""}
                  className={`${
                    messageContent === "" ? "bg-gray-700" : " bg-purple-700"
                  } text-white px-3 py-2 rounded-lg`}
                  onClick={handleSendMessage}>
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div>
            <button
              className="px-3 py-2 bg-purple-700 text-white rounded-lg"
              onClick={async () => {
                let input = window.prompt("Please enter your user ID:");
                let parsedUserId = input ? parseInt(input, 10) : null;

                while (parsedUserId !== null && !isNaN(parsedUserId)) {
                  const userExists = await checkIdInQueue(parsedUserId);

                  if (userExists) {
                    console.log(
                      "User ID already exists in the queue. Please enter a different ID."
                    );
                    input = window.prompt("Please enter a different user ID:");
                    parsedUserId = input ? parseInt(input, 10) : null;
                  } else {
                    setUserId(parsedUserId);
                    setCurrentAction("search");
                    addToQueue(parsedUserId);
                    break;
                  }
                }

                if (parsedUserId === null || isNaN(parsedUserId)) {
                  console.log(
                    "Invalid user ID entered or user canceled prompt."
                  );
                }
              }}>
              SEARCH
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default MainComponent;
