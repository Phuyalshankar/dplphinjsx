// dolphinjs/index.js
import DolphinClass from './dolphin-class.js';
import { _detectPlatform } from './core/platform-detection.js';
import { _initLogger } from './core/logger.js';
import { 
  createApp, 
  createElement, 
  Fragment, 
  useState, 
  useEffect, 
  useContext,
  getInfo,
  destroy,
  resetHooks
} from './utils/utilities.js';

// Export everything
export {
  _detectPlatform,
  _initLogger,
  createApp,
  createElement,
  Fragment,
  useState,
  useEffect,
  useContext,
  getInfo,
  destroy,
  resetHooks
};

// Default export
export default DolphinClass;