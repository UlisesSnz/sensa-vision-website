import { useId } from "react";
import type { HeroScene } from "@/lib/hero-screen";
import { AnimatedRoom } from "./room-motion";
import styles from "./screen.module.css";

const paper = "var(--room-paper)";
const wash = "var(--room-wash)";
const ink = "var(--room-ink)";

function Office() {
  return (
    <>
      {/* A bentwood sofa, with the cushions sitting inside its upholstered arms. */}
      <path
        fill={wash}
        d="M256 349v-24q0-18 17-18h171q17 0 17 18v28l-8 19H265z"
      />
      <g fill={paper}>
        <rect x="267" y="315" width="88" height="39" rx="10" />
        <rect x="356" y="315" width="93" height="39" rx="10" />
        <path d="M262 349q35-4 92-2l4 4 3-4q56-2 89 2v12H262z" />
        <path d="M251 342q8-3 12 5l4 12h182l4-12q4-9 12-5 6 3 4 10l-7 21H257l-9-21q-2-7 3-10z" />
      </g>
      <path fill={wash} d="M258 374h202l-3 6H262z" />
      <path fill={ink} d="m267 380-4 12h4l7-12m170 0 7 12h4l-4-12" />
      <g className={styles.officePlant}>
        <g fill="none" data-room-poster="">
          <path d="M78 349q3-50-16-96m17 88q0-73 17-107m-19 93q-7-32-36-53m38 65q13-36 36-51" />
          <path
            fill={wash}
            d="M62 259q-21-8-23-33 25 7 25 29zM91 251q-2-24 15-38 4 26-15 38zM53 285q-23-1-32-24 22 0 32 24zM86 300q3-26 25-36-1 22-25 36zM102 300q14-21 31-19-9 19-31 19zM76 307q-22-8-25-32 21 8 25 32z"
          />
        </g>
        <path fill={paper} d="M54 341h50l-6 44q-1 7-8 7H68q-7 0-8-7z" />
        <path fill={wash} d="M52 338h54v8H52z" />
        <path className={styles.detail} d="m63 352 4 29m4-29 3 22m4-22 1 15" />
      </g>
    </>
  );
}

function Store() {
  return (
    <>
      <g fill={paper}>
        <rect x="19" y="202" width="67" height="187" rx="5" />
        <path fill={wash} d="M21 207q0-3 3-3h57q3 0 3 3v18H21z" />
        <rect x="25" y="231" width="55" height="139" rx="2" />
        <path d="M27 275h49m-49 42h49m-49 42h49m-5-71v12" />
        {[247, 289, 331].map((y) => (
          <g
            key={y}
            transform={`translate(30 ${y})`}
            fill={wash}
            strokeWidth="1.3"
          >
            <path d="M1 25V12l3-4V2h5v6l3 4v13zM18 25V12l3-4V2h5v6l3 4v13z" />
            <path d="M36 10h8v15h-8z" />
          </g>
        ))}
        <path
          className={styles.detail}
          d="M31 378h27m-27 4h27m10-2h5M30 237l8-5"
        />
        <path d="M23 389v3m58-3v3" />
      </g>
      <g fill={paper}>
        <path fill={wash} d="M278 332h261v7H278zm-6 43h273v8H272z" />
        <path d="M282 339v36m249-36v36m-251 8v9m255-9v9" />
        {[290, 314, 338].map((x) => (
          <g key={x} transform={`translate(${x} 304)`}>
            <path fill={wash} d="m0 26 2-21h15l3 21z" />
            <path d="M2 5V1h15v4m-11 9h7" />
          </g>
        ))}
        {[393, 413, 433, 453].map((x) => (
          <g key={x} transform={`translate(${x} 308)`}>
            <rect x="0" y="5" width="15" height="19" rx="3" />
            <path fill={wash} d="M1 1h13v5H1z" />
          </g>
        ))}
        <path
          fill={wash}
          d="M291 350h40v24h-40zm48 3h42v21h-42zm79-8h32v29h-32zm36 0h32v29h-32z"
        />
        <path
          className={styles.detail}
          d="M299 355h12m37 4h10m68-7h15m22 0h15"
        />
        <g data-room-poster="" transform="translate(507 335)">
          <path fill={wash} d="M-5 8l8 2 5 6-4 15-18-4 4-15z" />
          <path fill="none" strokeWidth="1.4" d="M0 0l-3 10m0 2h1m-5 6 11 2m-12 2 7 2" />
        </g>
      </g>
    </>
  );
}

