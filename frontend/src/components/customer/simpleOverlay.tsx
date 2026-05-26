import { ReactNode, RefObject, useEffect } from "react";

interface SimpleOverlayProps {
  targetRef: RefObject<HTMLElement | null>;  // element to attach overlay
  show: boolean;                      // control visibility
  children: ReactNode;                 // overlay content
  placement?: "top" | "bottom" | "left" | "right"; // position of overlay
  offset?: number;                    // spacing between target & overlay
  offSetY?: number;
  onHide: () => void;
}

export default function SimpleOverlay({
  targetRef,
  show,
  children,
  placement = "bottom",
  offset = 8,
  offSetY = 100,
  onHide
}: SimpleOverlayProps) {

    // useEffect(() => {
    // function handleClickOutside(event: MouseEvent) {
    //     onHide();
    // }
    // document.addEventListener("mousedown", handleClickOutside);
    // return () => document.removeEventListener("mousedown", handleClickOutside);
    // }, []);

  if (!show || !targetRef.current) return null;

  const rect = targetRef.current.getBoundingClientRect();

  // Calculate position styles
  let top = 0;
  let left = 0;

  switch (placement) {
    case "top":
      top = rect.top + window.scrollY - offset;
      left = rect.left + window.scrollX;
      break;
    case "bottom":
      top = rect.bottom + window.scrollY + offset;
      left = rect.left + window.scrollX - offSetY ;
      break;
    case "left":
      top = rect.top + window.scrollY;
      left = rect.left + window.scrollX - offset;
      break;
    case "right":
      top = rect.top + window.scrollY;
      left = rect.right + window.scrollX + offset;
      break;
  }

  return (
    <div
      className="absolute z-50 p-2 rounded-md shadow-lg bg-white border"
      style={{ top, left }}
    >
      {children}
    </div>
  );
}
