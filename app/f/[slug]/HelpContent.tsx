'use client';

import { useState, useEffect } from 'react';
import Lottie from 'lottie-react';
import type { HelpBlock } from '@/lib/forms/schema';

interface HelpContentProps {
  blocks: HelpBlock[];
}

export default function HelpContent({ blocks }: HelpContentProps) {
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [galleryIndices, setGalleryIndices] = useState<Record<number, number>>({});
  const [lottieData, setLottieData] = useState<Record<number, any>>({});

  // Load Lottie animations
  useEffect(() => {
    blocks.forEach((block, index) => {
      if (block.type === 'lottie' && block.content && !lottieData[index]) {
        // Try to load Lottie JSON from URL
        fetch(block.content)
          .then((res) => res.json())
          .then((data) => {
            setLottieData((prev) => ({ ...prev, [index]: data }));
          })
          .catch(() => {
            // If fetch fails, use a simple placeholder animation
            const placeholderAnimation = {
              v: '5.7.4',
              fr: 30,
              ip: 0,
              op: 60,
              w: 400,
              h: 400,
              nm: 'Placeholder',
              ddd: 0,
              assets: [],
              layers: [
                {
                  ddd: 0,
                  ind: 1,
                  ty: 4,
                  nm: 'Circle',
                  sr: 1,
                  ks: {
                    o: { a: 0, k: 100 },
                    r: { a: 1, k: [{ i: { x: [0.667], y: [1] }, o: { x: [0.333], y: [0] }, t: 0, s: [0] }, { t: 60, s: [360] }] },
                    p: { a: 0, k: [200, 200, 0] },
                    a: { a: 0, k: [0, 0, 0] },
                    s: { a: 0, k: [100, 100, 100] },
                  },
                  ao: 0,
                  shapes: [
                    {
                      ty: 'gr',
                      it: [
                        {
                          d: 1,
                          ty: 'el',
                          s: { a: 0, k: [100, 100] },
                          p: { a: 0, k: [0, 0] },
                          nm: 'Ellipse Path 1',
                        },
                        {
                          ty: 'st',
                          c: { a: 0, k: [0.2, 0.4, 0.8, 1] },
                          o: { a: 0, k: 100 },
                          w: { a: 0, k: 4 },
                          lc: 1,
                          lj: 1,
                          nm: 'Stroke 1',
                        },
                        {
                          ty: 'tr',
                          p: { a: 0, k: [0, 0] },
                          a: { a: 0, k: [0, 0] },
                          s: { a: 0, k: [100, 100] },
                          r: { a: 0, k: 0 },
                          o: { a: 0, k: 100 },
                          sk: { a: 0, k: 0 },
                          sa: { a: 0, k: 0 },
                          nm: 'Transform',
                        },
                      ],
                      nm: 'Ellipse 1',
                      np: 2,
                      cix: 2,
                      bm: 0,
                    },
                  ],
                  ip: 0,
                  op: 60,
                  st: 0,
                  bm: 0,
                },
              ],
            };
            setLottieData((prev) => ({ ...prev, [index]: placeholderAnimation }));
          });
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blocks]);

  const renderBlock = (block: HelpBlock, index: number) => {
    switch (block.type) {
      case 'text':
        return (
          <div key={index} className="mb-4">
            <p className="text-gray-700 whitespace-pre-line">{block.content}</p>
          </div>
        );

      case 'image':
        return (
          <div key={index} className="mb-4">
            <img
              src={block.content}
              alt={block.alt || block.caption || 'Изображение подсказки'}
              className="w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => setZoomedImage(block.content)}
            />
            {block.caption && (
              <p className="mt-2 text-sm text-gray-600 text-center">{block.caption}</p>
            )}
          </div>
        );

      case 'gallery':
        const galleryImages = block.content.split(',').map((url) => url.trim());
        const currentGalleryIndex = galleryIndices[index] || 0;
        const currentImage = galleryImages[currentGalleryIndex] || galleryImages[0];

        return (
          <div key={index} className="mb-4">
            <div className="relative">
              <img
                src={currentImage}
                alt={block.alt || `Gallery image ${currentGalleryIndex + 1}`}
                className="w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => setZoomedImage(currentImage)}
              />
              {galleryImages.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setGalleryIndices((prev) => ({
                        ...prev,
                        [index]: (currentGalleryIndex > 0 ? currentGalleryIndex - 1 : galleryImages.length - 1),
                      }));
                    }}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-2 hover:bg-black/70 transition-colors"
                    aria-label="Previous image"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setGalleryIndices((prev) => ({
                        ...prev,
                        [index]: (currentGalleryIndex < galleryImages.length - 1 ? currentGalleryIndex + 1 : 0),
                      }));
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-2 hover:bg-black/70 transition-colors"
                    aria-label="Next image"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                    {currentGalleryIndex + 1} / {galleryImages.length}
                  </div>
                </>
              )}
            </div>
            {block.caption && (
              <p className="mt-2 text-sm text-gray-600 text-center">{block.caption}</p>
            )}
          </div>
        );

      case 'lottie':
        const animationData = lottieData[index];
        return (
          <div key={index} className="mb-4">
            <div className="w-full max-w-md mx-auto">
              {animationData ? (
                <Lottie
                  animationData={animationData}
                  loop={true}
                  autoplay={true}
                  style={{ width: '100%', height: 'auto' }}
                />
              ) : (
                <div className="w-full aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                  <p className="text-sm text-gray-500 text-center">
                    Loading animation...
                  </p>
                </div>
              )}
            </div>
          </div>
        );

      case 'video':
        return (
          <div key={index} className="mb-4">
            <video
              src={block.content}
              controls
              autoPlay
              className="w-full rounded-lg"
            >
              Your browser does not support the video tag.
            </video>
            {block.caption && (
              <p className="mt-2 text-sm text-gray-600 text-center">{block.caption}</p>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <div className="space-y-4">
        {blocks.map((block, index) => renderBlock(block, index))}
      </div>

      {/* Image zoom modal */}
      {zoomedImage && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setZoomedImage(null)}
        >
          <button
            className="absolute top-4 right-4 text-white text-2xl hover:text-gray-300"
            onClick={() => setZoomedImage(null)}
            aria-label="Close"
          >
            ×
          </button>
          <img
            src={zoomedImage}
            alt="Zoomed"
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
