import React, { useCallback, useEffect, useState } from "react";
import LiveCursors from "./cursor/LiveCursors";
import { useBroadcastEvent, useEventListener, useMyPresence, useOthers } from "@/liveblocks.config";
import CursorChat from "./cursor/CursorChat";
import { CursorMode, CursorState, Reaction, ReactionEvent } from "@/types/type";
import ReactionSelector from "./reaction/ReactionButton";
import FlyingReaction from "./reaction/FlyingReaction";
import useInterval from "@/hooks/useInterval";
import { Comments } from "./comments/Comments";
type Props = {
  canvasRef: React.MutableRefObject<HTMLCanvasElement | null>;
}

const Live = ({ canvasRef }: Props) => {
  const others = useOthers(); //Returns All the other users connected to the same Room
  const [{ cursor }, updateMyPresence] = useMyPresence() as any; //Returns the current user's presence

  const [cursorState, setCursorState] = useState<CursorState>({
    mode: CursorMode.Hidden,
  })

  const [reactions, setReaction] = useState<Reaction[]>([])

  const broadcast = useBroadcastEvent(); //Returns a function to broadcast an event to all the users in the room
  useInterval(()=>{
    setReaction((reaction)=> reaction.filter((r)=> r.timestamp >Date.now() - 4000))
  },1000);

  useInterval(()=>{
    if(cursorState.mode === CursorMode.Reaction && cursorState.isPressed && cursor){
      setReaction((reactions)=> reactions.concat(
        [
          { 
            point: { x: cursor.x, y: cursor.y },
            value: cursorState.reaction,
            timestamp: Date.now()
          }
        ]
      ))
      broadcast({
        x: cursor.x,
        y: cursor.y,
        value: cursorState.reaction,
      })
    }
  },100);

  useEventListener((eventData)=>{
    const event = eventData.event as ReactionEvent;
    setReaction((reactions)=> reactions.concat(
      [
        { 
          point: { x: event.x, y: event.y },
          value: event.value,
          timestamp: Date.now()
        }
      ]
    ))
  })

  //   Updates the cursor position when the pointer moves
  const handlePointerMove = useCallback((event: React.PointerEvent) => {
    event.preventDefault();
    if(cursor === null || cursorState.mode !== CursorMode.ReactionSelector) {
        // Subtracting position of the cursor relative to the window
      const x = event.clientX - event.currentTarget.getBoundingClientRect().x;
      const y = event.clientY - event.currentTarget.getBoundingClientRect().y;

      updateMyPresence({ cursor: { x, y } });
    };
  }, []);

  //   Hides the cursor when the pointer leaves the window
  const handlePointerLeave = useCallback((event: React.PointerEvent) => {
    setCursorState({ mode: CursorMode.Hidden });
    updateMyPresence({ cursor: null, message: null });
  }, []);

  //   Updates the cursor position when the pointer back on the window
  const handlePointerDown = useCallback((event: React.PointerEvent) => {
    // Subtracting position of the cursor relative to the window
    const x = event.clientX - event.currentTarget.getBoundingClientRect().x;
    const y = event.clientY - event.currentTarget.getBoundingClientRect().y;

    updateMyPresence({ cursor: { x, y } });
    setCursorState((state: CursorState)=> cursorState.mode === CursorMode.Reaction ? {...state, isPressed: true} : state);
  }, [cursorState.mode, setCursorState]);


  const handlePointerUp = useCallback((event: React.PointerEvent) => {
    setCursorState((state: CursorState)=> cursorState.mode === CursorMode.Reaction ? {...state, isPressed: true} : state);
  }, [cursorState.mode, setCursorState]);

  useEffect(() => {
    const onKeyUp = (e: KeyboardEvent) => {
        if (e.key === "/") {
            setCursorState({ 
                mode: CursorMode.Chat,
                previousMessage: null,
                message: "",
            });
        }
        else if (e.key === "Escape") {
            updateMyPresence({ message: '' });
            setCursorState({ mode: CursorMode.Hidden });
        }
        else if (e.key === "e") {
          setCursorState({mode: CursorMode.ReactionSelector});
      }
    }
    const onKeyDown = (e: KeyboardEvent) => {
        if (e.key === "/") {
            e.preventDefault();
        }
    }
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('keydown', onKeyDown);
    return () => {
        window.removeEventListener('keyup', onKeyUp);
        window.removeEventListener('keydown', onKeyDown);
    }
  }, [updateMyPresence])

  const setReactions = useCallback((reaction: string)=>{
    setCursorState({ mode: CursorMode.Reaction, reaction, isPressed: false });
  },[])

  return (
    <div
      id="canvas"
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      className=" relative h-full w-full flex flex-1 justify-center items-center "
    >
      <canvas ref={canvasRef} />

      {reactions.map((r) =>(
      <FlyingReaction 
        key={r.timestamp.toString()}
        x={r.point.x}
        y={r.point.y}
        timestamp={r.timestamp}
        value={r.value}
      />
      ))}
      {cursor && (
        <CursorChat
            cursor={cursor}
            cursorState={cursorState}
            setCursorState={setCursorState}
            updateMyPresence={updateMyPresence}
        />
      )}
      {cursorState.mode === CursorMode.ReactionSelector && (
        <ReactionSelector
          setReaction={setReactions}
        />
      )}
      <LiveCursors others={others} />

      <Comments />
    </div>
  );
};

export default Live;
