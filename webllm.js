import { CreateMLCEngine } from 'https://esm.run/@mlc-ai/web-llm';

const MODEL = 'Llama-3.2-1B-Instruct-q4f16_1-MLC'; // ~600MB, fast, cached

window.webllmState   = 'idle';   // idle | loading | ready | failed
window.webllmEngine  = null;
window.webllmProgress = 0;

// Don't auto-load — wait for first chat message so the game can start fast.
// Called by main script on first user message.
window.initWebLLM = async function(onProgress) {
  if (window.webllmState === 'ready')   return true;
  if (window.webllmState === 'loading') return false; // already in progress
  if (window.webllmState === 'failed')  return false;

  window.webllmState = 'loading';
  try {
    window.webllmEngine = await CreateMLCEngine(MODEL, {
      initProgressCallback: (p) => {
        window.webllmProgress = Math.round((p.progress || 0) * 100);
        if (onProgress) onProgress(window.webllmProgress, p.text || '');
      }
    });
    window.webllmState = 'ready';
    return true;
  } catch(e) {
    console.warn('WebLLM failed:', e);
    window.webllmState = 'failed';
    return false;
  }
};
