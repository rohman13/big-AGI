import * as React from 'react';
import type { Diff as TextDiff } from '@sanity/diff-match-patch';

import { AutoBlocksRenderer } from '~/modules/blocks/AutoBlocksRenderer';

import type { ContentScaling } from '~/common/app.theme';
import type { DMessageRole } from '~/common/stores/chat/chat.message';
import { GoodTooltip } from '~/common/components/GoodTooltip';
import { InlineError } from '~/common/components/InlineError';

import { explainServiceErrors } from '../explainServiceErrors';

/**
 * The OG part, comprised of text, which can be markdown, have code blocks, etc.
 * Uses BlocksRenderer to render the markdown/code/html/text, etc.
 */
export function ContentPartText_AutoBlocks(props: {
  textPartText: string,

  messageRole: DMessageRole,
  messageOriginLLM?: string,

  contentScaling: ContentScaling,
  fitScreen: boolean,
  disableMarkdownText: boolean,
  enhanceCodeBlocks: boolean,
  renderTextDiff?: TextDiff[];

  showUnsafeHtml?: boolean,
  optiAllowSubBlocksMemo: boolean,

  onContextMenu?: (event: React.MouseEvent) => void;
  onDoubleClick?: (event: React.MouseEvent) => void;

}) {

  // derived state
  const messageText = props.textPartText;
  const fromAssistant = props.messageRole === 'assistant';

  const errorNode = React.useMemo(
    () => explainServiceErrors(messageText, fromAssistant, props.messageOriginLLM),
    [fromAssistant, messageText, props.messageOriginLLM],
  );

  // if errored, render an Auto-Error message
  if (errorNode) {
    return (
      <GoodTooltip placement='top' arrow title={messageText}>
        <div><InlineError error={<>{errorNode} Hover this message for more details.</>} /></div>
      </GoodTooltip>
    );
  }

  return (
    <AutoBlocksRenderer
      text={messageText || ''}
      fromRole={props.messageRole}
      contentScaling={props.contentScaling}
      fitScreen={props.fitScreen}
      showUnsafeHtml={props.showUnsafeHtml}
      renderSanityTextDiffs={props.renderTextDiff}
      codeRenderVariant={props.enhanceCodeBlocks ? 'enhanced' : 'outlined'}
      textRenderVariant={props.disableMarkdownText ? 'text' : 'markdown'}
      optiAllowSubBlocksMemo={props.optiAllowSubBlocksMemo}
      onContextMenu={props.onContextMenu}
      onDoubleClick={props.onDoubleClick}
    />
  );
}
