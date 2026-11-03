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
      <path d="M57 40v80" />
      <path fill={wash} d="M51 120h12v11H51z" />
      <path fill={paper} d="M25 153q6-23 31-25 25 1 32 25z" />
      <path d="M22 154h69m-41 2q7 10 14 0" />
      <path fill={wash} d="M148 336h356l9 7H140z" />
      <path fill={paper} d="M148 343h358v43H148z" />
      <path fill={wash} d="M153 386h348v6H153z" />
      <g className={styles.detail}>
        {Array.from({ length: 23 }, (_, i) => (
          <path key={i} d={`M${161 + i * 15} 350v29`} />
        ))}
      </g>
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
      <path fill={wash} d="m24 367 11-7h75l7 7v22H24z" />
      <path fill={paper} d="M24 367h93v22H24z" />
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
      <path fill={wash} d="m390 356 11-8h96l10 8v33H390z" />
      <path fill={paper} d="M390 356h117v33H390z" />
      <path fill={wash} d="m420 340 2-26h34l4 26z" />
      <path d="M429 315v-6q0-11 10-11t10 11v6m-28 25h41" />
      <path
        className={styles.detail}
        d="m468 318 12-12m-4 17 11-11M36 375h22"
      />
    </>
  );
}

const furniture = {
  office: Office,
  store: Store,
  pharmacy: Pharmacy,
  restaurant: Restaurant,
  window: ShopWindow,
};

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
