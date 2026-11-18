import { createRoot } from "react-dom/client";
import AutoplayVideo from "@/components/ui/video/autoplay-video";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <main>
    <div className="spacer">Contenido anterior</div>
    <section id="native" aria-label="Video subido">
      <AutoplayVideo
        type="upload"
        src="https://media.example.test/demo.mp4"
        loop
        unsupportedMessage="Video no compatible"
      />
    </section>
    <div className="spacer">Contenido intermedio</div>
    <section id="youtube" aria-label="Video de YouTube">
      <AutoplayVideo
        type="youtube"
        youtubeId="video-autoplay-test"
        loop
        title="Video de prueba"
      />
    </section>
    <div className="spacer">Contenido posterior</div>
  </main>,
);
