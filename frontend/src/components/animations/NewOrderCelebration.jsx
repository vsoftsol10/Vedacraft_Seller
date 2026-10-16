// import { useEffect, useLayoutEffect, useRef, useState } from 'react';
// import confetti from 'canvas-confetti';
// import { Truck } from 'lucide-react';
// import { playTruckSound, playBurstSound, unlockAudioOnFirstTouch } from './orderSound';

// const TRUCK_SPEED = 0.2;
// const MIN_DRIVE_MS = 3500;
// const MAX_DRIVE_MS = 8000;
// const BURST_MS = 1300;
// const TRUCK_SIZE = 30; // keep the same as the parked truck icon size in the header
// const GREENS = ['#2e7d1f', '#4caf2a', '#6cc04a', '#1f5c14', '#9bd67a'];

// // Leaf outline, drawn once and reused as the confetti particle shape.
// const LEAF = confetti.shapeFromPath({
//   path: 'M0 0 C8 -14 28 -14 40 0 C28 14 8 14 0 0 Z',
// });

// /**
//  * The truck is always parked next to the bell (rendered in the header by you).
//  * When `trigger` changes (a new order), a truck drives from the logo to the parked
//  * spot, stops there, green leaves burst in the centre of the dashboard, and then the popup opens.
//  *
//  * Props
//  *  trigger      change this value (e.g. Date.now()) to start
//  *  sellerName   shown in the popup
//  *  logoRef      ref to the logo (sidebar); header's left edge is used if it is hidden
//  *  headerRef    ref to the header element
//  *  parkedRef    ref to the parked truck element beside the bell
//  *  muted        true to silence all sounds
//  *  onViewOrder  called when "View Order" is pressed
//  */
// export default function NewOrderCelebration({
//   trigger,
//   sellerName,
//   logoRef,
//   headerRef,
//   parkedRef,
//   muted = false,
//   onViewOrder,
// }) {
//   const [phase, setPhase] = useState('idle'); // idle | driving | burst | popup
//   const [path, setPath] = useState(null);
//   const truckRef = useRef(null);
//   const buttonRef = useRef(null);
//   const mutedRef = useRef(muted);
//   mutedRef.current = muted;

//   useEffect(() => unlockAudioOnFirstTouch(), []);

//   // The parked truck hides while the moving one is on screen, and returns after.
//   useLayoutEffect(() => {
//     const el = parkedRef?.current;
//     if (!el) return;
//     el.style.opacity = phase === 'driving' || phase === 'burst' ? '0' : '';
//   }, [phase, parkedRef]);

//   // 1. Start: measure positions so it works at any screen width.
//   useEffect(() => {
//     if (!trigger) return;
//     const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
//     const logo = logoRef?.current?.getBoundingClientRect();
//     const header = headerRef?.current?.getBoundingClientRect();
//     const parked = parkedRef?.current?.getBoundingClientRect();

//     if (reduceMotion || !parked) {
//       setPhase('popup');
//       return;
//     }
//     // Desktop: start at the sidebar logo. Mobile (sidebar slid off-screen): header's left edge.
//     const logoVisible = logo && logo.width > 0 && logo.right > 0;
//     const left = logoVisible ? logo.right : (header?.left ?? 0) + 8;
//     const top = parked.top + parked.height / 2 - TRUCK_SIZE / 2;
//     const endLeft = parked.left + parked.width / 2 - TRUCK_SIZE / 2;
//     const dx = Math.max(0, endLeft - left);
//     const duration = Math.min(MAX_DRIVE_MS, Math.max(MIN_DRIVE_MS, dx / TRUCK_SPEED));
//     setPath({ left, top, dx, duration });
//     setPhase('driving');
//   }, [trigger, logoRef, headerRef, parkedRef]);

