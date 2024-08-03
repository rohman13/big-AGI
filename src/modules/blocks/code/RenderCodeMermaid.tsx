import * as React from 'react';
import { create } from 'zustand';
import { Box } from '@mui/joy';

import { isBrowser } from '~/common/util/pwaUtils';
import { themeCodeFontFamilyCss, themeFontFamilyCss } from '~/common/app.theme';

import { diagramSx } from './RenderCodePlantUML';
import { patchSvgString } from './RenderCodeSVG';


/**
 * We are loading Mermaid from the CDN (and spending all the work to dynamically load it
 * and strong type it), because the Mermaid dependencies (npm i mermaid) are too heavy
 * and would slow down development for everyone.
 *
 * If you update this file, also make sure the interfaces/type definitions and initialization
 * options are updated accordingly.
 */
const MERMAID_CDN_FILE: string = 'https://cdn.jsdelivr.net/npm/mermaid@10.9.1/dist/mermaid.min.js';


interface MermaidAPI {
  initialize: (config: any) => void;
  render: (id: string, text: string, svgContainingElement?: Element) => Promise<{ svg: string, bindFunctions?: (element: Element) => void }>;
}

// extend the Window interface, to allow for the mermaid API to be found
declare global {
  // noinspection JSUnusedGlobalSymbols
  interface Window {
    mermaid: MermaidAPI;
  }
}

interface MermaidAPIStore {
  mermaidAPI: MermaidAPI | null,
  loadingError: string | null,
}

const useMermaidStore = create<MermaidAPIStore>()(
  () => ({
    mermaidAPI: null,
    loadingError: null,
  }),
);

let loadingStarted: boolean = false;
let loadingError: string | null = null;


function _loadMermaidFromCDN() {
  if (isBrowser && !loadingStarted) {
    loadingStarted = true;
    const script = document.createElement('script');
    script.src = MERMAID_CDN_FILE;
    script.defer = true;
    script.onload = () => {
      useMermaidStore.setState({
        mermaidAPI: _initializeMermaid(window.mermaid),
        loadingError: null,
      });
    };
    script.onerror = () => {
      useMermaidStore.setState({
        mermaidAPI: null,
        loadingError: `Script load error for ${script.src}`,
      });
    };
    document.head.appendChild(script);
  }
}

/**
 * Pass the current font families at loading time. Note that the font families will be compiled by next to something like this:
 * - code: "'__JetBrains_Mono_dc2b2d', '__JetBrains_Mono_Fallback_dc2b2d', monospace",
 * - text: "'__Inter_1870e5', '__Inter_Fallback_1870e5', Helvetica, Arial, sans-serif"
 */
function _initializeMermaid(mermaidAPI: MermaidAPI): MermaidAPI {
  mermaidAPI.initialize({
    startOnLoad: false,

    // gfx options
    fontFamily: themeCodeFontFamilyCss,
    altFontFamily: themeFontFamilyCss,

    // style configuration
    htmlLabels: true,
    securityLevel: 'loose',
    theme: 'forest',

    // per-chart configuration
    mindmap: { useMaxWidth: false },
    flowchart: { useMaxWidth: false },
    sequence: { useMaxWidth: false },
    timeline: { useMaxWidth: false },
    class: { useMaxWidth: false },
    state: { useMaxWidth: false },
    pie: { useMaxWidth: false },
    er: { useMaxWidth: false },
    gantt: { useMaxWidth: false },
    gitGraph: { useMaxWidth: false },
  });
  return mermaidAPI;
}

function useMermaidLoader() {
  const { mermaidAPI } = useMermaidStore();

  React.useEffect(() => {
    if (!mermaidAPI)
      _loadMermaidFromCDN();
  }, [mermaidAPI]);

  return { mermaidAPI, isSuccess: !!mermaidAPI, hasStartedLoading: loadingStarted, error: loadingError };
}


export function RenderCodeMermaid(props: { mermaidCode: string, fitScreen: boolean }) {

  // state
  const [_svgCode, setSvgCode] = React.useState<string | null>(null);
  const hasUnmounted = React.useRef(false);
  const mermaidContainerRef = React.useRef<HTMLDivElement>(null);

  // external state
  const { mermaidAPI, error: mermaidError } = useMermaidLoader();


  // [effect] re-render on code changes
  React.useEffect(() => {

    if (!mermaidAPI)
      return;

    const updateSvgCode = () => {
      const elementId = `mermaid-${Math.random().toString(36).substring(2, 9)}`;
      mermaidAPI
        .render(elementId, props.mermaidCode, mermaidContainerRef.current!)
        .then(({ svg }) => {
          if (mermaidContainerRef.current && !hasUnmounted.current) {
            setSvgCode(svg);
            // bindFunctions?.(mermaidContainerRef.current);
          }
        })
        .catch((error) =>
          console.warn('The AI-generated Mermaid code is invalid, please try again. Details below:\n >>', error.message),
        );
    };

    // strict-mode de-bounce, plus watch for unmounts
    hasUnmounted.current = false;
    const timeout = setTimeout(updateSvgCode, 0);
    return () => {
      hasUnmounted.current = true;
      clearTimeout(timeout);
    };
  }, [mermaidAPI, props.mermaidCode]);


  // render errors when loading Mermaid. for syntax errors, the Error SVG will be rendered in-place
  if (mermaidError)
    return <div>Error: {mermaidError}</div>;

  return (
    <Box
      component='div'
      ref={mermaidContainerRef}
      dangerouslySetInnerHTML={{ __html: patchSvgString(props.fitScreen, _svgCode) || 'Loading Diagram...' }}
      sx={diagramSx}
    />
  );
}
