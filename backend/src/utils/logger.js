// Tiny logging helper.
export const logger = {
  info: (...a) => console.log('[info]', ...a),
  error: (...a) => console.error('[error]', ...a),
}
