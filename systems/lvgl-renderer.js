// dolphinjs/systems/lvgl-renderer.js
import LVGLBinding from '../embedded/lvgl/bindings/lvgl-core.js';
import { MaterialTheme } from '../embedded/lvgl/themes/material.js';

export default async function _initLVGLRenderer() {
  let lvgl = null;
  
  return {
    async init(config = {}) {
      console.log('🎨 Initializing LVGL renderer...');
      
      lvgl = new LVGLBinding(config);
      await lvgl.init();
      
      // Apply theme
      lvgl.theme = MaterialTheme;
      
      return this;
    },
    
    async mount(component) {
      if (!lvgl) {
        await this.init();
      }
      
      console.log('📱 Mounting component to LVGL...');
      
      // Render component to LVGL
      const rootId = lvgl.mapDolphinToLVGL(component);
      
      // Set as active screen
      lvgl.setProperty(rootId, 'active', true);
      
      // Render to display
      await lvgl.render();
      
      return { success: true, screenId: rootId };
    },
    
    async update(component) {
      if (!lvgl) return;
      
      console.log('🔄 Updating LVGL display...');
      
      // For now, just re-render
      // In production, we would do incremental updates
      await lvgl.render();
      
      return { success: true };
    },
    
    async unmount() {
      if (lvgl) {
        console.log('🗑️ Unmounting LVGL...');
        // Clear display
        await lvgl.clear();
      }
      return this;
    },
    
    ready: () => Promise.resolve(true),
    destroy: () => {
      lvgl = null;
      return Promise.resolve();
    }
  };
}