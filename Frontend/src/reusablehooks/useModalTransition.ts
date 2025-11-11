import { useEffect, useRef, useState } from "react";

/**
 * Smooth enter/exit modal transition controller.
 * - Keeps the component mounted during exit for animation.
 * - Forces a fresh "enter" transition every time `show` flips to true via `openKey`.
 *
 * @param show whether the modal should be visible
 * @param duration ms to keep mounted during exit (must match CSS transition)
 */
export function useModalTransition(show: boolean, duration = 320) {
  const [mounted, setMounted] = useState<boolean>(show);
  const [phase, setPhase] = useState<"idle" | "enter" | "exit">(show ? "enter" : "idle");

  // increments every time we open -> useful as React "key" to restart CSS transitions
  const openTickRef = useRef(0);

  useEffect(() => {
    if (show) {
      // mount first, reset to idle so the next frame can switch to enter
      setMounted(true);
      setPhase("idle");
      const id = requestAnimationFrame(() => {
        openTickRef.current += 1;
        setPhase("enter");
      });
      return () => cancelAnimationFrame(id);
    }

    // when hiding, play exit then unmount after duration
    if (mounted) {
      setPhase("exit");
      const t = setTimeout(() => setMounted(false), duration);
      return () => clearTimeout(t);
    }
  }, [show, mounted, duration]);

  return { mounted, phase, openKey: openTickRef.current };
}




// // src/hooks/useModalTransition.ts
// import { useEffect, useState } from "react";

// /** Keeps the modal mounted during close so we can animate out */
// export function useModalTransition(show: boolean, duration = 320) {
//   const [mounted, setMounted] = useState(show);
//   const [phase, setPhase] = useState<"enter" | "idle" | "exit">(show ? "enter" : "idle");
  

//   useEffect(() => {
//     if (show) {
//       // mount, then switch to "enter" for CSS to pick up
//       setMounted(true);
//       // next tick so CSS transitions can apply
//       const id = requestAnimationFrame(() => setPhase("enter"));
//       return () => cancelAnimationFrame(id);
//     } else if (mounted) {
//       // play exit then unmount after duration
//       setPhase("exit");
//       const t = setTimeout(() => setMounted(false), duration);
//       return () => clearTimeout(t);
//     }
//   }, [show, mounted, duration]);

//   return { mounted, phase };
// }