//   // 2. Drive from the logo to the parked spot, with sound.
//   useEffect(() => {
//     if (phase !== 'driving' || !truckRef.current) return;
//     let cancelled = false;
//     const stopSound = mutedRef.current ? null : playTruckSound(path.duration / 1000);
//     const anim = truckRef.current.animate(
//       [{ transform: 'translateX(0)' }, { transform: `translateX(${path.dx}px)` }],
//       { duration: path.duration, easing: 'ease-in-out', fill: 'forwards' }
//     );
//     anim.finished
//       .then(() => { if (!cancelled) setPhase('burst'); })
//       .catch(() => {});
//     return () => {
//       cancelled = true;
//       anim.cancel();
//       if (stopSound) stopSound();
//     };
//   }, [phase, path]);

//   // 3. Leaf burst in the centre of the dashboard, then open the popup. The truck stays parked.
//   useEffect(() => {
//     if (phase !== 'burst' || !truckRef.current) return;
//     // Burst from the centre of the dashboard (the content area beside the sidebar).
//     const main = headerRef?.current?.parentElement?.getBoundingClientRect();
//     const origin = {
//       x: main ? (main.left + main.width / 2) / window.innerWidth : 0.5,
//       y: 0.5,
//     };
//     if (!mutedRef.current) playBurstSound();

//     const shot = (extra) =>
//       confetti({
//         origin,
//         shapes: [LEAF],
//         colors: GREENS,
//         scalar: 2.2,
//         ticks: 170,
//         gravity: 0.8,
//         zIndex: 9999,
//         disableForReducedMotion: true,
//         ...extra,
//       });
//     shot({ particleCount: 70, spread: 360, startVelocity: 38 });
//     shot({ particleCount: 40, spread: 360, startVelocity: 24, scalar: 1.6 });

//     const t = setTimeout(() => setPhase('popup'), BURST_MS);
//     return () => clearTimeout(t);
//   }, [phase, headerRef]);

//   // 4. Popup: focus the button, close on Escape.
//   useEffect(() => {
//     if (phase !== 'popup') return;
//     buttonRef.current?.focus();
//     const onKey = (e) => { if (e.key === 'Escape') setPhase('idle'); };
//     window.addEventListener('keydown', onKey);
//     return () => window.removeEventListener('keydown', onKey);
//   }, [phase]);

//   const showTruck = (phase === 'driving' || phase === 'burst') && path;

//   return (
//     <>
//       {showTruck && (
//         <div
//           ref={truckRef}
//           className="pointer-events-none fixed z-[9998]"
//           style={{ left: path.left, top: path.top, width: TRUCK_SIZE, height: TRUCK_SIZE }}
//           aria-hidden="true"
//         >
//           <Truck
//             className={`block h-full w-full ${phase === 'driving' ? 'animate-nofx-bounce' : ''}`}
//             color="#2b7a1d"
//             strokeWidth={2}
//           />
//         </div>
//       )}

//       {phase === 'popup' && (
//         <div
//           className="fixed inset-0 z-[9997] grid animate-nofx-fade place-items-center bg-[rgba(20,24,18,0.55)] p-4 motion-reduce:animate-none"
//           onClick={() => setPhase('idle')}
//         >
//           <div
//             className="w-[min(380px,100%)] animate-nofx-pop rounded-2xl bg-white px-7 pb-7 pt-6 text-center shadow-2xl motion-reduce:animate-none"
//             role="dialog"
//             aria-modal="true"
//             aria-labelledby="nofx-title"
//             onClick={(e) => e.stopPropagation()}
//           >
//             <h2 id="nofx-title" className="mb-2 text-lg font-bold text-[#2b7a1d]">
//               <span aria-hidden="true">📦 </span>New Order Received!
//             </h2>
//             <p className="mb-[18px] text-sm leading-normal text-neutral-600">
//               {sellerName
//                 ? `Congratulations, ${sellerName} — you just received a new order.`
//                 : 'Congratulations — you just received a new order.'}
//             </p>
//             <button
//               ref={buttonRef}
//               type="button"
//               className="w-full cursor-pointer rounded-md bg-[#2b7a1d] px-4 py-2.5 font-semibold text-white transition-colors hover:bg-[#226216] focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[#fbb93a]"
//               onClick={() => {
//                 setPhase('idle');
//                 onViewOrder?.();
//               }}
//             >
//               View Order
//             </button>
//           </div>
//         </div>
//       )}
//     </>
//   );
// }
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { Truck } from 'lucide-react';
import { playTruckSound, playBurstSound, unlockAudioOnFirstTouch } from './orderSound';

