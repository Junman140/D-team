import type { OnSetImage } from "@/features/media/on-set-images";

export function OnSetGrid({ images, limit = 6 }: { images: OnSetImage[]; limit?: number }) {
  return (
    <div className="on-set-grid">
      {images.slice(0, limit).map((image, index) => (
        <figure className={`on-set-item on-set-item-${index + 1}`} key={image.id}>
          <img
            alt={image.alt}
            height={image.height}
            loading="lazy"
            sizes="(max-width: 760px) 45vw, 30vw"
            src={image.src}
            srcSet={image.srcSet}
            width={image.width}
          />
        </figure>
      ))}
    </div>
  );
}
