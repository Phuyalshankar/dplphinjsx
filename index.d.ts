// index.d.ts
declare module 'dolphinjs' {
  // JSX Types
  export namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
    
    interface Element {
      type: string | Function;
      props: any;
      children?: any;
    }
  }
  
  // Core
  export function createElement(
    type: string | Function,
    props?: any,
    ...children: any[]
  ): any;
  
  export function Fragment(props: { children: any }): any;
  
  // Hooks
  export function useState<T>(initialState: T): [T, (newState: T | ((prev: T) => T)) => void];
  export function useEffect(effect: () => void | (() => void), deps?: any[]): void;
  export function useContext<T>(context: React.Context<T>): T;
  export function useReducer<R extends React.Reducer<any, any>>(
    reducer: R,
    initialState: React.ReducerState<R>,
    initializer?: undefined
  ): [React.ReducerState<R>, React.Dispatch<React.ReducerAction<R>>];
  export function useCallback<T extends (...args: any[]) => any>(
    callback: T,
    deps: any[]
  ): T;
  export function useMemo<T>(factory: () => T, deps: any[]): T;
  export function useRef<T>(initialValue: T): { current: T };
  
  // App Creation
  interface AppConfig {
    platform?: string;
    debug?: boolean;
    appId?: string;
    [key: string]: any;
  }
  
  interface DolphinApp {
    mount: (elementOrSelector: string | HTMLElement, component: any) => Promise<any>;
    destroy: () => Promise<void>;
    [key: string]: any;
  }
  
  export function createApp(config?: AppConfig): DolphinApp;
  
  // Utilities
  export function getInfo(): any;
  export function destroy(app: DolphinApp): Promise<void>;
  
  // Compiler
  export function compileJSX(code: string, options?: any): Promise<any>;
  export function transformJSX(code: string, options?: any): Promise<any>;
  
  // Build System
  export function build(config: any): Promise<any>;
}