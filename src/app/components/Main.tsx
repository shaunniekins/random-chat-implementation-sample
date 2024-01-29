"use client";

import { addToQueue } from "@/api/userQueue";
import { useEffect, useState } from "react";
import { supabase } from "../../../utils/supabase";

const MainComponent = () => {
  const [currentAction, setCurrentAction] = useState("none"); // none, search, chat
  const [leave, setLeave] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);

  useEffect(() => {
    if (userId) {
      const channel = supabase
        .channel("chat_sessions2")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "chat_sessions2",
          },
          (payload) => {
            if (
              payload.new.user1_id === userId ||
              payload.new.user2_id === userId
            ) {
              console.log("New chat session: ", payload.new);
              setCurrentAction("chat");
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [userId]);

  return (
    <div className="h-screen w-screen flex items-center justify-center">
      {currentAction === "search" ? (
        <h2>SEARCHING ...</h2>
      ) : currentAction === "chat" ? (
        <div className="flex flex-col">
          <button
            className="self-end text-red-200 text-sm"
            onClick={() => {
              if (window.confirm("Are you sure you want to leave?")) {
                setCurrentAction("none");
              }
            }}>
            Leave?
          </button>

          <div className="flex flex-col items-center justify-center bg-blue-900 p-3 rounded-lg gap-5 ">
            <h2 className="font-semibold">CHAT</h2>
            <div className="chat-container flex flex-col gap-3">
              <div className="chat-history min-h-32 h-32 bg-blue-500 rounded-lg p-2 overflow-y-auto">
                <p>User1: Hello</p>
                <p>User2: Hi there!</p>
                <p>User2: Hi there!</p>
              </div>
              <div className="chat-input flex gap-3">
                <input
                  className="text-black px-2 py-3 rounded-lg"
                  type="text"
                  placeholder="Type your message here..."
                />
                <button className="bg-purple-700 text-white px-3 py-2 rounded-lg">
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
              onClick={() => {
                const input = window.prompt("Please enter your user ID:");
                const parsedUserId = input ? parseInt(input, 10) : null;

                if (parsedUserId !== null && !isNaN(parsedUserId)) {
                  setUserId(parsedUserId);
                  setCurrentAction("search");
                  addToQueue(parsedUserId);
                } else {
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
