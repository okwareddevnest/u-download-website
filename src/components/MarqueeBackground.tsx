import { ThreeDMarquee } from './ui/3d-marquee-simple'

const IMAGES = Array.from({ length: 20 }).map(() => '/images/product-image-1.png')

export default function MarqueeBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none select-none" style={{ zIndex: -10 }}>
      <ThreeDMarquee className="absolute inset-0 h-full w-full" images={IMAGES} />
    </div>
  )
}