function Pharmacy() {
  return (
    <>
      <g fill={paper}>
        <path fill={wash} d="M23 254h60v6H23zm-5 46h65v6H18z" />
        <path d="M28 231h13v22H28zm17-7h14v29H45zm20 12h11v17H65zM23 281h14v18H23zm18-6h13v24H41z" />
        <path d="M61 298v-13q0-3 3-5v-4h8v4q3 2 3 5v13z" />
        <path
          className={styles.detail}
          d="M29 237h11m7-6h10m8 12h10m-52 45h12m8-6h9m12 8h8M30 260v5m45-5v5m-49 41v5m49-5v5"
        />
        <path fill={wash} d="M186 329h287l15 8H174z" />
        <path d="M179 337h304v51H179z" />
        <path fill={wash} d="M187 388h289v5H187z" />
        <path d="M188 343h188v38H188z" strokeWidth="1.2" />
        <path className={styles.detail} d="M197 349h78m-78 4h39" />
        <path fill="none" opacity=".4" strokeWidth="1.5" d="M279 365h13l4-4 5 6 7-17 7 24 6-11 6 2h31" />
        <path fill={wash} d="M412 347h9v8h8v9h-8v8h-9v-8h-8v-9h8z" />
        <path d="m228 328 14-18h21l4 18zm13-15h15m-17 4h12" />
        {[358, 376].map((x) => (
          <g key={x} transform={`translate(${x} 309)`}>
            <rect x="0" y="5" width="13" height="15" rx="3" />
            <path fill={wash} d="M2 1h9v5H2z" />
          </g>
        ))}
      </g>
    </>
  );
}

function Restaurant() {
  return (
    <>
      <g transform="translate(-6 6) scale(0.85)">
        <path d="M57 40v80" />
        <path fill={wash} d="M51 120h12v11H51z" />
        <path fill={paper} d="M25 153q6-23 31-25 25 1 32 25z" />
        <path d="M22 154h69m-41 2q7 10 14 0" />
      </g>
      <path fill={wash} d="M148 351h356l9 7H140z" />
      <path fill={paper} d="M148 358h358v28H148z" />
      <path fill={wash} d="M153 386h348v6H153z" />
      <g className={styles.detail}>
        {Array.from({ length: 23 }, (_, i) => (
          <path key={i} d={`M${161 + i * 15} 363v16`} />
        ))}
      </g>
      <g className={styles.tableware}>
        <path fill={paper} d="M342 327q4-27 38-29 30 1 38 29z" />
        <circle fill={wash} cx="380" cy="294" r="4" />
        <path fill={wash} d="M333 328h92l-6 6h-79z" />
        <path className={styles.detail} d="M351 320q7-11 18-15" />
        <path
          fill={paper}
          d="M201 318h25l-2 10q-2 6-10 6t-11-6zm25 2h4q7 0 3 6-2 3-9 2"
        />
        <path d="M196 334h37" />
        <path data-room-poster="" d="M207 315c-5-4 2-7 1-11 0-2-2-3-3-5m12 16c-3-4 2-6 2-9 0-2-1-3-2-4" />
      </g>
    </>
  );
}

function ShopWindow() {
  return (
    <>
      <path
        className={styles.detail}
        d="M17 88v292m4-20v19h31"
      />
      <path className={styles.detail} d="M590 54l30-30m-29 46 33-33m-17 37 14-14" />
      <g className={styles.mannequin}>
        <path fill={wash} d="m24 367 11-7h75l7 7v22H24z" />
        <path fill={paper} d="M24 367h93v22H24z" />
        <path className={styles.detail} d="M36 375h22" />
        <path d="M71 304v55m-12 1h24" />
        <path
          fill={wash}
          d="m62 218 3-10h12l3 10 16 7-6 23-5 11q-2 7 2 19l6 23q-19 10-43 0l6-25q3-12 1-17l-6-14-5-20z"
        />
        <path fill={paper} d="M65 204h12v5H65z" />
        <circle fill={paper} cx="71" cy="200" r="4" />
        <path
          className={styles.detail}
          d="M71 221v79m-14-39q13 4 28 0m-36-33 9 14"
        />
        <path
          className={styles.detail}
          data-room-poster=""
          d="M43 267l30-30m-29 46 33-33m-17 37 14-14"
        />
      </g>
      <path fill={wash} d="m390 367 11-7h96l10 7v22H390z" />
      <path fill={paper} d="M390 367h117v22H390z" />
      <path fill={wash} d="m420 364 2-26h34l4 26z" />
      <path d="M429 339v-6q0-11 10-11t10 11v6" />
      <path
        className={styles.detail}
        d="m468 342 12-12m-4 17 11-11"
      />
    </>
  );
}

