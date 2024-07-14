import * as React from 'react';

import { Box, Button, CircularProgress, ColorPaletteProp, Sheet, Typography } from '@mui/joy';
import AbcIcon from '@mui/icons-material/Abc';
import CodeIcon from '@mui/icons-material/Code';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import HtmlIcon from '@mui/icons-material/Html';
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
import PermMediaOutlinedIcon from '@mui/icons-material/PermMediaOutlined';
import PhotoSizeSelectLargeOutlinedIcon from '@mui/icons-material/PhotoSizeSelectLargeOutlined';
import PhotoSizeSelectSmallOutlinedIcon from '@mui/icons-material/PhotoSizeSelectSmallOutlined';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import PivotTableChartIcon from '@mui/icons-material/PivotTableChart';
import TelegramIcon from '@mui/icons-material/Telegram';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import TextureIcon from '@mui/icons-material/Texture';
import WarningRoundedIcon from '@mui/icons-material/WarningRounded';

import { GoodTooltip } from '~/common/components/GoodTooltip';
import { ellipsizeFront, ellipsizeMiddle } from '~/common/util/textUtils';

import type { AttachmentDraft, AttachmentDraftConverterType, AttachmentDraftId } from '~/common/attachment-drafts/attachment.types';
import type { LLMAttachmentDraft } from './useLLMAttachmentDrafts';


// default attachment width
const ATTACHMENT_MIN_STYLE = {
  height: '100%',
  minHeight: '40px',
  minWidth: '64px',
};


const ellipsizeLabel = (label?: string) => {
  if (!label)
    return '';
  return ellipsizeMiddle((label || '')
    .replace(/https?:\/\/(?:www\.)?/, ''), 30)
    .replace(/\/$/, '')
    .replace('…', '…\n…');
};


/**
 * Displayed while a source is loading
 */
const LoadingIndicator = React.forwardRef((props: { label: string }, _ref) =>
  <Sheet
    color='success' variant='soft'
    sx={{
      border: '1px solid',
      borderColor: 'success.solidBg',
      borderRadius: 'sm',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1,
      ...ATTACHMENT_MIN_STYLE,
      boxSizing: 'border-box',
      px: 1,
      py: 0.5,
    }}
  >
    <CircularProgress color='success' size='sm' />
    <Typography level='title-sm' sx={{ whiteSpace: 'nowrap' }}>
      {ellipsizeLabel(props.label)}
    </Typography>
  </Sheet>,
);
LoadingIndicator.displayName = 'LoadingIndicator';


const InputErrorIndicator = () =>
  <WarningRoundedIcon sx={{ color: 'danger.solidBg' }} />;


const converterTypeToIconMap: { [key in AttachmentDraftConverterType]: React.ComponentType<any> } = {
  'text': TextFieldsIcon,
  'rich-text': CodeIcon,
  'rich-text-cleaner': CodeIcon,
  'rich-text-table': PivotTableChartIcon,
  'image-original': ImageOutlinedIcon,
  'image-resized-high': PhotoSizeSelectLargeOutlinedIcon,
  'image-resized-low': PhotoSizeSelectSmallOutlinedIcon,
  'image-to-default': ImageOutlinedIcon,
  'image-ocr': AbcIcon,
  'pdf-text': PictureAsPdfIcon,
  'pdf-images': PermMediaOutlinedIcon,
  'docx-to-html': DescriptionOutlinedIcon,
  'url-page-text': TextFieldsIcon, // was LanguageIcon
  'url-page-markdown': CodeIcon, // was LanguageIcon
  'url-page-html': HtmlIcon, // was LanguageIcon
  'url-page-image': ImageOutlinedIcon,
  'ego-fragments-inlined': TelegramIcon,
  'unhandled': TextureIcon,
};

function attachmentIcon(attachmentDraft: AttachmentDraft): React.ReactNode {
  const activeConterters = attachmentDraft.converters.filter(c => c.isActive);
  if (activeConterters.length === 0)
    return null;
  // 1+ icons
  return <Typography sx={{ display: 'flex', gap: 0.5 }}>
    {/*{activeConterters.some(c => c.id.startsWith('url-page-')) ? <LanguageIcon sx={{ opacity: 0.2, ml: -2.5 }} /> : null}*/}
    {activeConterters.map(c => {
      const Icon = converterTypeToIconMap[c.id] ?? null;
      return Icon ? <Icon key={c.id} sx={{ width: 20, height: 20 }} /> : null;
    })}
  </Typography>;
}