// Truck speed in pixels per millisecond (lower = slower). The drive time is worked out
// from the distance, so the truck moves at the same calm speed on every screen size.
const TRUCK_SPEED = 0.2;
const MIN_DRIVE_MS = 3500;
const MAX_DRIVE_MS = 8000;
const BURST_MS = 1300;
const TRUCK_SIZE = 30; // keep the same as the parked truck icon size in the header
const GREENS = ['#2e7d1f', '#4caf2a', '#6cc04a', '#1f5c14', '#9bd67a'];

// Leaf outline, drawn once and reused as the confetti particle shape.
const LEAF = confetti.shapeFromPath({
  path: 'M0 0 C8 -14 28 -14 40 0 C28 14 8 14 0 0 Z',
});

/**
 * The truck is always parked next to the bell (rendered in the header by you).
 * When `trigger` changes (a new order), a truck drives from the logo to the parked
 * spot, stops there, green leaves burst in the centre of the dashboard, and then the popup opens.
 *
 * Props
 *  trigger      change this value (e.g. Date.now()) to start
 *  sellerName   shown in the popup
 *  logoRef      ref to the logo (sidebar); header's left edge is used if it is hidden
 *  headerRef    ref to the header element
 *  parkedRef    ref to the parked truck element beside the bell
 *  muted        true to silence all sounds
 *  onViewOrder  called when "View Order" is pressed
 */
