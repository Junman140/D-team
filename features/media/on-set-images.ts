export type OnSetImage = {
  id: string;
  alt: string;
  width: number;
  height: number;
  src: string;
  srcSet: string;
};

function image(id: string, alt: string, width: number, height: number): OnSetImage {
  return {
    id,
    alt,
    width,
    height,
    src: `/media/on-set/${id}-960.webp`,
    srcSet: `/media/on-set/${id}-480.webp 480w, /media/on-set/${id}-960.webp 960w, /media/on-set/${id}-1600.webp 1600w`,
  };
}

// Supplied crew photography, generated as responsive WebP derivatives by
// scripts/generate-site-media.py. Publication approval and credits still
// pending with the client before launch.
export const onSetImages: OnSetImage[] = [
  image("cam", "Two camera operators filming an evening session beneath lit canopies.", 1600, 1067),
  image("cam1", "Camera operator filming a large tented congregation from a raised position.", 1600, 1067),
  image("cam2", "Camera crew filming a worship performance from among the crowd.", 1600, 1067),
  image("maincameras", "Two principal camera operators comparing framed shots on tripod rigs.", 1600, 1067),
  image("light1", "Production lead standing over the program and lighting control desk.", 1600, 1067),
  image("setup2", "Two crew members hoisting a large display screen onto its stand during setup.", 1600, 1236),
  image("sound", "Hands riding a digital mixing console during a live session.", 1600, 1067),
  image("soundengineer", "Sound engineer supervising the front-of-house mix at a live event.", 1600, 1067),
  image("inhouse1", "Operator monitoring the streamed program feed from the control room.", 1600, 1084),
  image("livestream1", "Live-stream control desk glowing in the dark across audio and video stations.", 1600, 1067),
  image("edit3", "Editor's laptop displaying a wall of edited highlight covers from the session.", 1600, 1067),
  image("checkup", "Two crew members running a gear check over a laptop mid-session.", 1600, 1067),
];

export const onSetGallery = onSetImages;
export const onSetFeature = onSetImages[0];
