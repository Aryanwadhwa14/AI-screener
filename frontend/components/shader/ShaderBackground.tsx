'use client';

import React, { useEffect, useRef, useState } from 'react';
import { WAVES_FRAGMENT_SHADER } from './wavesShaderSource';

const VERTEX_SHADER = `
attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

// Subtle obsidian-to-brand-orange palette
const COLOR_PALETTE = new Float32Array([
  0.008, 0.008, 0.012, // #020203 Deep black
  0.039, 0.039, 0.059, // #0a0a0f Deep charcoal
  0.082, 0.051, 0.035, // #150d09 Deep ember
  0.180, 0.067, 0.024, // #2e1106 Rich burnt orange
  0.361, 0.114, 0.027, // #5c1d07 Warm rust
  0.639, 0.204, 0.043, // #a3340b Amber fire
  1.000, 0.341, 0.161, // #FF5729 Canonical GFI Orange
  1.000, 0.502, 0.322, // #ff8052 Soft highlight glow
]);

export default function ShaderBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hasWebGlError, setHasWebGlError] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Check prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Plain WebGL1 context
    const gl =
      (canvas.getContext('webgl') as WebGLRenderingContext | null) ||
      (canvas.getContext('experimental-webgl') as WebGLRenderingContext | null);

    if (!gl) {
      setHasWebGlError(true);
      return;
    }

    // Compile helper
    const compileShader = (type: number, source: string): WebGLShader | null => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.warn('WebGL shader compilation warning:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vertShader = compileShader(gl.VERTEX_SHADER, VERTEX_SHADER);
    const fragShader = compileShader(gl.FRAGMENT_SHADER, WAVES_FRAGMENT_SHADER);

    if (!vertShader || !fragShader) {
      setHasWebGlError(true);
      return;
    }

    const program = gl.createProgram();
    if (!program) {
      setHasWebGlError(true);
      return;
    }

    gl.attachShader(program, vertShader);
    gl.attachShader(program, fragShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.warn('WebGL program link warning:', gl.getProgramInfoLog(program));
      setHasWebGlError(true);
      return;
    }

    gl.useProgram(program);

    // Fullscreen single triangle
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        -1.0, -1.0,
         3.0, -1.0,
        -1.0,  3.0,
      ]),
      gl.STATIC_DRAW
    );

    const aPositionLoc = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(aPositionLoc);
    gl.vertexAttribPointer(aPositionLoc, 2, gl.FLOAT, false, 0, 0);

    // Uniform locations
    const uColorsLoc = gl.getUniformLocation(program, 'u_colors');
    const uSceneLoc = gl.getUniformLocation(program, 'u_scene');
    const uShapeLoc = gl.getUniformLocation(program, 'u_shape');
    const uSurfaceLoc = gl.getUniformLocation(program, 'u_surface');
    const uFinishLoc = gl.getUniformLocation(program, 'u_finish');
    const uTransformLoc = gl.getUniformLocation(program, 'u_transform');
    const uSpaceLoc = gl.getUniformLocation(program, 'u_space');
    const uCursorLoc = gl.getUniformLocation(program, 'u_cursor');

    // Set static uniforms
    if (uColorsLoc) gl.uniform3fv(uColorsLoc, COLOR_PALETTE);
    // u_shape: scale=0.9, intensity=0.38, paramA=0.0, warp=0.22
    if (uShapeLoc) gl.uniform4f(uShapeLoc, 0.9, 0.38, 0.0, 0.22);
    // u_surface: detail=1.0, contrast=1.08, brightness=-0.22, saturation=1.1
    if (uSurfaceLoc) gl.uniform4f(uSurfaceLoc, 1.0, 1.08, -0.22, 1.1);
    // u_finish: hue=0.0, vignette=0.65, blur=0.0, grain=0.02
    if (uFinishLoc) gl.uniform4f(uFinishLoc, 0.0, 0.65, 0.0, 0.02);
    // u_transform: seed=23.0, rotation=0.12, drift=0.02, OKLab toggle=1.0
    if (uTransformLoc) gl.uniform4f(uTransformLoc, 23.0, 0.12, 0.02, 1.0);
    // u_space: offset=(0,0), pointer=(0,0)
    if (uSpaceLoc) gl.uniform4f(uSpaceLoc, 0.0, 0.0, 0.0, 0.0);
    // u_cursor: disabled
    if (uCursorLoc) gl.uniform4f(uCursorLoc, 0.0, 0.0, 0.0, 0.0);

    let animationFrameId: number | null = null;
    let startTime = performance.now();
    let isPaused = false;

    const resize = () => {
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const displayWidth = Math.floor(window.innerWidth * dpr);
      const displayHeight = Math.floor(window.innerHeight * dpr);

      if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
        canvas.width = displayWidth;
        canvas.height = displayHeight;
        gl.viewport(0, 0, displayWidth, displayHeight);
      }
    };

    const render = (now: number) => {
      if (!gl || isPaused) return;

      const elapsed = (now - startTime) * 0.00035; // Calm, ambient motion

      if (uSceneLoc) {
        // resolution.xy, time, colour count (5.0)
        gl.uniform4f(uSceneLoc, canvas.width, canvas.height, elapsed, 5.0);
      }

      gl.drawArrays(gl.TRIANGLES, 0, 3);

      if (!prefersReducedMotion) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    // Initial sizing and frame
    resize();
    render(performance.now());

    // Window resize handler
    const handleResize = () => {
      resize();
      if (prefersReducedMotion) {
        render(performance.now());
      }
    };
    window.addEventListener('resize', handleResize);

    // Pause RAF when document is hidden
    const handleVisibilityChange = () => {
      if (document.hidden) {
        isPaused = true;
        if (animationFrameId !== null) {
          cancelAnimationFrame(animationFrameId);
          animationFrameId = null;
        }
      } else {
        isPaused = false;
        if (!prefersReducedMotion) {
          startTime = performance.now();
          animationFrameId = requestAnimationFrame(render);
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup resources
    return () => {
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
      }
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);

      if (positionBuffer) gl.deleteBuffer(positionBuffer);
      if (program) gl.deleteProgram(program);
      if (vertShader) gl.deleteShader(vertShader);
      if (fragShader) gl.deleteShader(fragShader);
    };
  }, []);

  if (hasWebGlError) {
    // Elegant fallback: dark radial gradient
    return (
      <div
        className="fixed inset-0 pointer-events-none -z-10 bg-[#020203]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 50% 20%, rgba(255, 87, 41, 0.08) 0%, rgba(2, 2, 3, 0.95) 75%)',
        }}
      />
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none -z-10 w-full h-full"
      style={{
        background: '#020203',
      }}
    />
  );
}