export default function NewOrderCelebration({
  trigger,
  sellerName,
  logoRef,
  headerRef,
  parkedRef,
  muted = false,
  onViewOrder,
}) {
  const [phase, setPhase] = useState('idle'); // idle | driving | burst | popup
  const [path, setPath] = useState(null);
  const truckRef = useRef(null);
  const buttonRef = useRef(null);
  const mutedRef = useRef(muted);
  mutedRef.current = muted;

  // Unlock sound on the seller's first click/tap/key press (browsers block audio before that).
  useEffect(() => unlockAudioOnFirstTouch(), []);

  // The parked truck hides while the moving one is on screen, and returns after.
  useLayoutEffect(() => {
    const el = parkedRef?.current;
    if (!el) return;
    el.style.opacity = phase === 'driving' || phase === 'burst' ? '0' : '';
  }, [phase, parkedRef]);

  // 1. Start: measure positions so it works at any screen width.
  useEffect(() => {
    if (!trigger) return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const logo = logoRef?.current?.getBoundingClientRect();
    const header = headerRef?.current?.getBoundingClientRect();
    const parked = parkedRef?.current?.getBoundingClientRect();

    if (reduceMotion || !parked) {
      setPhase('popup');
      return;
    }
    // Desktop: start at the sidebar logo. Mobile (sidebar slid off-screen): header's left edge.
    const logoVisible = logo && logo.width > 0 && logo.right > 0;
    const left = logoVisible ? logo.right : (header?.left ?? 0) + 8;
    const top = parked.top + parked.height / 2 - TRUCK_SIZE / 2;
    const endLeft = parked.left + parked.width / 2 - TRUCK_SIZE / 2;
    const dx = Math.max(0, endLeft - left);
    const duration = Math.min(MAX_DRIVE_MS, Math.max(MIN_DRIVE_MS, dx / TRUCK_SPEED));
    setPath({ left, top, dx, duration });
    setPhase('driving');
  }, [trigger, logoRef, headerRef, parkedRef]);

  // 2. Drive from the logo to the parked spot, with sound.
  useEffect(() => {
    if (phase !== 'driving' || !truckRef.current) return;
    let cancelled = false;
    const stopSound = mutedRef.current ? null : playTruckSound(path.duration / 1000);
    const anim = truckRef.current.animate(
      [{ transform: 'translateX(0)' }, { transform: `translateX(${path.dx}px)` }],
      { duration: path.duration, easing: 'ease-in-out', fill: 'forwards' }
    );
    let finished = false;
    anim.finished
      .then(() => {
        finished = true;
        if (!cancelled) setPhase('burst');
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      // Only cancel if interrupted. Cancelling after a normal finish would snap the truck back to the logo.
      if (!finished) anim.cancel();
      if (stopSound) stopSound();
    };
  }, [phase, path]);

  // 3. Leaf burst in the centre of the dashboard, then open the popup. The truck stays parked.
  useEffect(() => {
    if (phase !== 'burst' || !truckRef.current) return;
    // Burst from the centre of the dashboard (the content area beside the sidebar).
    const main = headerRef?.current?.parentElement?.getBoundingClientRect();
    const origin = {
      x: main ? (main.left + main.width / 2) / window.innerWidth : 0.5,
      y: 0.5,
    };
    if (!mutedRef.current) playBurstSound();

    const shot = (extra) =>
      confetti({
        origin,
        shapes: [LEAF],
        colors: GREENS,
        scalar: 2.2,
        ticks: 170,
        gravity: 0.8,
        zIndex: 9999,
        disableForReducedMotion: true,
        ...extra,
      });
    shot({ particleCount: 70, spread: 360, startVelocity: 38 });
    shot({ particleCount: 40, spread: 360, startVelocity: 24, scalar: 1.6 });

    const t = setTimeout(() => setPhase('popup'), BURST_MS);
    return () => clearTimeout(t);
  }, [phase, headerRef]);

  // 4. Popup: focus the button, close on Escape.
  useEffect(() => {
    if (phase !== 'popup') return;
    buttonRef.current?.focus();
    const onKey = (e) => { if (e.key === 'Escape') setPhase('idle'); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase]);

  const showTruck = (phase === 'driving' || phase === 'burst') && path;

  return (
    <>
      {showTruck && (
        <div
          ref={truckRef}
          className="pointer-events-none fixed z-[9998]"
          style={{ left: path.left, top: path.top, width: TRUCK_SIZE, height: TRUCK_SIZE }}
          aria-hidden="true"
        >
          <Truck
            className={`block h-full w-full ${phase === 'driving' ? 'animate-nofx-bounce' : ''}`}
            color="#2b7a1d"
            strokeWidth={2}
          />
        </div>
      )}

      {phase === 'popup' && (
        <div
          className="fixed inset-0 z-[9997] grid animate-nofx-fade place-items-center bg-[rgba(20,24,18,0.55)] p-4 motion-reduce:animate-none"
          onClick={() => setPhase('idle')}
        >
          <div
            className="w-[min(380px,100%)] animate-nofx-pop rounded-2xl bg-white px-7 pb-7 pt-6 text-center shadow-2xl motion-reduce:animate-none"
            role="dialog"
            aria-modal="true"
            aria-labelledby="nofx-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="nofx-title" className="mb-2 text-lg font-bold text-[#2b7a1d]">
              <span aria-hidden="true">📦 </span>New Order Received!
            </h2>
            <p className="mb-[18px] text-sm leading-normal text-neutral-600">
              {sellerName ? `Congratulations, ${sellerName} — you` : 'Congratulations — you'} just received a new order.
            </p>
            <button
              ref={buttonRef}
              type="button"
              className="w-full cursor-pointer rounded-md bg-[#2b7a1d] px-4 py-2.5 font-semibold text-white transition-colors hover:bg-[#226216] focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[#fbb93a]"
              onClick={() => {
                setPhase('idle');
                onViewOrder?.();
              }}
            >
              View Order
            </button>
          </div>
        </div>
      )}
    </>
  );
}
