"use client";
import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import Image from "next/image";
import { X, Play } from "lucide-react";

// MediaItemType defines the structure of a media item
export interface MediaItemType {
  id: number;
  type: string;
  title: string;
  desc: string;
  url: string;
  span: string;
}

// MediaItem renders either a video (raw <video>) or an image (next/image, fill).
// Images go through next/image because this gallery is the homepage hero (LCP),
// and both CDN hosts are allowlisted in next.config remotePatterns.
const MediaItem = ({
  item,
  className,
  onClick,
  sizes = "(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw",
  priority = false,
}: {
  item: MediaItemType;
  className?: string;
  onClick?: () => void;
  sizes?: string;
  priority?: boolean;
}) => {
  const videoRef = useRef<HTMLVideoElement>(null); // Reference for video element
  const [isInView, setIsInView] = useState(false); // To track if video is in the viewport
  const [isBuffering, setIsBuffering] = useState(true); // To track if video is buffering

  // Intersection Observer to detect if video is in view and play/pause accordingly
  useEffect(() => {
    const options = {
      root: null,
      rootMargin: "50px",
      threshold: 0.1,
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        setIsInView(entry.isIntersecting); // Set isInView to true if the video is in view
      });
    }, options);

    const node = videoRef.current;
    if (node) {
      observer.observe(node); // Start observing the video element
    }

    return () => {
      if (node) {
        observer.unobserve(node); // Clean up observer when component unmounts
      }
    };
  }, []);

  // Handle video play/pause based on whether the video is in view or not
  useEffect(() => {
    let mounted = true;
    const node = videoRef.current;

    const handleVideoPlay = async () => {
      if (!videoRef.current || !isInView || !mounted) return; // Don't play if not in view / unmounted

      try {
        if (videoRef.current.readyState >= 3) {
          setIsBuffering(false);
          await videoRef.current.play(); // Play the video if it's ready
        } else {
          setIsBuffering(true);
          await new Promise((resolve) => {
            if (videoRef.current) {
              videoRef.current.oncanplay = resolve; // Wait until the video can start playing
            }
          });
          if (mounted) {
            setIsBuffering(false);
            await videoRef.current.play();
          }
        }
      } catch (error) {
        console.warn("Video playback failed:", error);
      }
    };

    if (isInView) {
      handleVideoPlay();
    } else if (node) {
      node.pause();
    }

    return () => {
      mounted = false;
      if (node) {
        node.pause();
        node.removeAttribute("src");
        node.load();
      }
    };
  }, [isInView]);

  if (item.type === "video") {
    return (
      <div className={`${className} relative overflow-hidden`}>
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          onClick={onClick}
          playsInline
          muted
          loop
          preload="auto"
          style={{
            opacity: isBuffering ? 0.8 : 1,
            transition: "opacity 0.2s",
            transform: "translateZ(0)",
            willChange: "transform",
          }}
        >
          <source src={item.url} type="video/mp4" />
        </video>
        {isBuffering && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/10">
            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
        )}
      </div>
    );
  }

  return (
    <Image
      src={item.url}
      alt={item.title}
      fill
      sizes={sizes}
      priority={priority}
      className={`${className ?? ""} object-cover cursor-pointer`}
      onClick={onClick}
    />
  );
};