function Home() {
  const hdmiFade = useId();
  return (
    <>
      <defs>
        <linearGradient id={hdmiFade} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="40" y2="0">
          <stop offset="0" stopColor={ink} stopOpacity="0" />
          <stop offset="1" stopColor={ink} />
        </linearGradient>
      </defs>
      <path
        className={styles.detail}
        stroke={`url(#${hdmiFade})`}
        d="M101 196c-17 1-23 8-23 26v113c0 16-7 23-22 23H-2"
      />

      {/* Open steel uprights and the thin edges of the four wooden shelves. */}
      <g fill={wash}>
        <path d="m541 100 10-5h80l-8 5zm0 0h82v5h-82zm82 0 8-5v5l-8 5z" />
        <path d="M541 105h3v288h-3zm81 0h3v288h-3zm7-5h2v284h-2z" />
        {[229, 278, 372].map((y) => (
          <path key={y} transform={`translate(0 ${y})`} d="m541 0 10-4h80l-8 4zm0 0h82v4h-82zm82 0 8-4v4l-8 4z" />
        ))}
      </g>
      <g fill={paper}>
        {/* Controller, books and a small cylindrical access point. */}
        <g transform="translate(0 18)">
          <path d="M548 206q1-10 6-12l5 2 5-2q5 0 8 12 0 4-4 2l-4-4h-8l-4 4q-4 2-4-2z" />
          <path d="M583 181h7v28h-7zm8-4h7v32h-7zm9 9 7-2 6 23-7 2z" />
          <path className={styles.detail} d="M552 199h5m-2-2v5m9-2h2m18-14h5m3-4h5" />
        </g>
        <path d="M594 253q0-4 8-4t8 4v19q0 3-8 3t-8-3z" />
        <path className={styles.detail} d="M595 253q7 3 14 0m-9 17h3" />
      </g>
      {/* The pulse in motion/home.json follows this lead from the strip to the TV. */}
      <path
        className={styles.detail}
        d="M556 261C556 255 554 251 548 251H544C536 251 532 247 532 239V204C532 192 529 187 518 187H505"
      />
      <rect x="547" y="265" width="41" height="10" rx="2.5" fill={paper} />
      <path fill={wash} d="M552 264q0-3 3-3h3q3 0 3 3v5h-9z" />
      <path d="M568 268v3m3-3v3m7-3v3m3-3v3" strokeWidth="1.4" />
      {/* The bag rests its weight on the bottom shelf. */}
      <path d="M566 314q-4-22 8-22 13 0 10 17m-22 9q-14 11-12 31l3 14" />
      <path fill={wash} d="M558 327q1-21 20-24 18 0 23 21l5 31q2 13-10 15h-30q-12-1-11-13z" />
      <path fill={paper} d="M562 341q15-6 32-1l4 20q-16 6-37 2z" />
      <path className={styles.detail} d="M561 330q1-16 17-21 15-1 19 15m-33 21q13-4 28-2m-19 4-1 7m28-21 5 3" />
    </>
  );
}

function Education() {
  return (
    <>
      {/* A globe on the classroom bookcase, with a fixed tilted cradle. */}
      <circle cx="58" cy="252" r="20" fill={wash} />
      <g transform="translate(58 252) rotate(16)">
        <ellipse data-room-poster="" rx="10" ry="20" />
        <path className={styles.detail} d="M-19-6q18 8 38 0m-35 17q15 5 31 0" />
        <path d="M0-24a24 24 0 0 1 0 48m0-51v7m0 40v7" />
      </g>
      <path d="M51 276v9m-13 6q2-6 13-6t13 6z" fill={paper} />
      <path fill={wash} d="M18 292h67v5H18zm3 46h61v5H21zm0 46h61v5H21z" />
      <path d="M22 297v95m59-95v95" />
      <g fill={paper}>
        <path d="M28 311h7v26h-7zm8-4h7v30h-7zm11 6 7-2 6 24-7 2zM27 377h29v6H27zm3-6h30v6H30z" />
        <path className={styles.detail} d="M29 318h5m4-5h4m-9 67h19" />
      </g>
      {[169, 357].map((x) => (
        <g key={x} transform={`translate(${x} 0)`}>
          <path fill={wash} d="m2 333 9-5h123l7 5v6H2z" />
          <path d="M11 339 7 391m121-52 4 52M13 348h111" />
          <path className={styles.detail} d="m98 328 7-5 13 1 9-2 5 5m-14-3 1 3" />
          {/* The chair faces the desk. Its rear uprights overlap the seat and backrest. */}
          <g transform="translate(71.5 0)">
            <path d="M-12 346l-2 35M12 346l2 35" />
            <path fill={wash} d="M-16 344h32q2 0 3 3l4 10q1 3-3 3h-40q-4 0-3-3l4-10q1-3 3-3z" />
            <path fill={paper} d="M-25 324q0-5 5-5h40q5 0 5 5l-2 20q0 5-5 5h-36q-5 0-5-5z" />
            <path d="M-17 336v24l-4 32M17 336v24l4 32" />
            <circle cx="-17" cy="336" r="1.5" fill={ink} />
            <circle cx="17" cy="336" r="1.5" fill={ink} />
          </g>
        </g>
      ))}
    </>
  );
}

