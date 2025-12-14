// dolphinjs/core/platform-detection.js
export async function _detectPlatform(hint = 'auto') {
  if (hint !== 'auto' && hint !== 'autodetect') {
    return hint;
  }
  
  // Browser detection
  if (typeof window !== 'undefined') {
    const { userAgent } = window;
    
    if (/Android/i.test(userAgent)) return 'android';
    if (/iPhone|iPad|iPod/i.test(userAgent)) return 'ios';
    if (/Windows/i.test(userAgent)) return 'windows';
    if (/Mac/i.test(userAgent)) return 'macos';
    if (/Linux/i.test(userAgent)) return 'linux';
    
    return 'web';
  }
  
  // Node.js detection
  if (typeof process !== 'undefined' && process.versions && process.versions.node) {
    if (process.versions.electron) return 'electron';
    if (process.env.REACT_NATIVE) return 'react-native';
    if (process.platform === 'linux' && process.arch.includes('arm')) return 'embedded';
    if (process.platform === 'darwin') return 'macos';
    if (process.platform === 'win32') return 'windows';
    return 'node';
  }
  
  return 'unknown';
}