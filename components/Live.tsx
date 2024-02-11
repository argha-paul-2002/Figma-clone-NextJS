import React, { useCallback } from "react";
import LiveCursors from "./cursor/LiveCursors";
import { useMyPresence, useOthers } from "@/liveblocks.config";

const Live = () => {
  const others = useOthers(); //Returns All the other users connected to the same Room
  const [{ cursor }, updateMyPresence] = useMyPresence() as any; //Returns the current user's presence

  //   Updates the cursor position when the pointer moves
  const handlePointerMove = useCallback((event: React.PointerEvent) => {
    event.preventDefault();
    // Subtracting position of the cursor relative to the window
    const x = event.clientX - event.currentTarget.getBoundingClientRect().x;
    const y = event.clientY - event.currentTarget.getBoundingClientRect().y;

    updateMyPresence({ cursor: { x, y } });
  }, []);

  //   Hides the cursor when the pointer leaves the window
  const handlePointerLeave = useCallback((event: React.PointerEvent) => {
    event.preventDefault();
    updateMyPresence({ cursor: null, message: null });
  }, []);

  //   Updates the cursor position when the pointer back on the window
  const handlePointerDown = useCallback((event: React.PointerEvent) => {
    // Subtracting position of the cursor relative to the window
    const x = event.clientX - event.currentTarget.getBoundingClientRect().x;
    const y = event.clientY - event.currentTarget.getBoundingClientRect().y;

    updateMyPresence({ cursor: { x, y } });
  }, []);

  return (
    <div
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onPointerDown={handlePointerDown}
      className="h-[100vh] w-full flex justify-center items-center text-center"
    >
      <h1 className="text-2xl text-white">Clone</h1>
      <LiveCursors others={others} />
    </div>
  );
};

export default Live;