function Manufacturing() {
  return (
    <>
      {/* The arm is bolted to a plinth beside the packing line. */}
      <path fill={wash} d="M55 386h86v6H55zm7-19h70v19H62zm9 0 6-14h39l7 14z" />
      <path fill={paper} d="M82 342l42-31 14 13-37 35q-12 11-21 0-6-9 2-17z" />
      <circle cx="91" cy="350" r="11" fill={wash} />
      <circle cx="91" cy="350" r="4" />
      <path className={styles.detail} d="m99 344 26-21m-55 52h25m-25 4h17" />
      <g data-room-poster="" transform="translate(133 317)">
        <path fill={wash} d="m-5-7 8-3 65 8 9 6-3 9-8 2-71-13z" />
        <path d="m10-4 51 7m6 12v7h9v-7m-9 7-5 6 3 5m11-11 5 6-3 5" />
        <circle cx="70" cy="5" r="6" fill={paper} />
      </g>
      <circle cx="133" cy="317" r="9" fill={paper} />
      <circle cx="133" cy="317" r="3" fill={wash} />
      <g fill={paper}>
        <rect x="174" y="353" width="332" height="23" rx="11.5" fill={wash} />
        {[190, 225, 260, 295, 330, 365, 400, 435, 470, 491].map((x) => (
          <circle key={x} cx={x} cy="364" r="5" />
        ))}
        <path d="m196 376-3 16h8l5-16m270 0 5 16h8l-3-16" />
        <path d="M192 339h23v13h-23zM317 321h47v31h-47zm56 8h35v23h-35z" />
        <path fill={wash} d="M336 321h8v10l-4-2-4 2zm50 8h7v8h-7z" />
        <path className={styles.detail} d="M322 345h11m-11 3h7m62-2h9" />
      </g>
    </>
  );
}

function Healthcare() {
  return (
    <>
      {/* Gravity-fed IV on a wheeled stand. */}
      <path d="M40 379V177q0-7 7-7h19q5 0 5 5v4m-31 9h5m-5 190-18 10m18-10 20 10m-20-10v12" />
      <g fill={paper}>
        <circle cx="22" cy="390" r="2.5" /><circle cx="60" cy="390" r="2.5" />
        <rect x="57" y="182" width="28" height="44" rx="7" />
        <path d="M67 182v-4h8v4m-9 45v5h9v-5m-11 5h14l-2 22h-10z" />
        <path fill={wash} d="M59 201q6-3 12 0t12 0v18q-1 5-6 5H65q-6 0-6-6z" />
        <path className={styles.detail} d="M62 191h6m-6 4h4" />
      </g>
      <path data-room-poster="" d="M71 238v3" strokeWidth="2.6" />
      <path className={styles.detail} d="M71 255v54q0 34 30 34h79q14 0 18 8" />
      {/* Articulated exam couch, paper roll, lift and pull-out step. */}
      <path fill={wash} d="m177 327 8-12 66 30h227v9H248z" />
      <path fill={paper} d="M177 315q-5-3-2-8l2-4q2-4 7-2l65 31q4 2 2 7l-3 5z" />
      <path fill={paper} d="M253 331h221q6 0 6 6v7H250v-9q0-4 3-4z" />
      <path fill={wash} d="m182 302 5-5q2-2 6 0l21 10q3 2 1 5l-3 4z" />
      <path d="m288 354 49 24m28-24-36 23m-46 3h100" />
      <path fill={wash} d="M272 380h121l8 6v3H264v-3z" />
      <circle cx="277" cy="390" r="3" fill={paper} /><circle cx="387" cy="390" r="3" fill={paper} />
      <path fill={paper} d="M424 371h58v6h-58zm4 6-2 14m51-14 3 14" />
      <path className={styles.detail} d="M431 368h43m-9-36v13q4 4 9 1m-26 3h12" />
    </>
  );
}

const furniture = {
  office: Office,
  store: Store,
  pharmacy: Pharmacy,
  restaurant: Restaurant,
  window: ShopWindow,
  home: Home,
  education: Education,
  manufacturing: Manufacturing,
  healthcare: Healthcare,
} satisfies Record<HeroScene, () => React.JSX.Element>;

export default function ScreenRooms({ scenes }: { scenes: HeroScene[] }) {
  return (
    <div aria-hidden="true" className={styles.drawing}>
      <svg viewBox="0 0 640 410" className={styles.floor} focusable="false">
        <path d="M8 393h621m-606 5h85m406 0h98" />
      </svg>
      {scenes.map((scene) => {
        const Furniture = furniture[scene];
        return (
          <AnimatedRoom key={scene} scene={scene}>
            <svg viewBox="0 0 640 410" focusable="false">
              <Furniture />
            </svg>
          </AnimatedRoom>
        );
      })}
    </div>
  );
}
