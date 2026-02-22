import React, { useState, useRef, useEffect, useCallback } from 'react';

// Canvas-based scroll scrubber for cinematic frame sequences
const SequenceScrubber = () => {
  // Refs for DOM and data
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const framesCacheRef = useRef(new Map());
  const animationFrameRef = useRef(null);
  const preloadQueueRef = useRef(new Set());

  // Frame state
  const [frameState, setFrameState] = useState({ sequence: 1, frameIndex: 0, opacity: 1 });

  // Constants
  const SEQUENCE_1_FRAMES = 240;
  const SEQUENCE_2_FRAMES = 240;
  const TOTAL_FRAMES = SEQUENCE_1_FRAMES + SEQUENCE_2_FRAMES;
  const SCROLL_HEIGHT_MULTIPLIER = 12; // ~12px per frame = ~5760px total for all sequences

  // Get frame image path
  const getFrameSrc = useCallback((sequence, frameIndex) => {
    const paddedIndex = String(frameIndex + 1).padStart(3, '0');
    return `/Sequence${sequence}/ezgif-frame-${paddedIndex}.jpg`;
  }, []);

  // Preload image utility
  const preloadImage = useCallback((src) => {
    return new Promise((resolve, reject) => {
      if (framesCacheRef.current.has(src)) {
        resolve(framesCacheRef.current.get(src));
        return;
      }

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        framesCacheRef.current.set(src, img);
        preloadQueueRef.current.delete(src);
        resolve(img);
      };
      img.onerror = () => {
        console.warn(`Failed to load frame: ${src}`);
        preloadQueueRef.current.delete(src);
        reject(new Error(`Failed to load ${src}`));
      };
      img.src = src;
    });
  }, []);

  // Queue frames for preloading
  const queueFramePreloads = useCallback((currentFrame, sequence) => {
    const preloadAhead = 8;
    const maxFrames = sequence === 1 ? SEQUENCE_1_FRAMES : SEQUENCE_2_FRAMES;

    for (let i = 0; i < preloadAhead; i++) {
      const frameIdx = Math.min(currentFrame + i, maxFrames - 1);
      const src = getFrameSrc(sequence, frameIdx);

      if (!framesCacheRef.current.has(src) && !preloadQueueRef.current.has(src)) {
        preloadQueueRef.current.add(src);
        preloadImage(src).catch(() => {
          // Silent fail for preloads
        });
      }
    }
  }, [SEQUENCE_1_FRAMES, SEQUENCE_2_FRAMES, getFrameSrc, preloadImage]);

  // Preload a range of frames
  const preloadSequenceFrames = useCallback((sequence, startFrame, endFrame) => {
    for (let i = startFrame; i <= endFrame; i++) {
      const src = getFrameSrc(sequence, i);
      if (!framesCacheRef.current.has(src) && !preloadQueueRef.current.has(src)) {
        preloadQueueRef.current.add(src);
        preloadImage(src).catch(() => {
          // Silent fail
        });
      }
    }
  }, [getFrameSrc, preloadImage]);

  // Handle scroll and map to frame index
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const windowHeight = window.innerHeight;
    const containerTop = container.getBoundingClientRect().top;
    const containerHeight = container.offsetHeight;

    // Calculate scroll progress (0 to 1)
    // When container top reaches window top (0px), progress should be 0
    // When container bottom reaches window top, progress should be 1
    const scrollProgress = Math.max(0, Math.min(1, 
      (windowHeight - containerTop) / (windowHeight + containerHeight)
    ));

    // Map scroll progress directly to frame index (0 to TOTAL_FRAMES)
    const rawFrameIndex = scrollProgress * TOTAL_FRAMES;
    const frameIndex = Math.round(rawFrameIndex);

    let sequence = 1;
    let frameIdx = frameIndex;
    let opacity = 1;

    if (frameIndex >= SEQUENCE_1_FRAMES) {
      sequence = 2;
      frameIdx = frameIndex - SEQUENCE_1_FRAMES;

      if (frameIdx >= SEQUENCE_2_FRAMES - 1) {
        // Lock on last frame of Sequence 2 - keep it visible
        frameIdx = SEQUENCE_2_FRAMES - 1;
        opacity = 1; // Stay visible
      }
    }

    // Ensure indices are within bounds
    frameIdx = Math.max(0, Math.min(frameIdx, sequence === 1 ? SEQUENCE_1_FRAMES - 1 : SEQUENCE_2_FRAMES - 1));

    // Update state
    setFrameState({ sequence, frameIndex: frameIdx, opacity });

    // Queue preloads
    queueFramePreloads(frameIdx, sequence);
  }, [SEQUENCE_1_FRAMES, SEQUENCE_2_FRAMES, TOTAL_FRAMES, queueFramePreloads]);

  // Render frame to canvas
  const renderFrame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const src = getFrameSrc(frameState.sequence, frameState.frameIndex);
    const img = framesCacheRef.current.get(src);
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    // Clear canvas with high quality
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw frame if loaded
    if (img) {
      ctx.globalAlpha = frameState.opacity;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      ctx.globalAlpha = 1;
      
      // Add cinematic lighting overlay for enhanced depth
      // Vignette effect - darker corners
      const vignette = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, canvas.width * 0.3,
        canvas.width / 2, canvas.height / 2, canvas.width * 0.8
      );
      vignette.addColorStop(0, 'rgba(255, 255, 255, 0)');
      vignette.addColorStop(1, 'rgba(0, 0, 0, 0.25)');
      
      ctx.globalAlpha = frameState.opacity;
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.globalAlpha = 1;
    }
  }, [frameState, getFrameSrc]);

  // Animation loop
  useEffect(() => {
    const animate = () => {
      renderFrame();
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [renderFrame]);

  // Scroll listener
  useEffect(() => {
    let lastTime = 0;
    const throttle = 16; // ~60fps

    const onScroll = () => {
      const now = Date.now();
      if (now - lastTime > throttle) {
        handleScroll();
        lastTime = now;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });

    // Initial preload
    preloadSequenceFrames(1, 0, 10);

    return () => {
      window.removeEventListener('scroll', onScroll);
    };
  }, [handleScroll, preloadSequenceFrames]);

  // Canvas setup and resize handling
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;

      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
      }

      renderFrame();
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [renderFrame]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100vw',
        height: `${TOTAL_FRAMES * SCROLL_HEIGHT_MULTIPLIER + 800}px`, // Extra 800px for content visibility
        position: 'relative',
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          display: 'block',
          backgroundColor: '#000000',
          zIndex: frameState.opacity > 0.01 ? 10 : -1,
          opacity: frameState.opacity,
          pointerEvents: 'none',
          WebkitBackfaceVisibility: 'hidden',
          backfaceVisibility: 'hidden',
        }}
      />
    </div>
  );
};

export default SequenceScrubber;