// GalleryModal component displays the selected media item in a modal
interface GalleryModalProps {
  selectedItem: MediaItemType;
  isOpen: boolean;
  onClose: () => void;
  setSelectedItem: (item: MediaItemType | null) => void;
  mediaItems: MediaItemType[]; // List of media items to display in the modal
}
const GalleryModal = ({
  selectedItem,
  isOpen,
  onClose,
  setSelectedItem,
  mediaItems,
}: GalleryModalProps) => {
  const [dockPosition, setDockPosition] = useState({ x: 0, y: 0 }); // Track the position of the dockable panel
  const reduce = useReducedMotion();

  // Escape closes the modal (a11y escape-routes)
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null; // Return null if the modal is not open

  return (
    <>
      {/* Main Modal */}
      <motion.div
        initial={{ scale: 0.98 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.98 }}
        transition={{
          type: "spring",
          stiffness: 400,
          damping: 30,
        }}
        className="fixed inset-0 w-full min-h-screen sm:h-[90vh] md:h-[600px] backdrop-blur-lg
                  rounded-none sm:rounded-lg md:rounded-xl overflow-hidden z-10"
      >
        {/* Main Content */}
        <div className="h-full flex flex-col">
          <div className="flex-1 p-2 sm:p-3 md:p-4 flex items-center justify-center bg-[#14100D]/92">
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedItem.id}
                className="relative w-full aspect-[16/9] max-w-[95%] sm:max-w-[85%] md:max-w-3xl
                         h-auto max-h-[70vh] rounded-lg overflow-hidden shadow-md"
                initial={{ y: 20, scale: 0.97 }}
                animate={{
                  y: 0,
                  scale: 1,
                  transition: {
                    type: "spring",
                    stiffness: 500,
                    damping: 30,
                    mass: 0.5,
                  },
                }}
                exit={{
                  y: 20,
                  scale: 0.97,
                  transition: { duration: 0.15 },
                }}
                onClick={onClose}
              >
                <MediaItem
                  item={selectedItem}
                  className="w-full h-full object-contain bg-gray-900/20"
                  sizes="(max-width: 768px) 95vw, 768px"
                  onClick={onClose}
                />
                <div
                  className="absolute bottom-0 left-0 right-0 p-2 sm:p-3 md:p-4
                              bg-gradient-to-t from-black/50 to-transparent"
                >
                  <h3 className="text-white text-base sm:text-lg md:text-xl font-semibold">
                    {selectedItem.title}
                  </h3>
                  <p className="text-white/80 text-xs sm:text-sm mt-1">
                    {selectedItem.desc}
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Close Button */}
        <motion.button
          aria-label="Close gallery"
          className="absolute top-3 right-3 grid h-11 w-11 place-items-center rounded-full
                    bg-[#C9A24B] text-[#14100D] hover:bg-[#F3E9D6]
                    backdrop-blur-sm shadow-md shadow-black/30
                    focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A24B] focus-visible:ring-offset-2 focus-visible:ring-offset-[#14100D]"
          onClick={onClose}
          whileHover={reduce ? undefined : { scale: 1.1 }}
          whileTap={reduce ? undefined : { scale: 0.9 }}
        >
          <X className="w-4 h-4" />
        </motion.button>
      </motion.div>

      {/* Draggable Dock */}
      <motion.div
        drag
        dragMomentum={false}
        dragElastic={0.1}
        initial={false}
        animate={{ x: dockPosition.x, y: dockPosition.y }}
        onDragEnd={(_, info) => {
          setDockPosition((prev) => ({
            x: prev.x + info.offset.x,
            y: prev.y + info.offset.y,
          }));
        }}
        className="fixed z-50 left-1/2 bottom-4 -translate-x-1/2 touch-none"
      >
        <motion.div
          className="relative rounded-xl bg-[#1C1712]/70 backdrop-blur-xl
                     border border-[#C9A24B]/30 shadow-lg shadow-black/40
                     cursor-grab active:cursor-grabbing"
        >
          <div className="flex items-center -space-x-2 px-3 py-2">
            {mediaItems.map((item, index) => (
              <motion.div
                key={item.id}
                role="button"
                tabIndex={0}
                aria-label={`View ${item.title}`}
                aria-current={selectedItem.id === item.id}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedItem(item);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelectedItem(item);
                  }
                }}
                style={{
                  zIndex:
                    selectedItem.id === item.id ? 30 : mediaItems.length - index,
                }}
                className={`
                    relative group
                    w-11 h-11 flex-shrink-0
                    rounded-lg overflow-hidden
                    cursor-pointer hover:z-20
                    focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A24B] focus-visible:z-20
                    ${
                      selectedItem.id === item.id
                        ? "ring-2 ring-[#C9A24B] shadow-lg"
                        : "hover:ring-2 hover:ring-[#C9A24B]/50"
                    }
                `}
                initial={reduce ? false : { rotate: index % 2 === 0 ? -15 : 15 }}
                animate={{
                  scale: selectedItem.id === item.id ? 1.2 : 1,
                  rotate: reduce
                    ? 0
                    : selectedItem.id === item.id
                    ? 0
                    : index % 2 === 0
                    ? -15
                    : 15,
                  y: selectedItem.id === item.id ? -8 : 0,
                }}
                whileHover={
                  reduce
                    ? undefined
                    : {
                        scale: 1.3,
                        rotate: 0,
                        y: -10,
                        transition: {
                          type: "spring",
                          stiffness: 400,
                          damping: 25,
                        },
                      }
                }
              >
                <MediaItem
                  item={item}
                  className="w-full h-full"
                  sizes="40px"
                  onClick={() => setSelectedItem(item)}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-white/20" />
                {selectedItem.id === item.id && (
                  <motion.div
                    layoutId="activeGlow"
                    className="absolute -inset-2 bg-white/20 blur-xl"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2 }}
                  />
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </>
  );
};