function attachmentLabelText(attachmentDraft: AttachmentDraft): string {
  const converter = attachmentDraft.converters.find(c => c.isActive) ?? null;
  if (converter && attachmentDraft.label === 'Rich Text') {
    if (converter.id === 'rich-text-table')
      return 'Rich Table';
    if (converter.id === 'rich-text-cleaner')
      return 'Clean HTML';
    if (converter.id === 'rich-text')
      return 'Rich HTML';
  }
  return ellipsizeFront(attachmentDraft.label, 24);
}


export function LLMAttachmentItem(props: {
  llmAttachment: LLMAttachmentDraft,
  menuShown: boolean,
  onToggleMenu: (attachmentDraftId: AttachmentDraftId, anchor: HTMLAnchorElement) => void,
}) {

  // derived state
  const { attachmentDraft: draft, llmSupportsAllFragments } = props.llmAttachment;

  const isInputLoading = draft.inputLoading;
  const isInputError = !!draft.inputError;
  const isUnconvertible = !draft.converters.length;
  const isOutputLoading = draft.outputsConverting;
  const isOutputMissing = !draft.outputFragments.length;

  const showWarning = isUnconvertible || (isOutputMissing || !llmSupportsAllFragments);


  // handlers

  const { onToggleMenu } = props;

  const handleToggleMenu = React.useCallback((event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault(); // added for the Right mouse click (to prevent the menu)
    onToggleMenu(draft.id, event.currentTarget);
  }, [draft.id, onToggleMenu]);


  // compose tooltip
  let tooltip: string | null = '';
  if (draft.source.media !== 'text')
    tooltip += draft.source.media + ': ';
  tooltip += draft.label;
  // if (hasInput)
  //   tooltip += `\n(${aInput.mimeType}: ${aInput.dataSize.toLocaleString()} bytes)`;
  // if (aOutputs && aOutputs.length >= 1)
  //   tooltip += `\n\n${JSON.stringify(aOutputs)}`;

  // choose variants and color
  let color: ColorPaletteProp;
  let variant: 'soft' | 'outlined' | 'contained' = 'soft';
  if (isInputLoading || isOutputLoading) {
    color = 'success';
  } else if (isInputError) {
    color = 'danger';
    tooltip = props.menuShown ? null
      : `Issue loading the attachment: ${draft.inputError}\n\n${tooltip}`;
  } else if (showWarning) {
    color = 'warning';
    tooltip = props.menuShown ? null
      : isUnconvertible
        ? `Attachments of type '${draft.input?.mimeType}' are not supported yet. You can open a feature request on GitHub.\n\n${tooltip}`
        : `Not compatible with the selected LLM or file not supported. Please try another format.\n\n${tooltip}`;
  } else {
    // all good
    tooltip = null;
    color = /*props.menuShown ? 'primary' :*/ 'neutral';
    variant = 'outlined';
  }


  return <Box>

    <GoodTooltip
      title={tooltip}
      isError={isInputError}
      isWarning={showWarning}
      sx={{ p: 1, whiteSpace: 'break-spaces' }}
    >
      {isInputLoading
        ? <LoadingIndicator label={draft.label} />
        : (
          <Button
            size='sm'
            variant={variant} color={color}
            onClick={handleToggleMenu}
            onContextMenu={handleToggleMenu}
            sx={{
              backgroundColor: props.menuShown ? `${color}.softActiveBg` : variant === 'outlined' ? 'background.popup' : undefined,
              border: variant === 'soft' ? '1px solid' : undefined,
              borderColor: variant === 'soft' ? `${color}.solidBg` : undefined,
              borderRadius: 'sm',
              ...ATTACHMENT_MIN_STYLE,
              px: 1, py: 0.5,
              display: 'flex', flexDirection: 'row', gap: 1,
            }}
          >
            {isInputError
              ? <InputErrorIndicator />
              : <>
                {attachmentIcon(draft)}
                {isOutputLoading
                  ? <>Converting <CircularProgress color='success' size='sm' /></>
                  : <Typography level='title-sm' sx={{ whiteSpace: 'nowrap' }}>
                    {attachmentLabelText(draft)}
                  </Typography>}
              </>}
          </Button>
        )}
    </GoodTooltip>

  </Box>;
}