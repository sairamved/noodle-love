// Minimal wrapper around Mediabunny to record a p5 canvas

import {
  Output,
  BufferTarget,
  WebMOutputFormat,
  Mp4OutputFormat,
  CanvasSource,
  QUALITY_MEDIUM,
  getFirstEncodableVideoCodec,
} from './lib/mediabunny/dist/bundles/mediabunny.mjs';

let state = {
  output: null,
  target: null,
  source: null,
  formatLabel: 'webm',
  fps: 60,
  width: null,
  height: null,
  frameIndex: 0,
  isRecording: false,
  mime: 'video/webm',
};

async function pickCodecForFormat(outputFormat, width, height) {
  const containable = outputFormat.getSupportedVideoCodecs();
  const best = await getFirstEncodableVideoCodec(containable, { width, height });
  return best;
}

export async function startRecording(canvas, opts = {}) {
  if (state.isRecording) {
    console.warn('Already recording');
    return;
  }
  const {
    format = 'webm',
    fps = 60,
    width = canvas.width,
    height = canvas.height,
    bitrate = QUALITY_MEDIUM,
  } = opts;

  console.log('Starting recording:', { format, fps, width, height });

  state.formatLabel = format;
  state.fps = fps;
  state.width = width;
  state.height = height;
  state.frameIndex = 0;
  state.canvas = canvas;

  if (format === 'png-sequence') {
    if (!window.zip) {
      alert('zip.js library not loaded. Cannot export PNG sequence.');
      return;
    }
    state.zipFileWriter = new window.zip.BlobWriter();
    state.zipWriter = new window.zip.ZipWriter(state.zipFileWriter);
    state.isRecording = true;
    state.mime = 'application/zip';
    console.log('PNG sequence recording started');
    return;
  }

  state.target = new BufferTarget();
  const outputFormat =
    format === 'mp4' ? new Mp4OutputFormat() : new WebMOutputFormat();
  const codec = await pickCodecForFormat(outputFormat, width, height);
  console.log('Selected codec:', codec);

  state.output = new Output({ format: outputFormat, target: state.target });
  state.source = new CanvasSource(canvas, {
    codec: codec || 'av1',
    bitrate,
    width,
    height,
    alpha: 'keep', // Encode alpha channel for transparency
  });
  // Attach track and start output before adding frames
  state.output.addVideoTrack(state.source, { frameRate: fps });
  await state.output.start();
  state.isRecording = true;
  state.mime = format === 'mp4' ? 'video/mp4' : 'video/webm';
  console.log('Recording started successfully');
}

export async function addFrame() {
  if (!state.isRecording) return;

  if (state.formatLabel === 'png-sequence') {
    try {
      const blob = await new Promise(resolve => state.canvas.toBlob(resolve, 'image/png'));
      const filename = `frame_${String(state.frameIndex).padStart(5, '0')}.png`;
      await state.zipWriter.add(filename, new window.zip.BlobReader(blob));
      state.frameIndex++;
      if (state.frameIndex % 60 === 0) {
        console.log(`Recorded ${state.frameIndex} frames`);
      }
    } catch (err) {
      console.error('Error adding PNG frame:', err);
    }
    return;
  }

  if (!state.source) return;
  const ts = state.frameIndex / state.fps;
  const dur = 1 / state.fps;
  // Force keyframe every 2 seconds
  const keyFrame = state.frameIndex % Math.round(state.fps * 2) === 0;
  try {
    await state.source.add(ts, dur, { keyFrame });
    state.frameIndex += 1;
    if (state.frameIndex % 60 === 0) {
      console.log(`Recorded ${state.frameIndex} frames`);
    }
  } catch (err) {
    console.error('Error adding frame:', err);
    throw err;
  }
}

export async function stopRecording() {
  if (!state.isRecording) {
    console.warn('Not currently recording');
    return null;
  }
  console.log(`Stopping recording after ${state.frameIndex} frames`);
  state.isRecording = false;

  if (state.formatLabel === 'png-sequence') {
    try {
      console.log('Finalizing ZIP file...');
      await state.zipWriter.close();
      const blob = await state.zipFileWriter.getData();
      console.log('ZIP created:', blob.size, 'bytes');
      state.zipWriter = null;
      state.zipFileWriter = null;
      return { blob, mime: 'application/zip' };
    } catch (err) {
      console.error('Error generating ZIP:', err);
      throw err;
    }
  }

  if (!state.output) return null;

  try {
    await state.output.finalize();
    const buffer = state.target.buffer; // ArrayBuffer
    console.log('Buffer size:', buffer.byteLength, 'bytes');
    const blob = new Blob([buffer], { type: state.mime });
    console.log('Recording stopped, blob created:', blob.size, 'bytes');
    return { blob, mime: state.mime };
  } catch (err) {
    console.error('Error stopping recording:', err);
    throw err;
  }
}

export function isRecording() {
  return !!state.isRecording;
}

// Expose on window for easy access from inline code if needed
if (typeof window !== 'undefined') {
  window.mb = {
    startRecording,
    addFrame,
    stopRecording,
    isRecording,
  };
}