interface InteractiveBentoGalleryProps {
  mediaItems: MediaItemType[];
  title: string;
  description: string;
}

const InteractiveBentoGallery: React.FC<InteractiveBentoGalleryProps> = ({
  mediaItems,
  title,
  description,
}) => {
  const [selectedItem, setSelectedItem] = useState<MediaItemType | null>(null);
  const [items, setItems] = useState(mediaItems);
  const [isDragging, setIsDragging] = useState(false);
  const reduce = useReducedMotion();

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6 max-w-7xl xl:max-w-[1500px]">
      <div className="mb-6 text-center">
        <motion.h1
          className="uppercase leading-[0.95] text-[2.75rem] sm:text-6xl md:text-7xl"
          style={{
            color: "#F3E9D6",
            fontFamily: "var(--font-display)",
            fontWeight: 200,
            letterSpacing: "0.14em",
          }}
          initial={reduce ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {title}
        </motion.h1>
        <motion.p
          className="mx-auto mt-3 max-w-xl text-sm sm:text-base text-[#8A8276]"
          initial={reduce ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {description}
        </motion.p>
      </div>
      <AnimatePresence mode="wait">
        {selectedItem ? (
          <GalleryModal
            selectedItem={selectedItem}
            isOpen={true}
            onClose={() => setSelectedItem(null)}
            setSelectedItem={setSelectedItem}
            mediaItems={items}
          />
        ) : (
          <motion.div
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4 auto-rows-[120px] sm:auto-rows-[88px] md:auto-rows-[118px] lg:auto-rows-[132px] grid-flow-dense sm:grid-flow-row"
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: { staggerChildren: reduce ? 0 : 0.1 },
              },
            }}
          >
            {items.map((item, index) => (
              <motion.div
                key={item.id}
                layoutId={`media-${item.id}`}
                role="button"
                tabIndex={0}
                aria-label={`${item.title} — ${item.desc}`}
                className={`group relative overflow-hidden rounded-xl ${
                  reduce ? "cursor-pointer" : "cursor-move"
                } focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A24B] focus-visible:ring-offset-2 focus-visible:ring-offset-[#14100D] ${item.span}`}
                onClick={() => !isDragging && setSelectedItem(item)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelectedItem(item);
                  }
                }}
                variants={{
                  hidden: reduce
                    ? { opacity: 0 }
                    : { y: 50, scale: 0.9, opacity: 0 },
                  visible: {
                    y: 0,
                    scale: 1,
                    opacity: 1,
                    transition: reduce
                      ? { duration: 0.2 }
                      : {
                          type: "spring",
                          stiffness: 350,
                          damping: 25,
                          delay: index * 0.05,
                        },
                  },
                }}
                whileHover={reduce ? undefined : { scale: 1.02 }}
                drag={reduce ? false : true}
                dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                dragElastic={1}
                dragDirectionLock
                onDragStart={() => setIsDragging(true)}
                onDragEnd={(e, info) => {
                  setIsDragging(false);
                  const moveDistance = info.offset.x + info.offset.y;
                  if (Math.abs(moveDistance) > 50) {
                    const newItems = [...items];
                    const draggedItem = newItems[index];
                    if (!draggedItem) return;
                    const targetIndex =
                      moveDistance > 0
                        ? Math.min(index + 1, items.length - 1)
                        : Math.max(index - 1, 0);
                    newItems.splice(index, 1);
                    newItems.splice(targetIndex, 0, draggedItem);
                    setItems(newItems);
                  }
                }}
              >
                <MediaItem
                  item={item}
                  className="absolute inset-0 w-full h-full"
                  priority={index < 2}
                  onClick={() => !isDragging && setSelectedItem(item)}
                />
                {item.type === "video" && (
                  <span className="pointer-events-none absolute top-2 left-2 z-10 inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-white backdrop-blur-sm">
                    <Play className="h-3 w-3 fill-current" aria-hidden="true" /> Video
                  </span>
                )}
                <motion.div
                  className="absolute inset-0 flex flex-col justify-end p-2 sm:p-3 md:p-4"
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="absolute inset-0 flex flex-col justify-end p-2 sm:p-3 md:p-4">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                    <h3 className="relative text-white text-xs sm:text-sm md:text-base font-medium line-clamp-1">
                      {item.title}
                    </h3>
                    <p className="relative text-white/70 text-[10px] sm:text-xs md:text-sm mt-0.5 line-clamp-2">
                      {item.desc}
                    </p>
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default InteractiveBentoGallery;
